import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SPEED_OPTIONS, SERVICE_OPTIONS, api } from '@/lib/api';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { EmbeddedUpvoteTracking } from '@/components/EmbeddedUpvoteTracking';

export const OrderUpvotes = () => {
  const [formData, setFormData] = useState({
    link: '',
    quantity: '',
    service: '',
    speed: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  usePageTitle('Order Upvotes');

  const pricing = useMemo(() => {
    const balance = profile?.balance ?? 0;
    if (balance >= 1000) return { tier: 'Elite', postVote: 0.04, commentVote: 0.032 };
    if (balance >= 750) return { tier: 'Pro', postVote: 0.06, commentVote: 0.048 };
    if (balance >= 250) return { tier: 'Standard', postVote: 0.08, commentVote: 0.064 };
    if (balance >= 100) return { tier: 'Basic', postVote: 0.10, commentVote: 0.08 };
    if (balance >= 15) return { tier: 'Starter', postVote: 0.20, commentVote: 0.16 };
    return { tier: 'Starter', postVote: 0.20, commentVote: 0.16 };
  }, [profile]);

  const totalCost = useMemo(() => {
    const quantity = parseInt(formData.quantity) || 0;
    const service = parseInt(formData.service);
    if (!quantity || !service) return 0;

    if (service === 1 || service === 2) { // Post votes
      return quantity * pricing.postVote;
    }
    if (service === 3 || service === 4) { // Comment votes
      return quantity * pricing.commentVote;
    }
    return 0;
  }, [formData.quantity, formData.service, pricing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!formData.link || !formData.quantity || !formData.service || !formData.speed) {
        throw new Error('Please fill in all fields');
      }

      const quantity = parseInt(formData.quantity);
      if (isNaN(quantity) || quantity < 1 || quantity > 500) {
        throw new Error('Quantity must be between 1 and 500');
      }

      // Submit order using the new API function that handles both local storage AND BuyUpvotes.io submission
      const response = await api.submitUpvoteOrder({
        link: formData.link,
        quantity: quantity,
        service: parseInt(formData.service) as 1 | 2 | 3 | 4,
        speed: parseFloat(formData.speed),
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit order');
      }

      const orderInfo = response.data?.external_order_number 
        ? `Order #${response.data.order_number} submitted to fulfillment service (External ID: ${response.data.external_order_number})`
        : `Order #${response.data?.order_number} created locally`;

      toast({
        title: 'Order Submitted Successfully!',
        description: orderInfo,
      });
      
      setFormData({ link: '', quantity: '', service: '', speed: '' });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
    } catch (error: any) {
      console.error('Order submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit order. Please check your inputs and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-stone-900">Order Upvotes</h1>
        <p className="text-stone-500 mt-2">Submit upvote or downvote orders for Reddit posts and comments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Submit New Order</CardTitle>
            <CardDescription>
              Enter the Reddit link and configure your upvote/downvote order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="link">Reddit Link</Label>
                <Textarea
                  id="link"
                  placeholder="https://www.reddit.com/r/example/comments/..."
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="min-h-[80px]"
                  required
                />
                <p className="text-sm text-stone-500">
                  Must be a Reddit link copied from desktop (no mobile links)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max="500"
                    placeholder="1-500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">Service Type</Label>
                  <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="speed">Delivery Speed</Label>
                <Select value={formData.speed} onValueChange={(value) => setFormData({ ...formData, speed: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery speed" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPEED_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {totalCost > 0 && (
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-right">
                  <p className="text-sm text-stone-500">Estimated Cost</p>
                  <p className="text-xl font-bold text-stone-900">${totalCost.toFixed(2)}</p>
                </div>
              )}

              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Order'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Dynamic Pricing</CardTitle>
            {profile ? (
              <CardDescription>
                Your current tier:{' '}
                <span className="font-bold text-orange-500">{pricing.tier}</span>
              </CardDescription>
            ) : (
              <CardDescription>Loading your pricing...</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800">Post Votes</h4>
              <p className="text-sm text-orange-600">${pricing.postVote.toFixed(3)} per vote</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800">Comment Votes</h4>
              <p className="text-sm text-blue-600">${pricing.commentVote.toFixed(4)} per vote</p>
            </div>
            <div className="text-xs text-stone-500 mt-4">
              * Your pricing is based on your account balance. Add funds to get better rates.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Embedded Order Tracking */}
      <EmbeddedUpvoteTracking />
    </div>
  );
};
