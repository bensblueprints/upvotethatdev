import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Server, Shield, Globe, Clock, CheckCircle2, Loader2, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MyProxyOrders } from '@/components/MyProxyOrders';

interface ProxyPlan {
  id: string;
  name: string;
  type: 'residential' | 'datacenter' | 'mobile';
  price: number;
  bandwidth: string;
  features: string[];
  countries: string[];
}

const PROXY_PLANS: ProxyPlan[] = [
  {
    id: 'residential-1gb',
    name: 'Residential 1GB',
    type: 'residential',
    price: 3.00,
    bandwidth: '1 GB',
    features: ['Rotating IPs', '195+ Countries', 'HTTP/SOCKS5', 'Unlimited Concurrent'],
    countries: ['United States', 'United Kingdom', 'Germany', 'France', 'Canada']
  },
  {
    id: 'residential-5gb',
    name: 'Residential 5GB',
    type: 'residential',
    price: 13.50,
    bandwidth: '5 GB',
    features: ['Rotating IPs', '195+ Countries', 'HTTP/SOCKS5', 'Unlimited Concurrent'],
    countries: ['United States', 'United Kingdom', 'Germany', 'France', 'Canada']
  },
  {
    id: 'residential-10gb',
    name: 'Residential 10GB',
    type: 'residential',
    price: 25.00,
    bandwidth: '10 GB',
    features: ['Rotating IPs', '195+ Countries', 'HTTP/SOCKS5', 'Unlimited Concurrent'],
    countries: ['United States', 'United Kingdom', 'Germany', 'France', 'Canada']
  },
  {
    id: 'datacenter-100-ips',
    name: 'Datacenter 100 IPs',
    type: 'datacenter',
    price: 15.00,
    bandwidth: 'Unlimited',
    features: ['Static IPs', '30+ Countries', 'HTTP/SOCKS5', 'Blazing Fast'],
    countries: ['United States', 'United Kingdom', 'Germany', 'France', 'Netherlands']
  },
  {
    id: 'mobile-1gb',
    name: 'Mobile 1GB',
    type: 'mobile',
    price: 5.00,
    bandwidth: '1 GB',
    features: ['4G/5G Mobile IPs', '130+ Countries', 'HTTP/SOCKS5', 'High Success Rate'],
    countries: ['United States', 'United Kingdom', 'Germany', 'France', 'Spain']
  },
];

export const OrderProxies = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { toast } = useToast();
  usePageTitle('Order Proxies');

  const [selectedPlan, setSelectedPlan] = useState<ProxyPlan | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState<'residential' | 'datacenter' | 'mobile'>('residential');

  const handleOrderProxy = async () => {
    if (!selectedPlan || !selectedCountry) {
      toast({
        title: "Missing Information",
        description: "Please select a proxy plan and country.",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.balance || profile.balance < (selectedPlan.price * quantity)) {
      toast({
        title: "Insufficient Balance",
        description: "Please add funds to your account first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create proxy order in database
      const { data: proxyOrder, error: orderError } = await supabase
        .from('proxy_orders')
        .insert({
          user_id: user?.id,
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          plan_type: selectedPlan.type,
          quantity: quantity,
          country: selectedCountry,
          bandwidth: selectedPlan.bandwidth,
          price_per_unit: selectedPlan.price,
          total_price: selectedPlan.price * quantity,
          status: 'Pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Deduct from user balance
      const newBalance = profile.balance - (selectedPlan.price * quantity);
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('user_id', user?.id);

      if (balanceError) throw balanceError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          amount: -(selectedPlan.price * quantity),
          type: 'proxy_purchase',
          description: `Purchased ${selectedPlan.name} - ${selectedCountry} (x${quantity})`,
        });

      if (transactionError) throw transactionError;

      // Call serverless function to purchase proxies from ProxyCheap
      try {
        const purchaseResponse = await fetch('/.netlify/functions/purchase-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: proxyOrder.id,
            planType: selectedPlan.type,
            country: selectedCountry,
            bandwidth: selectedPlan.bandwidth,
            quantity: quantity,
          }),
        });

        if (!purchaseResponse.ok) {
          const errorData = await purchaseResponse.json();
          throw new Error(errorData.error || 'Failed to purchase proxies');
        }

        const purchaseData = await purchaseResponse.json();

        toast({
          title: "Proxies Activated!",
          description: `Your ${selectedPlan.name} proxies are now active and ready to use. Check your order details for credentials.`,
        });

      } catch (purchaseError: any) {
        console.error('Proxy purchase error:', purchaseError);
        toast({
          title: "Order Created - Activation Pending",
          description: `Your order was created but proxy activation failed: ${purchaseError.message}. Our team will process it manually.`,
          variant: "default"
        });
      }

      // Reset form
      setSelectedPlan(null);
      setQuantity(1);
      setSelectedCountry('');

    } catch (error: any) {
      console.error('Error ordering proxy:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place proxy order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = PROXY_PLANS.filter(plan => plan.type === activeType);
  const totalPrice = selectedPlan ? selectedPlan.price * quantity : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Order Proxies</h1>
        <p className="text-stone-600 mt-1">High-quality residential, datacenter, and mobile proxies</p>
      </div>

      {profile && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Current Balance: <strong>${profile.balance?.toFixed(2) || '0.00'}</strong>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="residential" onValueChange={(value) => setActiveType(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="residential">
            <Globe className="w-4 h-4 mr-2" />
            Residential
          </TabsTrigger>
          <TabsTrigger value="datacenter">
            <Server className="w-4 h-4 mr-2" />
            Datacenter
          </TabsTrigger>
          <TabsTrigger value="mobile">
            <MapPin className="w-4 h-4 mr-2" />
            Mobile
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeType} className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPlan?.id === plan.id ? 'ring-2 ring-orange-500 shadow-lg' : ''
                }`}
                onClick={() => {
                  setSelectedPlan(plan);
                  if (plan.countries.length > 0) {
                    setSelectedCountry(plan.countries[0]);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {selectedPlan?.id === plan.id && (
                      <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{plan.bandwidth}</Badge>
                    <Badge variant="secondary">{plan.type}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-orange-600">
                    ${plan.price.toFixed(2)}
                  </div>
                  <ul className="space-y-1 text-sm text-stone-600">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedPlan && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Configure Your Order</CardTitle>
                <CardDescription>Complete your {selectedPlan.name} order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Select Country</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose country" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedPlan.countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="100"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Plan:</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Country:</span>
                    <span className="font-medium">{selectedCountry || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Quantity:</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Price per unit:</span>
                    <span className="font-medium">${selectedPlan.price.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-stone-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-bold text-orange-600">${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleOrderProxy}
                  disabled={loading || !selectedCountry}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Place Order - ${totalPrice.toFixed(2)}
                    </>
                  )}
                </Button>

                {(!profile?.balance || profile.balance < totalPrice) && (
                  <p className="text-sm text-red-600 text-center">
                    Insufficient balance. Please add funds to your account.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Why Choose Our Proxies?</CardTitle>
          <CardDescription>Premium quality proxies for all your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold">Instant Delivery</h3>
              <p className="text-sm text-stone-600">
                Get your proxies immediately after purchase. No waiting time.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold">99.9% Uptime</h3>
              <p className="text-sm text-stone-600">
                Reliable and stable proxies with exceptional uptime guarantee.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold">195+ Locations</h3>
              <p className="text-sm text-stone-600">
                Access proxies from over 195 countries worldwide.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <MyProxyOrders />
      </div>
    </div>
  );
};
