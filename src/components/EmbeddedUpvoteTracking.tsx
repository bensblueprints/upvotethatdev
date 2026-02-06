import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Timer, ExternalLink, Check, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { SERVICE_OPTIONS, api } from '@/lib/api';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';

type UpvoteOrder = Tables<'upvote_orders'>;

export const EmbeddedUpvoteTracking = () => {
  const [lastBulkRefresh, setLastBulkRefresh] = useState<number | null>(null);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [individualCooldowns, setIndividualCooldowns] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const itemsPerPage = 10;

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

  const { data: allOrders, isLoading: isLoadingPastOrders } = useQuery<UpvoteOrder[]>({
    queryKey: ['upvoteOrders', user?.id],
    queryFn: fetchOrders,
    enabled: !!user,
  });

  // Calculate pagination
  const totalItems = allOrders?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = allOrders?.slice(startIndex, endIndex) || [];

  const bulkUpdateMutation = useMutation({
    mutationFn: async () => {
      if (!allOrders) return;
      
      const ordersWithExternalId = allOrders.filter(order => order.external_order_id);
      if (ordersWithExternalId.length === 0) {
        throw new Error('No orders with external IDs found to update');
      }

      const results = await Promise.allSettled(
        ordersWithExternalId.map(order => 
          api.updateOrderStatus(order.id)
        )
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      return { successful, failed, total: ordersWithExternalId.length };
    },
    onSuccess: (result) => {
      if (result) {
        const now = Date.now();
        setLastBulkRefresh(now);
        localStorage.setItem('lastBulkRefresh', now.toString());
        setRefreshCooldown(REFRESH_COOLDOWN_SECONDS);
        
        toast({
          title: 'Bulk Status Update Complete',
          description: `${result.successful} orders updated successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        });
        queryClient.invalidateQueries({ queryKey: ['upvoteOrders'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Bulk Update Failed',
        description: error.message || 'Failed to update order statuses',
        variant: 'destructive',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const order = allOrders?.find(o => o.id === orderId);
      if (!order?.external_order_id) {
        throw new Error('No external order ID found for this order');
      }
      return api.updateOrderStatus(orderId);
    },
    onSuccess: (result, orderId) => {
      setIndividualCooldowns(prev => ({ ...prev, [orderId]: INDIVIDUAL_COOLDOWN_SECONDS }));
      queryClient.invalidateQueries({ queryKey: ['upvoteOrders'] });
      
      if (result.updated) {
        toast({
          title: 'Status Updated',
          description: result.message || 'Order status has been updated successfully.',
        });
      } else {
        toast({
          title: 'Status Check Info',
          description: result.message || 'Order status is already up to date or cannot be checked yet.',
          variant: 'default',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Status Update Failed',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      });
    },
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
      
      if (pathParts.length >= 2 && pathParts[0] === 'r') {
        const subreddit = pathParts[1];
        return {
          subreddit: `r/${subreddit}`,
          shortUrl: `reddit.com/r/${subreddit}/...`
        };
      }
      
      return {
        subreddit: 'Unknown',
        shortUrl: url.length > 50 ? url.substring(0, 47) + '...' : url
      };
    } catch {
      return {
        subreddit: 'Invalid URL',
        shortUrl: url.length > 50 ? url.substring(0, 47) + '...' : url
      };
    }
  };

  const getServiceDisplayInfo = (serviceId: number) => {
    const serviceLabel = getServiceLabel(serviceId);
    const isDownvote = serviceLabel.toLowerCase().includes('downvote');
    return {
      type: isDownvote ? 'Downvotes' : 'Upvotes',
      direction: isDownvote ? '↓' : '↑'
    };
  };

  const handleBulkStatusUpdate = () => {
    if (!allOrders || allOrders.length === 0) return;
    
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
    const updatableOrders = allOrders.filter(order => 
      order.external_order_id && !['Completed', 'Cancelled'].includes(order.status)
    );
    
    if (updatableOrders.length === 0) {
      toast({
        title: 'No Orders to Update',
        description: 'All your orders are either completed, cancelled, or don\'t have external tracking IDs.',
      });
      return;
    }

    bulkUpdateMutation.mutate();
  };

  const handleIndividualStatusUpdate = async (orderId: number) => {
    updateStatusMutation.mutate(orderId);
  };

  if (!allOrders || allOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Upvote Orders</CardTitle>
          <CardDescription>Your recent upvote orders will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-stone-500 text-center py-8">No upvote orders yet. Submit your first order above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Upvote Orders</CardTitle>
          <CardDescription>
            Showing {Math.min(itemsPerPage, paginatedOrders.length)} of {totalItems} orders. 
            Page {currentPage} of {totalPages}
          </CardDescription>
        </div>
        <Button
          onClick={handleBulkStatusUpdate}
          disabled={bulkUpdateMutation.isPending || refreshCooldown > 0}
          variant="outline"
          size="sm"
        >
          {bulkUpdateMutation.isPending ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : refreshCooldown > 0 ? (
            <>
              <Timer className="h-4 w-4 mr-2" />
              {formatCooldownTime(refreshCooldown)}
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update All
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoadingPastOrders ? (
          <p>Loading orders...</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Order</TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[180px]">Target</TableHead>
                  <TableHead className="w-[100px]">Service</TableHead>
                  <TableHead className="w-[80px]">Ordered</TableHead>
                  <TableHead className="w-[120px]">Progress</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => {
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
                            View Post
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
            
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}; 