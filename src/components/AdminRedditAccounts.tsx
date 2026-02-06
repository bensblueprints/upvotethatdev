
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, PlusCircle, Trash2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

// Use the generated type from Supabase
type RedditAccount = Tables<'reddit_accounts'>;

const accountSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  email_password: z.string().min(1, 'Email password is required'),
  post_karma: z.coerce.number().int().min(0),
  comment_karma: z.coerce.number().int().min(0),
  account_age_years: z.coerce.number().min(0).nullable(),
  profile_url: z.string().url().or(z.literal('')).nullable(),
  buy_price: z.coerce.number().min(0),
  sell_price: z.coerce.number().min(0),
});

async function fetchAccounts(): Promise<RedditAccount[]> {
  const { data, error } = await supabase
    .from('reddit_accounts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data || [];
}

export const AdminRedditAccounts = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const { data: accounts, isLoading } = useQuery<RedditAccount[]>({ 
    queryKey: ['reddit_accounts'], 
    queryFn: fetchAccounts 
  });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts?.find((a) => a.id === selectedAccountId) || null;
  }, [accounts, selectedAccountId]);

  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      email_password: '',
      post_karma: 0,
      comment_karma: 0,
      account_age_years: 0,
      profile_url: '',
      buy_price: 0,
      sell_price: 0,
    },
  });

  const saveAccountMutation = useMutation({
    mutationFn: async (values: z.infer<typeof accountSchema>) => {
      if (!user) throw new Error('User not authenticated');

      if (dialogMode === 'add') {
        const { data, error } = await supabase
          .from('reddit_accounts')
          .insert({ ...values, created_by_admin_id: user.id })
          .select();
        if (error) throw new Error(error.message);
        return data;
      }

      if (!editingAccountId) throw new Error('Missing account id to edit');
      const { data, error } = await supabase
        .from('reddit_accounts')
        .update({ ...values })
        .eq('id', editingAccountId)
        .select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reddit_accounts'] });
      toast({
        title: 'Success',
        description: dialogMode === 'add' ? 'Reddit account added successfully.' : 'Reddit account updated successfully.',
      });
      setIsDialogOpen(false);
      setEditingAccountId(null);
      setDialogMode('add');
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase.from('reddit_accounts').delete().eq('id', accountId);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reddit_accounts'] });
      toast({ title: 'Deleted', description: 'Reddit account deleted.' });
      if (selectedAccountId === editingAccountId) {
        setSelectedAccountId(null);
      }
      setEditingAccountId(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = (values: z.infer<typeof accountSchema>) => {
    saveAccountMutation.mutate(values);
  };

  const openAddDialog = () => {
    setDialogMode('add');
    setEditingAccountId(null);
    form.reset({
      username: '',
      password: '',
      email: '',
      email_password: '',
      post_karma: 0,
      comment_karma: 0,
      account_age_years: 0,
      profile_url: '',
      buy_price: 0,
      sell_price: 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (account: RedditAccount) => {
    setDialogMode('edit');
    setEditingAccountId(account.id);
    form.reset({
      username: account.username || '',
      password: account.password || '',
      email: account.email || '',
      email_password: account.email_password || '',
      post_karma: account.post_karma ?? 0,
      comment_karma: account.comment_karma ?? 0,
      account_age_years: account.account_age_years ?? 0,
      profile_url: account.profile_url || '',
      buy_price: account.buy_price ?? 0,
      sell_price: account.sell_price ?? 0,
    });
    setIsDialogOpen(true);
  };

  const confirmAndDelete = (account: RedditAccount) => {
    const ok = window.confirm(`Delete account "${account.username}"? This cannot be undone.`);
    if (!ok) return;
    deleteAccountMutation.mutate(account.id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold font-display text-stone-900">Manage Reddit Accounts</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{dialogMode === 'add' ? 'Add New Reddit Account' : 'Edit Reddit Account'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
                <FormField control={form.control} name="username" render={({ field }) => ( <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="email_password" render={({ field }) => ( <FormItem><FormLabel>Email Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="post_karma" render={({ field }) => ( <FormItem><FormLabel>Post Karma</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="comment_karma" render={({ field }) => ( <FormItem><FormLabel>Comment Karma</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={form.control} name="profile_url" render={({ field }) => ( <FormItem><FormLabel>Profile URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="account_age_years" render={({ field }) => ( <FormItem><FormLabel>Account Age (Years)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="buy_price" render={({ field }) => ( <FormItem><FormLabel>Buy Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField control={form.control} name="sell_price" render={({ field }) => ( <FormItem><FormLabel>Sell Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={saveAccountMutation.isPending}>
                    {saveAccountMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {dialogMode === 'add' ? 'Add Account' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedAccount && (
        <div className="mb-4 bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate">{selectedAccount.username}</p>
              <p className="text-xs text-stone-500 mt-0.5 truncate">Email: {selectedAccount.email}</p>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-stone-50 border border-stone-200 p-2">
                  <p className="text-stone-500">Total karma</p>
                  <p className="font-semibold text-stone-900">{selectedAccount.total_karma}</p>
                </div>
                <div className="rounded-lg bg-stone-50 border border-stone-200 p-2">
                  <p className="text-stone-500">Age</p>
                  <p className="font-semibold text-stone-900">{selectedAccount.account_age_years ?? '—'} yrs</p>
                </div>
                <div className="rounded-lg bg-stone-50 border border-stone-200 p-2">
                  <p className="text-stone-500">Sell price</p>
                  <p className="font-semibold text-stone-900">${selectedAccount.sell_price}</p>
                </div>
                <div className="rounded-lg bg-stone-50 border border-stone-200 p-2">
                  <p className="text-stone-500">Status</p>
                  <p className="font-semibold text-stone-900">{selectedAccount.status}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedAccount)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => confirmAndDelete(selectedAccount)}
                disabled={deleteAccountMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Total Karma</TableHead>
              <TableHead>Sell Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
            ) : accounts?.map((account) => (
              <TableRow
                key={account.id}
                className="cursor-pointer"
                onClick={() => setSelectedAccountId(account.id)}
              >
                <TableCell>{account.username}</TableCell>
                <TableCell>{account.total_karma}</TableCell>
                <TableCell>${account.sell_price}</TableCell>
                <TableCell><span className={`px-2 py-1 rounded-full text-xs font-medium ${account.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{account.status}</span></TableCell>
                <TableCell>{new Date(account.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(account)} aria-label="Edit account">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => confirmAndDelete(account)}
                      disabled={deleteAccountMutation.isPending}
                      aria-label="Delete account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
