
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

// Use the generated type from Supabase
type RedditAccount = Tables<'reddit_accounts'>;

const fetchMyPurchasedAccounts = async (userId: string | undefined): Promise<RedditAccount[]> => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('reddit_accounts')
    .select('*')
    .eq('sold_to_user_id', userId);
  
  if (error) throw error;
  return data || [];
};

export const MyPurchasedAccounts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: accounts, isLoading } = useQuery<RedditAccount[]>({
    queryKey: ['myPurchasedAccounts', user?.id],
    queryFn: () => fetchMyPurchasedAccounts(user?.id),
    enabled: !!user,
  });

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${fieldName} copied to clipboard.` });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Purchased Accounts</CardTitle>
          <CardDescription>Here are the Reddit accounts you've purchased. Keep these credentials safe.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Email Password</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={4}>Loading your accounts...</TableCell></TableRow>}
              {accounts && accounts.length === 0 && <TableRow><TableCell colSpan={4}>You haven't purchased any accounts yet.</TableCell></TableRow>}
              {accounts?.map(acc => (
                <TableRow key={acc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {acc.username}
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(acc.username, 'Username')}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                   <TableCell>
                    <div className="flex items-center gap-2">
                      ••••••••
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(acc.password, 'Password')}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {acc.email}
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(acc.email, 'Email')}><Copy className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      ••••••••
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(acc.email_password, 'Email Password')}><Copy className="h-4 w-4" /></Button>
                    </div>
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
