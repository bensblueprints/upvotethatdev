import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/contexts/AuthContext';

interface AccountProps {
  setActiveTab?: (tab: string) => void;
}

export const Account = ({ setActiveTab }: AccountProps) => {
  const { user } = useAuth();
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  usePageTitle('Account');

  // Fetch user statistics
  const fetchUserStats = async () => {
    if (!user) return null;

    // Fetch upvote orders
    const { data: upvoteOrders, error: upvoteError } = await supabase
      .from('upvote_orders')
      .select('*')
      .eq('user_id', user.id);

    if (upvoteError) throw upvoteError;

    // Fetch comment orders  
    const { data: commentOrders, error: commentError } = await supabase
      .from('comment_orders')
      .select('*')
      .eq('user_id', user.id);

    if (commentError) throw commentError;

    // Fetch transactions for total spent calculation
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .in('type', ['purchase', 'reddit_account_purchase']);

    if (transactionError) throw transactionError;

    // Calculate stats
    const totalOrders = (upvoteOrders?.length || 0) + (commentOrders?.length || 0);
    
    const completedCommentOrders = commentOrders?.filter(order => 
      order.status.toLowerCase() === 'completed'
    ).length || 0;
    
    const totalUpvotesDelivered = upvoteOrders?.reduce((sum, order) => {
      const votesDelivered = (order as any).votes_delivered ?? 0;
      return sum + votesDelivered;
    }, 0) || 0;
    
    const totalSpent = transactions?.reduce((sum, transaction) => {
      return sum + Math.abs(transaction.amount);
    }, 0) || 0;

    return {
      totalOrders,
      totalUpvotesDelivered,
      completedCommentOrders,
      totalSpent
    };
  };

  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: fetchUserStats,
    enabled: !!user,
  });

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-stone-900">Account Settings</h1>
        <p className="text-stone-500 mt-2">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value="reddit_marketer" disabled />
            </div>
            <div className="space-y-2">
              <Label>Account Status</Label>
              <div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Two-Factor Authentication</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Add an extra layer of security</span>
                <Button variant="outline" size="sm">
                  Enable 2FA
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Change your account password</span>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Login Sessions</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Manage active sessions</span>
                <Button variant="outline" size="sm">
                  View Sessions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Your account usage this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingStats ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="text-center p-4 bg-stone-50 rounded-lg">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
                    <div className="text-sm text-stone-400">Loading...</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {userStats?.totalOrders || 0}
                  </div>
                  <div className="text-sm text-blue-600">Total Orders</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {userStats?.totalUpvotesDelivered.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-green-600">Upvotes Delivered</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {userStats?.completedCommentOrders || 0}
                  </div>
                  <div className="text-sm text-orange-600">Comments Posted</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    ${userStats?.totalSpent.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-purple-600">Total Spent</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>Manage your billing and payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Current Balance</span>
                {isLoadingProfile ? (
                   <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                   <span className="text-lg font-bold text-green-600">{formatCurrency(profile?.balance)}</span>
                )}
              </div>
              <div className="text-sm text-stone-600">Available for orders</div>
            </div>
            <Button 
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => setActiveTab && setActiveTab('add-funds')}
            >
              Add Funds
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setActiveTab && setActiveTab('transaction-history')}
            >
              View Billing History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
