import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Server, Copy, CheckCircle, Clock, XCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProxyOrder {
  id: string;
  plan_name: string;
  plan_type: string;
  quantity: number;
  country: string;
  bandwidth: string;
  total_price: number;
  status: string;
  proxy_credentials: any;
  proxycheap_order_id: string | null;
  expires_at: string | null;
  created_at: string;
}

export const MyProxyOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<ProxyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCredentials, setVisibleCredentials] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('proxy_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching proxy orders:', error);
      toast({
        title: "Error",
        description: "Failed to load proxy orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const toggleCredentialsVisibility = (orderId: string) => {
    setVisibleCredentials(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      'Pending': { variant: 'secondary', icon: Clock },
      'Processing': { variant: 'default', icon: Clock },
      'Active': { variant: 'default', icon: CheckCircle },
      'Expired': { variant: 'destructive', icon: XCircle },
      'Cancelled': { variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Alert>
        <Server className="h-4 w-4" />
        <AlertDescription>
          You haven't ordered any proxies yet. Create your first order above!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">My Proxy Orders</h3>

      {orders.map((order) => {
        const isVisible = visibleCredentials.has(order.id);
        const hasCredentials = order.proxy_credentials && Object.keys(order.proxy_credentials).length > 0;

        return (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    {order.plan_name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Ordered {formatDate(order.created_at)}
                  </CardDescription>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-stone-500">Type</p>
                  <p className="font-medium capitalize">{order.plan_type}</p>
                </div>
                <div>
                  <p className="text-stone-500">Country</p>
                  <p className="font-medium">{order.country}</p>
                </div>
                <div>
                  <p className="text-stone-500">Bandwidth</p>
                  <p className="font-medium">{order.bandwidth}</p>
                </div>
                <div>
                  <p className="text-stone-500">Total</p>
                  <p className="font-medium">${order.total_price.toFixed(2)}</p>
                </div>
              </div>

              {order.expires_at && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="text-amber-800">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Expires: {formatDate(order.expires_at)}
                  </p>
                </div>
              )}

              {hasCredentials && order.status === 'Active' && (
                <div className="bg-stone-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Proxy Credentials</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCredentialsVisibility(order.id)}
                    >
                      {isVisible ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Show
                        </>
                      )}
                    </Button>
                  </div>

                  {isVisible && (
                    <div className="space-y-2">
                      {order.proxy_credentials.host && (
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <div>
                            <p className="text-xs text-stone-500">Host</p>
                            <p className="font-mono text-sm">{order.proxy_credentials.host}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(order.proxy_credentials.host, 'Host')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {order.proxy_credentials.port && (
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <div>
                            <p className="text-xs text-stone-500">Port</p>
                            <p className="font-mono text-sm">{order.proxy_credentials.port}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(order.proxy_credentials.port.toString(), 'Port')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {order.proxy_credentials.username && (
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <div>
                            <p className="text-xs text-stone-500">Username</p>
                            <p className="font-mono text-sm">{order.proxy_credentials.username}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(order.proxy_credentials.username, 'Username')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {order.proxy_credentials.password && (
                        <div className="flex items-center justify-between bg-white p-2 rounded border">
                          <div>
                            <p className="text-xs text-stone-500">Password</p>
                            <p className="font-mono text-sm">••••••••</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(order.proxy_credentials.password, 'Password')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )}

                      {order.proxy_credentials.protocol && (
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-stone-500">Protocol</p>
                          <p className="font-mono text-sm uppercase">{order.proxy_credentials.protocol}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {order.status === 'Pending' && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Your proxy order is being processed. Credentials will appear here once activation is complete.
                  </AlertDescription>
                </Alert>
              )}

              {order.status === 'Cancelled' && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    This order was cancelled. Please contact support if you believe this is an error.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
