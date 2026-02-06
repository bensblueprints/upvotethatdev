import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const AdminUserBalances = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  type AdminUser = {
    id: string;
    email: string | null;
    balance: number | null;
    is_admin: boolean | null;
    created_at: string | null;
  };

  type AdminTransaction = {
    id: string;
    type: string;
    amount: number;
    description: string | null;
    status: string;
    created_at: string;
    upvote_order_id: number | null;
    user_id: string;
    order?: null | {
      kind: 'upvote' | 'comment';
      order_type: string;
      quantity: number | null;
      link: string | null;
      subreddit: string | null;
      service?: number | null;
      speed?: number | null;
      order_status?: string | null;
      comment_order_id?: number;
    };
  };

  const [searchText, setSearchText] = useState('');
  const trimmedSearch = useMemo(() => searchText.trim(), [searchText]);

  const [activeUser, setActiveUser] = useState<AdminUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [delta, setDelta] = useState<string>('0');
  const [balance, setBalance] = useState<string>('0');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    data: usersResp,
    isLoading: usersLoading,
    isFetching: usersFetching,
    isError: usersIsError,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['admin-users', trimmedSearch],
    queryFn: async (): Promise<{ users: AdminUser[]; count: number | null }> => {
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        body: { q: trimmedSearch || undefined, limit: 200, offset: 0 },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(`${data?.code || 'FAILED'}: ${data?.message || 'Failed to load users'}`);
      return { users: (data.users || []) as AdminUser[], count: (data.count ?? null) as number | null };
    },
    staleTime: 10_000,
  });

  const activeUserId = activeUser?.id || null;
  const {
    data: txResp,
    isLoading: txLoading,
    isFetching: txFetching,
    isError: txIsError,
    error: txError,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['admin-user-transactions', activeUserId],
    enabled: !!activeUserId && dialogOpen,
    queryFn: async (): Promise<{ transactions: AdminTransaction[]; count: number | null }> => {
      const { data, error } = await supabase.functions.invoke('admin-user-transactions', {
        body: { target_user_id: activeUserId, limit: 100, offset: 0 },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(`${data?.code || 'FAILED'}: ${data?.message || 'Failed to load transactions'}`);
      return { transactions: (data.transactions || []) as AdminTransaction[], count: (data.count ?? null) as number | null };
    },
    staleTime: 5_000,
  });

  const users = usersResp?.users || [];

  const openUser = (user: AdminUser) => {
    setActiveUser(user);
    setDelta('0');
    setBalance(String(Number(user.balance ?? 0).toFixed(2)));
    setReason('');
    setDialogOpen(true);
  };

  const submit = async (mode: 'adjust' | 'set', deltaOverride?: number) => {
    if (!activeUser?.id) return;

    const num = mode === 'adjust' ? (typeof deltaOverride === 'number' ? deltaOverride : Number(delta)) : Number(balance);
    if (!Number.isFinite(num)) {
      toast({ title: 'Validation', description: 'Enter a valid number.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-adjust-balance', {
        body:
          mode === 'adjust'
            ? { mode, target_user_id: activeUser.id, delta: num, reason: reason.trim() || undefined }
            : { mode, target_user_id: activeUser.id, balance: num, reason: reason.trim() || undefined },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.message || 'Failed to update balance');

      toast({
        title: 'Balance updated',
        description: `${data.target?.email || activeUser.email || activeUser.id}: $${Number(data.previous_balance ?? 0).toFixed(2)} → $${Number(data.balance ?? 0).toFixed(2)}`,
      });

      // Refresh list + transactions
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-user-transactions', activeUser.id] }),
      ]);

      // Update local active user balance optimistically (for the dialog header)
      setActiveUser((prev) => (prev ? { ...prev, balance: Number(data.balance ?? prev.balance ?? 0) } : prev));
      setBalance(String(Number(data.balance ?? 0).toFixed(2)));
      refetchTx();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'Failed to update balance.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-stone-900">User Balances</h1>
        <p className="text-stone-500 mt-2">Search users, view transaction history, and adjust balances.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Admin tool
          </CardTitle>
          <CardDescription>Pick a user to view their history and edit their balance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-2 w-full sm:max-w-md">
              <Label htmlFor="admin-users-search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  id="admin-users-search"
                  placeholder="Search by email…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => refetchUsers()}
              disabled={usersFetching}
              className="self-start sm:self-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${usersFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[140px]">Balance</TableHead>
                  <TableHead className="w-[110px]">Role</TableHead>
                  <TableHead className="w-[130px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  [...Array(8)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-4">
                        <div className="h-4 w-56 bg-stone-100 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 bg-stone-100 rounded animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-16 bg-stone-100 rounded animate-pulse" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="h-8 w-24 bg-stone-100 rounded animate-pulse ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : usersIsError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10">
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <div className="font-semibold">Failed to load users</div>
                        <div className="mt-1 break-words">{(usersError as any)?.message || 'Unknown error'}</div>
                        <div className="mt-2 text-xs text-red-700/80">
                          If you just added these, make sure the Supabase functions `admin-list-users` and `admin-user-transactions` are deployed.
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-stone-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-stone-50">
                      <TableCell className="text-sm">
                        <div className="font-medium text-stone-900">{u.email || u.id}</div>
                        <div className="text-xs text-stone-500">{u.id}</div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${(Number(u.balance ?? 0) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {u.is_admin ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Admin</Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" size="sm" onClick={() => openUser(u)} className="bg-stone-900 hover:bg-stone-800">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit user balance</DialogTitle>
            <DialogDescription>
              {activeUser?.email || activeUser?.id} · Current balance: <span className="font-semibold">${(Number(activeUser?.balance ?? 0) || 0).toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bal-reason">Reason (optional)</Label>
              <Input
                id="bal-reason"
                type="text"
                placeholder="e.g. manual credit, refund, promo"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={saving}
              />
            </div>

            <Tabs defaultValue="history">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">Transaction history</TabsTrigger>
                <TabsTrigger value="edit">Edit balance</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-stone-600">
                    Showing latest 100 transactions{txResp?.count ? ` (of ${txResp.count})` : ''}.
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => refetchTx()} disabled={txFetching}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${txFetching ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <div className="rounded-xl border border-stone-200">
                  <div className="w-full overflow-x-auto">
                    <Table className="min-w-[980px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[190px]">Date</TableHead>
                          <TableHead className="w-[140px]">Order</TableHead>
                          <TableHead className="w-[160px]">Subreddit</TableHead>
                          <TableHead className="w-[90px] text-right">Qty</TableHead>
                          <TableHead>Post</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[120px] text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {txLoading ? (
                        [...Array(6)].map((_, i) => (
                          <TableRow key={i}>
                            <TableCell className="py-4"><div className="h-4 w-28 bg-stone-100 rounded animate-pulse" /></TableCell>
                            <TableCell><div className="h-4 w-24 bg-stone-100 rounded animate-pulse" /></TableCell>
                            <TableCell><div className="h-4 w-24 bg-stone-100 rounded animate-pulse" /></TableCell>
                            <TableCell className="text-right"><div className="h-4 w-10 bg-stone-100 rounded animate-pulse ml-auto" /></TableCell>
                            <TableCell><div className="h-4 w-40 bg-stone-100 rounded animate-pulse" /></TableCell>
                            <TableCell><div className="h-4 w-64 bg-stone-100 rounded animate-pulse" /></TableCell>
                            <TableCell className="text-right"><div className="h-4 w-16 bg-stone-100 rounded animate-pulse ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : txIsError ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10">
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                              <div className="font-semibold">Failed to load transactions</div>
                              <div className="mt-1 break-words">{(txError as any)?.message || 'Unknown error'}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (txResp?.transactions?.length || 0) === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-10 text-center text-stone-500">
                            No transactions found for this user.
                          </TableCell>
                        </TableRow>
                      ) : (
                        (txResp?.transactions || []).map((t) => (
                          <TableRow key={t.id}>
                            <TableCell className="text-xs text-stone-600">
                              {new Date(t.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-stone-700">
                                {t.order?.order_type || t.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-stone-800">
                              {t.order?.subreddit ? `r/${t.order.subreddit}` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-medium text-stone-800">
                              {typeof t.order?.quantity === 'number' ? t.order.quantity : '—'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {t.order?.link ? (
                                <a
                                  href={t.order.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-700 hover:text-indigo-800 underline underline-offset-2 whitespace-nowrap"
                                  title={t.order.link}
                                >
                                  Open
                                </a>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-stone-800">
                              {t.description || '—'}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${t.amount >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                              {t.amount >= 0 ? '+' : '-'}${Math.abs(Number(t.amount)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="edit" className="mt-4 space-y-4">
                <Tabs defaultValue="adjust">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="adjust">Adjust (+/-)</TabsTrigger>
                    <TabsTrigger value="set">Set exact</TabsTrigger>
                  </TabsList>

                  <TabsContent value="adjust" className="mt-4 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bal-delta">Amount (USD)</Label>
                      <Input
                        id="bal-delta"
                        type="number"
                        step="0.01"
                        value={delta}
                        onChange={(e) => setDelta(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Button
                        onClick={() => submit('adjust', Math.abs(Number(delta)))}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>) : 'Add'}
                      </Button>
                      <Button
                        onClick={() => submit('adjust', -Math.abs(Number(delta)))}
                        disabled={saving}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>) : 'Subtract'}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="set" className="mt-4 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bal-set">New balance (USD)</Label>
                      <Input
                        id="bal-set"
                        type="number"
                        step="0.01"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        disabled={saving}
                      />
                    </div>
                    <Button onClick={() => submit('set')} disabled={saving} className="bg-stone-900 hover:bg-stone-800">
                      {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>) : 'Set balance'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

