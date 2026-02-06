
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/integrations/supabase/types';

// Use the generated type from Supabase
type RedditAccount = Tables<'reddit_accounts'>;

const fetchAvailableAccounts = async (): Promise<RedditAccount[]> => {
  const { data, error } = await supabase
    .from('reddit_accounts')
    .select('*')
    .eq('status', 'available')
    .order('sell_price', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

// This function will be created in the database in the next step.
const purchaseAccount = async (accountId: string) => {
  const { data, error } = await supabase.rpc('purchase_reddit_account', { account_id: accountId });
  if (error) throw new Error(error.message);
  if (typeof data === 'string' && data.startsWith('Error')) throw new Error(data);
  return data;
};

export const BuyRedditAccounts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery<RedditAccount[]>({
    queryKey: ['availableRedditAccounts'],
    queryFn: fetchAvailableAccounts,
  });

  const purchaseMutation = useMutation({
    mutationFn: purchaseAccount,
    onSuccess: (data) => {
      toast({ title: 'Purchase Successful!', description: data as string });
      queryClient.invalidateQueries({ queryKey: ['availableRedditAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['myPurchasedAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] }); // Invalidate profile to update balance
    },
    onError: (error: any) => {
      toast({ title: 'Purchase Failed', description: error.message, variant: 'destructive' });
    }
  });

  const maskUsername = (username: string) => {
    if (username.length <= 4) return "****";
    return username.slice(0, 3) + '...'.padEnd(username.length - 4, '*') + username.slice(-1);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buy Reddit Accounts</CardTitle>
          <CardDescription>Browse available, high-karma Reddit accounts for your marketing needs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Total Karma</TableHead>
                <TableHead>Post Karma</TableHead>
                <TableHead>Comment Karma</TableHead>
                <TableHead>Age (Years)</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={7}>Loading accounts...</TableCell></TableRow>}
              {accounts?.map(acc => (
                <TableRow key={acc.id}>
                  <TableCell className="font-mono flex items-center gap-2">{maskUsername(acc.username)} <Badge variant="secondary">Verified</Badge></TableCell>
                  <TableCell className="font-bold">{acc.total_karma}</TableCell>
                  <TableCell>{acc.post_karma}</TableCell>
                  <TableCell>{acc.comment_karma}</TableCell>
                  <TableCell>{acc.account_age_years || 'N/A'}</TableCell>
                  <TableCell className="font-bold text-green-600">${acc.sell_price}</TableCell>
                  <TableCell>
                    <Button onClick={() => purchaseMutation.mutate(acc.id)} disabled={purchaseMutation.isPending}>
                      {purchaseMutation.isPending && purchaseMutation.variables === acc.id ? 'Processing...' : 'Buy Now'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
