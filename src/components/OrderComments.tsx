import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, ExternalLink, Trash2, Plus, Minus, AlertTriangle, Check, Timer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import { EmbeddedCommentTracking } from '@/components/EmbeddedCommentTracking';

type CommentOrder = Tables<'comment_orders'>;

interface CommentFormData {
  link: string;
  content: string;
}

export const OrderComments = () => {
  const [numComments, setNumComments] = useState(1);
  const [commentForms, setCommentForms] = useState<CommentFormData[]>([{ link: '', content: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshCooldowns, setRefreshCooldowns] = useState<Record<number, number>>({});
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  usePageTitle('Order Comments');

  // Update cooldown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCooldowns(prev => {
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

  // Update number of comment forms when numComments changes
  useEffect(() => {
    const newForms = Array.from({ length: numComments }, (_, i) => 
      commentForms[i] || { link: '', content: '' }
    );
    setCommentForms(newForms);
  }, [numComments]);

  const updateFormData = (index: number, field: keyof CommentFormData, value: string) => {
    setCommentForms(prev => 
      prev.map((form, i) => 
        i === index ? { ...form, [field]: value } : form
      )
    );
  };

  const removeForm = (index: number) => {
    if (commentForms.length > 1) {
      setCommentForms(prev => prev.filter((_, i) => i !== index));
      setNumComments(prev => prev - 1);
    }
  };

  const addForm = () => {
    if (commentForms.length < 25) {
      setCommentForms(prev => [...prev, { link: '', content: '' }]);
      setNumComments(prev => prev + 1);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate all forms
      const validForms = commentForms.filter(form => form.link.trim() && form.content.trim());
      
      if (validForms.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in at least one comment form with both link and content.',
          variant: 'destructive',
        });
        return;
      }

      // Submit all valid forms
      const result = await api.submitCommentOrderBulk(validForms);
      
      if (result.successful > 0) {
        toast({
          title: 'Comment Orders Submitted!',
          description: `${result.successful} comment orders submitted successfully${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        });
        
        // Reset forms
        setCommentForms([{ link: '', content: '' }]);
        setNumComments(1);
        
        // Refresh orders list
        queryClient.invalidateQueries({ queryKey: ['commentOrders', user?.id] });
      } else {
        toast({
          title: 'Submission Failed',
          description: `All ${result.failed} comment orders failed to submit.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Comment order submission error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit comment orders. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshStatus = async (orderId: number) => {
    const cooldown = refreshCooldowns[orderId] || 0;
    if (cooldown > 0) {
      toast({
        title: 'Please Wait',
        description: `Status update available in ${formatCooldownTime(cooldown)}`,
        variant: 'destructive',
      });
      return;
    }

    // Set cooldown
    setRefreshCooldowns(prev => ({ ...prev, [orderId]: 30 }));

    try {
      const result = await api.updateCommentOrderStatus(orderId);
      
      if (result.updated) {
        toast({
          title: 'Status Updated',
          description: result.message || 'Comment order status refreshed successfully',
        });
        // Refresh the orders list
        queryClient.invalidateQueries({ queryKey: ['commentOrders', user?.id] });
      } else {
        toast({
          title: 'Status Check Info',
          description: result.message || 'Comment order status is already up to date',
          variant: 'default',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Status Update Failed',
        description: error.message || 'Failed to update comment order status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-stone-900">Order Comments</h1>
        <p className="text-stone-500 mt-2">Submit custom comment orders for Reddit posts and replies</p>
      </div>

      {/* Instructions Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Important Instructions - Please Read Carefully
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-700 space-y-3">
          <p className="font-medium">
            This service allows you to generate and automate Reddit comments using our extensive network of Reddit accounts. 
            Each automated comment costs <strong>$2.50</strong> and is deducted from your balance.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">📝 Custom Comments:</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Minimum quantity:</strong> 1 comment</li>
                <li>• <strong>Maximum quantity:</strong> 25 comments per order</li>
                <li>• Use <code>[newline]</code> to create line breaks</li>
                <li>• Use <code>[link text](https://yourlink.com)</code> to add links</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">⚠️ Important Disclaimers:</h4>
              <ul className="text-sm space-y-1">
                <li>• Comments are made with aged but low-karma accounts</li>
                <li>• Not guaranteed due to Reddit's spam filters</li>
                <li>• Subreddit karma requirements may block comments</li>
                <li>• <strong>No refunds</strong> for comments that don't go through</li>
              </ul>
            </div>
          </div>
          
          <div className="p-3 bg-orange-100 rounded-lg border border-orange-300">
            <p className="text-sm font-medium">
              💡 <strong>Recommendation:</strong> Test this service with a small order before ordering in bulk to ensure it works for your target subreddits.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Order Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Comment Orders</CardTitle>
          <CardDescription>
            Add up to 25 comment orders at once. Each comment will be submitted as a separate order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Number of Comments Selector */}
            <div className="flex items-center gap-4">
              <Label htmlFor="numComments">Number of Comments:</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNumComments(Math.max(1, numComments - 1))}
                  disabled={numComments <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Select value={numComments.toString()} onValueChange={(value) => setNumComments(parseInt(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 25 }, (_, i) => i + 1).map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNumComments(Math.min(25, numComments + 1))}
                  disabled={numComments >= 25}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-stone-500">
                Total cost: <strong>${(numComments * 2.50).toFixed(2)}</strong>
              </div>
            </div>

            {/* Comment Forms */}
            <div className="space-y-4">
              {commentForms.map((form, index) => (
                <Card key={index} className="border-stone-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Comment #{index + 1}</CardTitle>
                      {commentForms.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeForm(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`link-${index}`}>Reddit Link</Label>
                      <Input
                        id={`link-${index}`}
                        placeholder="https://www.reddit.com/r/example/comments/..."
                        value={form.link}
                        onChange={(e) => updateFormData(index, 'link', e.target.value)}
                        required
                      />
                      <p className="text-sm text-stone-500">
                        Link to the Reddit post or comment where you want to add a comment
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`content-${index}`}>Comment Content</Label>
                      <Textarea
                        id={`content-${index}`}
                        placeholder="Enter your comment text here..."
                        value={form.content}
                        onChange={(e) => updateFormData(index, 'content', e.target.value)}
                        className="min-h-[120px]"
                        required
                      />
                      <div className="text-sm text-stone-500 space-y-1">
                        <p>• Use [newline] to create line breaks</p>
                        <p>• Use [link text](https://yourlink.com) to add links</p>
                        <p>• Keep content relevant and follow Reddit's community guidelines</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add/Submit Buttons */}
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={addForm}
                disabled={commentForms.length >= 25}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Another Comment
              </Button>

              <Button 
                type="submit" 
                className="bg-orange-500 hover:bg-orange-600" 
                disabled={isSubmitting || commentForms.filter(f => f.link.trim() && f.content.trim()).length === 0}
              >
                {isSubmitting ? 'Submitting...' : `Submit ${commentForms.filter(f => f.link.trim() && f.content.trim()).length} Comment Orders`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>



      {/* Embedded Comment Order Tracking */}
      <EmbeddedCommentTracking />
    </div>
  );
};

// Comment Order Tracking Component
export const CommentOrderTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshCooldowns, setRefreshCooldowns] = useState<Record<number, number>>({});
  
  usePageTitle('Track Comment Orders');

  // Update cooldown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCooldowns(prev => {
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

  const { data: commentOrders, isLoading } = useQuery<CommentOrder[]>({
    queryKey: ['commentOrders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('comment_orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">✅ Completed</Badge>;
      case 'in progress':
        return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-stone-100 text-stone-800">{status}</Badge>;
    }
  };

  const parseRedditUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathParts.length >= 4 && pathParts[0] === 'r' && pathParts[2] === 'comments') {
        const subreddit = pathParts[1];
        return {
          subreddit: `r/${subreddit}`,
          url
        };
      }
    } catch (error) {
      console.error('Error parsing Reddit URL:', error);
    }
    
    return {
      subreddit: 'Unknown',
      url
    };
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
    const cooldown = refreshCooldowns[orderId] || 0;
    if (cooldown > 0) {
      toast({
        title: 'Please Wait',
        description: `Status update available in ${formatCooldownTime(cooldown)}`,
        variant: 'destructive',
      });
      return;
    }

    // Set cooldown
    setRefreshCooldowns(prev => ({ ...prev, [orderId]: 30 }));

    try {
      const result = await api.updateCommentOrderStatus(orderId);
      
      if (result.updated) {
        toast({
          title: 'Status Updated',
          description: result.message || 'Comment order status refreshed successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['commentOrders', user?.id] });
      } else {
        toast({
          title: 'Status Check Info',
          description: result.message || 'Comment order status is already up to date',
          variant: 'default',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Status Update Failed',
        description: error.message || 'Failed to update comment order status',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-display text-stone-900">Track Comment Orders</h1>
          <p className="text-stone-500 mt-2">Monitor your comment order status and progress</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p>Loading comment orders...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-stone-900">Track Comment Orders</h1>
        <p className="text-stone-500 mt-2">Monitor your comment order status and progress</p>
      </div>

      {commentOrders && commentOrders.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Comment Orders</CardTitle>
            <CardDescription>
              Track the status and progress of your comment orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>SubReddit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Content Preview</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commentOrders.map((order) => {
                    const { subreddit, url } = parseRedditUrl(order.link);
                    const cooldown = refreshCooldowns[order.id] || 0;
                    const isCompleted = order.status?.toLowerCase() === 'completed';
                    
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">#{order.id}</TableCell>
                        <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {subreddit}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status || 'Pending')}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate text-sm text-stone-500">
                            {order.content?.substring(0, 50)}{order.content && order.content.length > 50 ? '...' : ''}
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
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-stone-500">No comment orders found. Create your first comment order to get started!</p>
            <Button 
              className="mt-4" 
              onClick={() => {/* Navigate to order comments */}}
            >
              Order Comments
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
