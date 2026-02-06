import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Loader2, Pencil, PlusCircle, Trash2 } from 'lucide-react';

type AffiliateLink = {
  id: string;
  created_at: string;
  created_by: string | null;
  label: string;
  url: string;
  icon_url: string | null;
  sort_order: number;
  enabled: boolean;
};

const affiliateSchema = z.object({
  label: z.string().min(1, 'Text is required'),
  url: z.string().url('Must be a valid URL'),
  icon_url: z.string().url('Must be a valid URL').or(z.literal('')).nullable(),
  sort_order: z.coerce.number().int().min(0),
  enabled: z.boolean(),
});

async function fetchAffiliateLinks(): Promise<AffiliateLink[]> {
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('id, created_at, created_by, label, url, icon_url, sort_order, enabled')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    // If the table doesn't exist yet in a dev environment, don't break the UI.
    if ((error as any)?.message?.toLowerCase?.().includes('does not exist')) return [];
    throw new Error(error.message);
  }
  return (data || []) as any;
}

export const AdminAffiliateLinks = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: links, isLoading } = useQuery<AffiliateLink[]>({
    queryKey: ['affiliate_links'],
    queryFn: fetchAffiliateLinks,
  });

  const selected = useMemo(() => links?.find((l) => l.id === selectedId) || null, [links, selectedId]);

  const form = useForm<z.infer<typeof affiliateSchema>>({
    resolver: zodResolver(affiliateSchema),
    defaultValues: {
      label: '',
      url: '',
      icon_url: '',
      sort_order: 0,
      enabled: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: z.infer<typeof affiliateSchema>) => {
      if (!user) throw new Error('User not authenticated');
      const payload = {
        label: values.label,
        url: values.url,
        icon_url: values.icon_url || null,
        sort_order: values.sort_order,
        enabled: values.enabled,
        created_by: user.id,
      };

      if (dialogMode === 'add') {
        const { error } = await supabase.from('affiliate_links').insert(payload);
        if (error) throw new Error(error.message);
        return true;
      }

      if (!editingId) throw new Error('Missing id');
      const { error } = await supabase.from('affiliate_links').update(payload).eq('id', editingId);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate_links'] });
      toast({
        title: 'Saved',
        description: dialogMode === 'add' ? 'Affiliate link added.' : 'Affiliate link updated.',
      });
      setIsDialogOpen(false);
      setDialogMode('add');
      setEditingId(null);
      form.reset({ label: '', url: '', icon_url: '', sort_order: 0, enabled: true });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase.from('affiliate_links').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate_links'] });
      toast({ title: 'Deleted', description: 'Affiliate link deleted.' });
      setSelectedId(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const openAdd = () => {
    setDialogMode('add');
    setEditingId(null);
    form.reset({ label: '', url: '', icon_url: '', sort_order: 0, enabled: true });
    setIsDialogOpen(true);
  };

  const openEdit = (link: AffiliateLink) => {
    setDialogMode('edit');
    setEditingId(link.id);
    form.reset({
      label: link.label,
      url: link.url,
      icon_url: link.icon_url || '',
      sort_order: link.sort_order || 0,
      enabled: !!link.enabled,
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = (link: AffiliateLink) => {
    const ok = window.confirm(`Delete "${link.label}"?`);
    if (!ok) return;
    deleteMutation.mutate(link.id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-stone-900">Affiliate Links</h1>
          <p className="text-sm text-stone-500 mt-1">Add links that appear in the sidebar.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Link
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle className="font-display">{dialogMode === 'add' ? 'Add Affiliate Link' : 'Edit Affiliate Link'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Example: Tools we use" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affiliate Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/your-affiliate" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/icon.png" value={(field.value as any) ?? ''} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 mt-7">
                        <div>
                          <p className="text-sm font-medium text-stone-900">Enabled</p>
                          <p className="text-xs text-stone-500">Show this link in the sidebar</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {dialogMode === 'add' ? 'Add Link' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {selected && (
        <div className="mb-4 bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate">{selected.label}</p>
              <p className="text-xs text-stone-500 mt-0.5 break-all">{selected.url}</p>
              <div className="mt-3 flex items-center gap-3">
                {selected.icon_url ? (
                  <img src={selected.icon_url} alt="" className="w-8 h-8 rounded-lg border border-stone-200 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50" />
                )}
                <span className="text-xs text-stone-600">Order: {selected.sort_order} · {selected.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => openEdit(selected)}>
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => confirmDelete(selected)} disabled={deleteMutation.isPending}>
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
              <TableHead>Text</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading…
                </TableCell>
              </TableRow>
            ) : (links || []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-stone-500">
                  No affiliate links yet.
                </TableCell>
              </TableRow>
            ) : (
              (links || []).map((l) => (
                <TableRow key={l.id} className="cursor-pointer" onClick={() => setSelectedId(l.id)}>
                  <TableCell className="font-medium text-stone-900">{l.label}</TableCell>
                  <TableCell className="max-w-[360px]">
                    <span className="block text-sm text-stone-600 break-all">{l.url}</span>
                  </TableCell>
                  <TableCell>{l.sort_order}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${l.enabled ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-700'}`}>
                      {l.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="outline" size="icon" onClick={() => openEdit(l)} aria-label="Edit link">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => confirmDelete(l)} aria-label="Delete link" disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

