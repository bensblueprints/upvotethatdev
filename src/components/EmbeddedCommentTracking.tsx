import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Timer, ExternalLink, Check } from 'lucide-react';
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
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';

type CommentOrder = Tables<'comment_orders'>;

export const EmbeddedCommentTracking = () => {
  const [refreshCooldowns, setRefreshCooldowns] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const itemsPerPage = 10;

  // Cooldown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCooldowns(prev => {
        const updated = { ...prev };
        let hasChanges = false;
        
        Object.keys(updated).forEach(key => {
          const orderId = parseInt(key);
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

  // Fetch past comment orders
  const { data: allOrders, isLoading: isLoadingPastOrders } = useQuery({
    queryKey: ['commentOrders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('comment_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comment orders:', error);
        throw error;
      }

      return data as CommentOrder[];
    },
    enabled: !!user?.id,
  });

  // Calculate pagination
  const totalItems = allOrders?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = allOrders?.slice(startIndex, endIndex) || [];

  const parseRedditUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathParts.length >= 2 && pathParts[0] === 'r') {
        const subreddit = pathParts[1];
        const isComment = pathParts.length >= 6 && pathParts[2] === 'comments';
        
        return {
          subreddit: `r/${subreddit}`,
          type: isComment ? 'Comment' : 'Post',
          shortUrl: `reddit.com/r/${subreddit}/...`
        };
      }
      
      return {
        subreddit: 'Unknown',
        type: 'Unknown',
        shortUrl: url.length > 50 ? url.substring(0, 47) + '...' : url
      };
    } catch {
      return {
        subreddit: 'Invalid URL',
        type: 'Unknown',
        shortUrl: url.length > 50 ? url.substring(0, 47) + '...' : url
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  const formatCooldownTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const handleRefreshStatus = async (orderId: number) => {
    try {
      const result = await api.updateCommentOrderStatus(orderId);
      setRefreshCooldowns(prev => ({ ...prev, [orderId]: 30 })); // 30 second cooldown
      
      queryClient.invalidateQueries({ queryKey: ['commentOrders', user?.id] });
      
      if (result.updated) {
        toast({
          title: 'Status Updated',
          description: result.message || 'Comment order status updated successfully.',
        });
      } else {
        toast({
          title: 'Status Check Info',
          description: result.message || 'Order status is already up to date.',
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

  if (!allOrders || allOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Comment Orders</CardTitle>
          <CardDescription>Your recent comment orders will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-stone-500 text-center py-8">No comment orders yet. Submit your first order above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Comment Orders</CardTitle>
        <CardDescription>
          Showing {Math.min(itemsPerPage, paginatedOrders.length)} of {totalItems} orders. 
          Page {currentPage} of {totalPages}
        </CardDescription>
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
                  <TableHead className="w-[200px]">Comment Preview</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => {
                  const urlInfo = parseRedditUrl(order.link);
                  const cooldown = refreshCooldowns[order.id] || 0;
                  const isCompleted = order.status.toLowerCase() === 'completed';
                  
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
                            View {urlInfo.type}
                          </a>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm max-w-[200px]">
                          <p className="truncate font-medium">
                            {order.content.length > 50 
                              ? `${order.content.substring(0, 50)}...` 
                              : order.content
                            }
                          </p>
                          <span className="text-xs text-stone-500">
                            {order.content.length} chars
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4" />
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRefreshStatus(order.id)}
                              disabled={cooldown > 0}
                              className="text-xs"
                            >
                              {cooldown > 0 ? (
                                <>
                                  <Timer className="h-3 w-3 mr-1" />
                                  {formatCooldownTime(cooldown)}
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Refresh
                                </>
                              )}
                            </Button>
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