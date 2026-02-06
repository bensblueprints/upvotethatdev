import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Clock, Timer, Trash2, ExternalLink, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SERVICE_OPTIONS, api } from '@/lib/api';
import { usePageTitle } from '@/hooks/usePageTitle';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';

type UpvoteOrder = Tables<'upvote_orders'>;
type CommentOrder = Tables<'comment_orders'>;

interface OrderTrackingProps {
  orderType?: 'upvotes' | 'comments';
}

export const OrderTracking = ({ orderType = 'upvotes' }: OrderTrackingProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<UpvoteOrder | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lastBulkRefresh, setLastBulkRefresh] = useState<number | null>(null);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [individualCooldowns, setIndividualCooldowns] = useState<Record<number, number>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  usePageTitle('Order Tracking');

  // Rate limiting configuration
  const REFRESH_COOLDOWN_SECONDS = 120; // 2 minutes cooldown for bulk updates
  const INDIVIDUAL_COOLDOWN_SECONDS = 30; // 30 seconds cooldown for individual updates

  // Update cooldown timer every second
  useEffect(() => {
    if (!lastBulkRefresh) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRefresh = Math.floor((now - lastBulkRefresh) / 1000);
      const remainingCooldown = Math.max(0, REFRESH_COOLDOWN_SECONDS - timeSinceLastRefresh);
      
      setRefreshCooldown(remainingCooldown);
      
      if (remainingCooldown === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBulkRefresh, REFRESH_COOLDOWN_SECONDS]);

  // Update individual cooldown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setIndividualCooldowns(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.keys(updated).forEach(orderIdStr => {
          const orderId = parseInt(orderIdStr);
          if (updated[orderId] > 0) {
            updated[orderId] = Math.max(0, updated[orderId] - 1);
            hasChanges = true;
          }
        });
        
        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize cooldown on component mount
  useEffect(() => {
    const storedLastRefresh = localStorage.getItem('lastBulkRefresh');
    if (storedLastRefresh) {
      const lastRefreshTime = parseInt(storedLastRefresh);
      setLastBulkRefresh(lastRefreshTime);
      
      const now = Date.now();
      const timeSinceLastRefresh = Math.floor((now - lastRefreshTime) / 1000);
      const remainingCooldown = Math.max(0, REFRESH_COOLDOWN_SECONDS - timeSinceLastRefresh);
      setRefreshCooldown(remainingCooldown);
    }
  }, [REFRESH_COOLDOWN_SECONDS]);

  const fetchOrders = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('upvote_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching orders', description: error.message, variant: 'destructive' });
      throw new Error(error.message);
    }
    return data;
  };

  const { data: pastOrders, isLoading: isLoadingPastOrders } = useQuery<UpvoteOrder[]>({
    queryKey: ['upvoteOrders', user?.id],
    queryFn: fetchOrders,
    enabled: !!user,
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchedOrder(null);
    try {
      const orderId = parseInt(searchQuery.trim(), 10);
      if (isNaN(orderId)) {
        toast({
          title: 'Invalid Order ID',
          description: 'Please enter a numeric order ID.',
          variant: 'destructive',
        });
        setIsSearching(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('upvote_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setSearchedOrder(data);
      } else {
        toast({
          title: 'Order not found',
          description: 'No upvote order found with that ID.',
        });
      }
    } catch (error: any) {
      console.error('Error fetching order status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch order status. Please check the order number.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-stone-100 text-stone-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-stone-100 text-stone-800';
    }
  };
  
  const getServiceLabel = (serviceId: number) => {
    return SERVICE_OPTIONS.find(opt => opt.value === serviceId)?.label || 'Unknown Service';
  };

  const formatCooldownTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const parseRedditUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // Reddit URL structure: /r/subreddit/comments/postid/title/ or /r/subreddit/comments/postid/title/commentid
      if (pathParts.length >= 4 && pathParts[0] === 'r' && pathParts[2] === 'comments') {
        const subreddit = pathParts[1];
        const isComment = pathParts.length > 5; // Has comment ID
        return {
          subreddit: `r/${subreddit}`,
          isComment,
          url
        };
      }
    } catch (error) {
      console.error('Error parsing Reddit URL:', error);
    }
    
    return {
      subreddit: 'Unknown',
      isComment: false,
      url
    };
  };

  const getServiceDisplayInfo = (serviceId: number) => {
    const service = SERVICE_OPTIONS.find(opt => opt.value === serviceId);
    const isComment = serviceId === 3 || serviceId === 4; // Comment upvotes or downvotes
    const isUpvote = serviceId === 1 || serviceId === 3; // Post upvotes or comment upvotes
    
    return {
      label: service?.label || 'Unknown Service',
      isComment,
      isUpvote,
      type: isComment ? 'Comment' : 'Post',
      direction: isUpvote ? 'Upvotes' : 'Downvotes'
    };
  };

  // Mutation for updating order status
  const updateStatusMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return await api.updateOrderStatus(orderId);
    },
    onSuccess: (result, orderId) => {
      if (result.updated) {
        toast({
          title: 'Status Updated',
          description: `Order #${orderId} status updated to: ${result.status}`,
        });
        queryClient.invalidateQueries({ queryKey: ['upvoteOrders', user?.id] });
        
                 // Update searched order if it matches
         if (searchedOrder && searchedOrder.id === orderId) {
           supabase
             .from('upvote_orders')
             .select('*')
             .eq('id', orderId)
             .single()
             .then(({ data, error }) => {
               if (data && !error) {
                 setSearchedOrder(data);
               }
             });
         }
      } else {
        toast({
          title: 'No Update Available',
          description: `Order #${orderId} status is already up to date or cannot be checked yet.`,
        });
      }
    },
    onError: (error: any, orderId) => {
      toast({
        title: 'Update Failed',
        description: `Failed to update status for order #${orderId}: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      return await api.updateMultipleOrderStatuses(orderIds);
    },
    onSuccess: (result) => {
      toast({
        title: 'Bulk Update Complete',
        description: `Updated ${result.updated} orders, ${result.failed} failed`,
      });
      queryClient.invalidateQueries({ queryKey: ['upvoteOrders', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Bulk Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async ({ orderId, externalOrderId }: { orderId: number; externalOrderId: string }) => {
      // Cancel the order on BuyUpvotes.io
      await api.cancelUpvoteOrder({ order_number: externalOrderId });
      
      // Update our local database to mark as cancelled
      const { error } = await supabase
        .from('upvote_orders')
        .update({ status: 'Cancelled' })
        .eq('id', orderId);
      
      if (error) throw error;
      
      return { orderId, externalOrderId };
    },
    onSuccess: (result) => {
      toast({
        title: 'Order Cancelled',
        description: `Order #${result.orderId} has been successfully cancelled.`,
      });
      queryClient.invalidateQueries({ queryKey: ['upvoteOrders', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCancelOrder = (orderId: number, externalOrderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      cancelOrderMutation.mutate({ orderId, externalOrderId });
    }
  };

  const handleBulkStatusUpdate = () => {
    if (!pastOrders || pastOrders.length === 0) return;
    
    // Check rate limiting
    if (refreshCooldown > 0) {
      toast({
        title: 'Please Wait',
        description: `Bulk refresh available in ${formatCooldownTime(refreshCooldown)}`,
        variant: 'destructive',
      });
      return;
    }
    
    // Only update orders that have external_order_id and aren't completed/cancelled
    const updatableOrders = pastOrders
      .filter(order => order.external_order_id && !['Completed', 'Cancelled'].includes(order.status))
      .map(order => order.id);
    
    if (updatableOrders.length === 0) {
      toast({
        title: 'No Orders to Update',
        description: 'All your orders are either completed, cancelled, or don\'t have external tracking IDs.',
      });
      return;
    }

    // Set rate limiting
    const now = Date.now();
    setLastBulkRefresh(now);
    setRefreshCooldown(REFRESH_COOLDOWN_SECONDS);
    localStorage.setItem('lastBulkRefresh', now.toString());

    bulkUpdateMutation.mutate(updatableOrders);
  };

  const handleIndividualStatusUpdate = async (orderId: number) => {
    // Check individual rate limiting
    const cooldown = individualCooldowns[orderId] || 0;
    if (cooldown > 0) {
      toast({
        title: 'Please Wait',
        description: `Status update available in ${formatCooldownTime(cooldown)}`,
        variant: 'destructive',
      });
      return;
    }

    // Get the order to check its current state
    const order = pastOrders?.find(o => o.id === orderId);
    if (!order) {
      toast({
        title: 'Error',
        description: 'Order not found',
        variant: 'destructive',
      });
      return;
    }

    // Set individual rate limiting
    setIndividualCooldowns(prev => ({
      ...prev,
      [orderId]: INDIVIDUAL_COOLDOWN_SECONDS
    }));

    // Call the API directly with better error handling
    try {
      const result = await api.updateOrderStatus(orderId);
      
      if (result.updated) {
        toast({
          title: 'Status Updated',
          description: result.message || `Order status refreshed successfully`,
        });
        // Refresh the orders list
        queryClient.invalidateQueries({ queryKey: ['upvoteOrders', user?.id] });
      } else {
        toast({
          title: 'Status Check Info',
          description: result.message || 'Order status is already up to date or cannot be checked yet.',
          variant: 'default',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Status Update Failed',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-stone-900">Master Order Dashboard</h1>
        <p className="text-stone-500 mt-2">Track and manage your upvote orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Upvote Order</CardTitle>
          <CardDescription>Enter an upvote order number to check its status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Order Number</Label>
              <Input
                id="search"
                placeholder="Enter order number (e.g., 123)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {searchedOrder && (
            <div className="mt-4 p-4 border border-stone-200 rounded-xl bg-stone-50">
              <h3 className="font-semibold mb-2">Order #{searchedOrder.id}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-stone-500">Service:</span>
                  <span className="ml-2 font-medium">{getServiceLabel(searchedOrder.service)}</span>
                </div>
                <div>
                  <span className="text-stone-500">Status:</span>
                  <Badge className={`ml-2 ${getStatusColor(searchedOrder.status)}`}>
                    {searchedOrder.status}
                  </Badge>
                </div>
                <div>
                    <span className="text-stone-500">Quantity:</span>
                    <span className="ml-2 font-medium">{searchedOrder.quantity}</span>
                </div>
                <div>
                    <span className="text-stone-500">Date:</span>
                    <span className="ml-2 font-medium">{format(new Date(searchedOrder.created_at), 'PPp')}</span>
                </div>
                                 <div>
                   <span className="text-stone-500">Delivered:</span>
                   <span className="ml-2 font-medium">
                     {(searchedOrder as any).votes_delivered ?? 0} / {searchedOrder.quantity}
                     <span className="text-stone-400 text-sm ml-1">
                       ({Math.round(((searchedOrder as any).votes_delivered ?? 0) / searchedOrder.quantity * 100)}%)
                     </span>
                   </span>
                 </div>
                <div className="col-span-2">
                    <span className="text-stone-500">Link:</span>
                    <a href={searchedOrder.link} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-600 hover:underline break-all">{searchedOrder.link}</a>
                </div>
                {searchedOrder.external_order_id && (
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="text-stone-500">External Order ID:</span>
                    <span className="ml-2 font-mono text-sm">{searchedOrder.external_order_id}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleIndividualStatusUpdate(searchedOrder.id)}
                      disabled={
                        updateStatusMutation.isPending || 
                        (individualCooldowns[searchedOrder.id] || 0) > 0
                      }
                    >
                      {updateStatusMutation.isPending ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (individualCooldowns[searchedOrder.id] || 0) > 0 ? (
                        <>
                          <Timer className="h-3 w-3 mr-1" />
                          {formatCooldownTime(individualCooldowns[searchedOrder.id])}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3 w-3" />
                          Update Status
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
          <CardTitle>Your Past Upvote Orders</CardTitle>
            <CardDescription>
              A list of all your upvote orders. New orders need a few minutes to get tracking IDs. 
              Once orders have tracking IDs, you can refresh their status (rate-limited: individual updates 
              every 30 seconds, bulk updates every 2 minutes).
            </CardDescription>
          </div>
          <Button
            onClick={handleBulkStatusUpdate}
            disabled={bulkUpdateMutation.isPending || !pastOrders || pastOrders.length === 0 || refreshCooldown > 0}
            variant="outline"
          >
            {bulkUpdateMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : refreshCooldown > 0 ? (
              <>
                <Timer className="h-4 w-4 mr-2" />
                Available in {formatCooldownTime(refreshCooldown)}
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Update All Statuses
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingPastOrders ? (
              <p>Loading past orders...</p>
          ) : pastOrders && pastOrders.length > 0 ? (
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[80px]">Order ID</TableHead>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead className="w-[200px]">SubReddit & Link</TableHead>
                          <TableHead className="w-[120px]">Service</TableHead>
                          <TableHead className="w-[100px]">Upvotes Ordered</TableHead>
                          <TableHead className="w-[120px]">Upvotes Delivered</TableHead>
                          <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {pastOrders.map((order) => {
                        const urlInfo = parseRedditUrl(order.link);
                        const serviceInfo = getServiceDisplayInfo(order.service);
                        const votesDelivered = (order as any).votes_delivered ?? 0;
                        

                        
                        return (
                          <TableRow key={order.id}>
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="font-bold">#{order.id}</span>
                                  <Badge className={`${getStatusColor(order.status)} w-fit text-xs`}>
                                    {order.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-sm">
                                {format(new Date(order.created_at), 'MMM dd')}
                                <br />
                                <span className="text-stone-500 text-xs">
                                  {format(new Date(order.created_at), 'HH:mm')}
                                </span>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex flex-col space-y-1">
                                  <span className="font-medium text-indigo-600">{urlInfo.subreddit}</span>
                                  <a 
                                    href={order.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex items-center text-xs text-stone-600 hover:text-indigo-600 transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View {serviceInfo.type}
                                  </a>
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{serviceInfo.type}</span>
                                  <span className="text-xs text-stone-500">{serviceInfo.direction}</span>
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <span className="font-medium text-lg">{order.quantity}</span>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex flex-col items-center space-y-1">
                                  <span className="font-medium text-lg">
                                    <span className="text-green-600">{votesDelivered}</span>
                                    <span className="text-stone-500 text-sm">/{order.quantity}</span>
                                  </span>
                                  {order.quantity > 0 && (
                                    <div className="w-full bg-stone-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${Math.min((votesDelivered / order.quantity) * 100, 100)}%` }}
                                      ></div>
                                    </div>
                                  )}
                                  <span className="text-xs text-stone-500">
                                    {Math.round((votesDelivered / order.quantity) * 100)}% complete
                                  </span>
                                </div>
                              </TableCell>
                              
                              <TableCell>
                                <div className="flex space-x-1 justify-center">
                                  {/* Show green checkmark for completed orders */}
                                  {order.status === 'Completed' ? (
                                    <div className="flex items-center justify-center p-2">
                                      <Check className="h-4 w-4 text-green-600" />
                                    </div>
                                  ) : (
                                    <>
                                      {/* Refresh button - Don't show for completed/cancelled orders */}
                                      {!['Completed', 'Cancelled'].includes(order.status) && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleIndividualStatusUpdate(order.id)}
                                          disabled={
                                            updateStatusMutation.isPending || 
                                            (individualCooldowns[order.id] || 0) > 0
                                          }
                                          className="p-2"
                                          title={
                                            !order.external_order_id 
                                              ? "Get tracking ID" 
                                              : "Refresh Status"
                                          }
                                        >
                                          {updateStatusMutation.isPending ? (
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                          ) : (individualCooldowns[order.id] || 0) > 0 ? (
                                            <Timer className="h-3 w-3" />
                                          ) : (
                                            <RefreshCw className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}
                                      
                                      {/* Cancel Button - Only show for "In progress" status orders */}
                                      {order.external_order_id && order.status === 'In progress' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleCancelOrder(order.id, order.external_order_id)}
                                          disabled={cancelOrderMutation.isPending}
                                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          title="Cancel Order"
                                        >
                                          {cancelOrderMutation.isPending ? (
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
              </Table>
          ) : (
              <p className="text-center text-stone-500 py-8">No past upvote orders found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
