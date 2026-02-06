import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Clock, DollarSign, ThumbsUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Tables } from '@/integrations/supabase/types';
import { SERVICE_OPTIONS } from '@/lib/api';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type UpvoteOrder = Tables<'upvote_orders'>;
type CommentOrder = Tables<'comment_orders'>;
type Transaction = Tables<'transactions'>;

export const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  usePageTitle('Home');

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
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
      .in('type', ['purchase', 'reddit_account_purchase']); // Only purchase transactions

    if (transactionError) throw transactionError;

    // Calculate stats
    const totalOrders = (upvoteOrders?.length || 0) + (commentOrders?.length || 0);
    
    const activeUpvoteOrders = upvoteOrders?.filter(order => 
      ['Pending', 'In progress'].includes(order.status)
    ).length || 0;
    
    const activeCommentOrders = commentOrders?.filter(order => 
      ['Pending', 'In progress'].includes(order.status)
    ).length || 0;
    
    const activeOrders = activeUpvoteOrders + activeCommentOrders;
    
    const completedCommentOrders = commentOrders?.filter(order => 
      order.status.toLowerCase() === 'completed'
    ).length || 0;
    
    // Calculate total upvotes delivered
    const totalUpvotesDelivered = upvoteOrders?.reduce((sum, order) => {
      const votesDelivered = (order as any).votes_delivered ?? 0;
      return sum + votesDelivered;
    }, 0) || 0;
    
    // Calculate total spent (sum of absolute values of negative transaction amounts)
    const totalSpent = transactions?.reduce((sum, transaction) => {
      return sum + Math.abs(transaction.amount);
    }, 0) || 0;

    // Calculate percentage changes based on last 30 days vs previous 30 days
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(currentDate.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    // Recent orders (last 30 days)
    const recentOrders = [...(upvoteOrders || []), ...(commentOrders || [])].filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    );
    
    // Previous period orders (31-60 days ago)
    const previousOrders = [...(upvoteOrders || []), ...(commentOrders || [])].filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
    });
    
    const recentActiveOrders = [...(upvoteOrders || []), ...(commentOrders || [])].filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo && ['Pending', 'In progress'].includes(order.status)
    );

    const previousActiveOrders = [...(upvoteOrders || []), ...(commentOrders || [])].filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo && ['Pending', 'In progress'].includes(order.status);
    });

    const recentCompletedComments = (commentOrders || []).filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo && order.status.toLowerCase() === 'completed'
    );

    const previousCompletedComments = (commentOrders || []).filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo && order.status.toLowerCase() === 'completed';
    });

    const recentUpvotesDelivered = upvoteOrders?.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    ).reduce((sum, order) => {
      const votesDelivered = (order as any).votes_delivered ?? 0;
      return sum + votesDelivered;
    }, 0) || 0;

    const previousUpvotesDelivered = upvoteOrders?.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
    }).reduce((sum, order) => {
      const votesDelivered = (order as any).votes_delivered ?? 0;
      return sum + votesDelivered;
    }, 0) || 0;

    const recentSpent = transactions?.filter(transaction => 
      new Date(transaction.created_at) >= thirtyDaysAgo
    ).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0) || 0;

    const previousSpent = transactions?.filter(transaction => {
      const transactionDate = new Date(transaction.created_at);
      return transactionDate >= sixtyDaysAgo && transactionDate < thirtyDaysAgo;
    }).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0) || 0;

    // Calculate actual changes vs previous period
    const totalOrdersChange = recentOrders.length - previousOrders.length;
    const activeOrdersChange = recentActiveOrders.length - previousActiveOrders.length;
    const completedCommentsChange = recentCompletedComments.length - previousCompletedComments.length;
    const upvotesChange = recentUpvotesDelivered - previousUpvotesDelivered;
    const spentChange = recentSpent - previousSpent;

    return {
      totalOrders,
      activeOrders,
      completedCommentOrders,
      totalUpvotesDelivered,
      totalSpent,
      changes: {
        totalOrders: totalOrdersChange,
        activeOrders: activeOrdersChange,
        completedCommentOrders: completedCommentsChange,
        totalUpvotesDelivered: upvotesChange,
        totalSpent: spentChange
      }
    };
  };

  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats', user?.id],
    queryFn: fetchDashboardStats,
    enabled: !!user,
  });

  const fetchRecentOrders = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('upvote_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4);
    if (error) {
      toast({ title: 'Error fetching recent orders', description: error.message, variant: 'destructive' });
      throw new Error(error.message);
    }
    return data;
  };

  const { data: recentOrders, isLoading: isLoadingOrders } = useQuery<UpvoteOrder[]>({
    queryKey: ['recentUpvoteOrders', user?.id],
    queryFn: fetchRecentOrders,
    enabled: !!user,
  });

  const getServiceLabel = (serviceId: number) => {
    return SERVICE_OPTIONS.find(opt => opt.value === serviceId)?.label || 'Unknown Service';
  };

  const getStatusDotColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in progress': return 'bg-orange-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate stats array with real data and proper change indicators
  const stats = dashboardStats ? [
    {
      title: 'Total Orders',
      value: dashboardStats.totalOrders.toString(),
      change: dashboardStats.changes.totalOrders >= 0 ? `+${dashboardStats.changes.totalOrders}` : `${dashboardStats.changes.totalOrders}`,
      changeText: 'vs last 30 days',
      icon: TrendingUp,
      color: 'text-blue-600',
      changeColor: dashboardStats.changes.totalOrders >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Active Orders',
      value: dashboardStats.activeOrders.toString(),
      change: dashboardStats.changes.activeOrders >= 0 ? `+${dashboardStats.changes.activeOrders}` : `${dashboardStats.changes.activeOrders}`,
      changeText: 'vs last 30 days',
      icon: Clock,
      color: 'text-orange-600',
      changeColor: dashboardStats.changes.activeOrders >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Comments Posted',
      value: dashboardStats.completedCommentOrders.toString(),
      change: dashboardStats.changes.completedCommentOrders >= 0 ? `+${dashboardStats.changes.completedCommentOrders}` : `${dashboardStats.changes.completedCommentOrders}`,
      changeText: 'vs last 30 days',
      icon: MessageSquare,
      color: 'text-green-600',
      changeColor: dashboardStats.changes.completedCommentOrders >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Upvotes Delivered',
      value: dashboardStats.totalUpvotesDelivered.toLocaleString(),
      change: dashboardStats.changes.totalUpvotesDelivered >= 0 ? `+${dashboardStats.changes.totalUpvotesDelivered.toLocaleString()}` : `${dashboardStats.changes.totalUpvotesDelivered.toLocaleString()}`,
      changeText: 'vs last 30 days',
      icon: ThumbsUp,
      color: 'text-emerald-600',
      changeColor: dashboardStats.changes.totalUpvotesDelivered >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Total Spent',
      value: `$${dashboardStats.totalSpent.toFixed(2)}`,
      change: dashboardStats.changes.totalSpent >= 0 ? `+$${dashboardStats.changes.totalSpent.toFixed(2)}` : `-$${Math.abs(dashboardStats.changes.totalSpent).toFixed(2)}`,
      changeText: 'vs last 30 days',
      icon: DollarSign,
      color: 'text-purple-600',
      changeColor: dashboardStats.changes.totalSpent >= 0 ? 'text-green-600' : 'text-red-600',
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-stone-900">Dashboard</h1>
        <p className="text-stone-500 mt-2">Monitor your Reddit marketing campaigns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {isLoadingStats ? (
          // Loading skeletons for stats cards
          Array.from({ length: 5 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="w-4 h-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-stone-500">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs mt-1 ${stat.changeColor || 'text-green-600'}`}>
                    {stat.change} {stat.changeText}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Your latest upvote and comment orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingOrders ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              ))
            ) : recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-stone-200 rounded-xl bg-white hover:bg-stone-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${getStatusDotColor(order.status)}`}></div>
                    <div>
                      <p className="font-medium">Order #{order.id}</p>
                      <p className="text-sm text-stone-500">{getServiceLabel(order.service)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-stone-500">{order.quantity} votes</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeColor(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-sm text-stone-400">{format(new Date(order.created_at), 'yyyy-MM-dd')}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-stone-500 py-8">No recent orders found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
