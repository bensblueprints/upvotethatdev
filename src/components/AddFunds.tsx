import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, Star, CreditCard, Bitcoin } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from '@/hooks/usePageTitle';
import { supabase } from '@/integrations/supabase/client';

export const AddFunds = () => {
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'crypto'>('credit');

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  usePageTitle('Add Funds');



  const packages = [
    {
      name: 'Starter',
      price: '$15',
      pricePerUpvote: '$0.20',
      discount: null,
      isBestValue: true,
      minAmount: 15,
      maxAmount: 99,
      features: [
        'Post upvotes',
        'Post downvotes',
        'Comment upvotes',
        'Comment downvotes'
      ]
    },
    {
      name: 'Basic',
      price: '$100',
      pricePerUpvote: '$0.10',
      discount: '20% discount',
      isBestValue: false,
      minAmount: 100,
      maxAmount: 249,
      features: [
        'Post upvotes',
        'Post downvotes',
        'Comment upvotes',
        'Comment downvotes'
      ]
    },
    {
      name: 'Standard',
      price: '$250',
      pricePerUpvote: '$0.08',
      discount: '40% discount',
      isBestValue: false,
      minAmount: 250,
      maxAmount: 749,
      features: [
        'Post upvotes',
        'Post downvotes',
        'Comment upvotes',
        'Comment downvotes'
      ]
    },
    {
      name: 'Pro',
      price: '$750',
      pricePerUpvote: '$0.06',
      discount: '60% discount',
      isBestValue: false,
      minAmount: 750,
      maxAmount: 999,
      features: [
        'Post upvotes',
        'Post downvotes',
        'Comment upvotes',
        'Comment downvotes'
      ]
    },
    {
      name: 'Elite',
      price: '$1000',
      pricePerUpvote: '$0.04',
      discount: '80% discount',
      isBestValue: false,
      minAmount: 1000,
      maxAmount: Infinity,
      features: [
        'Post upvotes',
        'Post downvotes',
        'Comment upvotes',
        'Comment downvotes'
      ]
    }
  ];

  const getApplicableTier = (amount: number) => {
    return packages.find(pkg => amount >= pkg.minAmount && amount <= pkg.maxAmount) || packages[0];
  };

  const calculateUpvotes = (amount: number) => {
    const tier = getApplicableTier(amount);
    const pricePerUpvote = parseFloat(tier.pricePerUpvote.replace('$', ''));
    return Math.floor(amount / pricePerUpvote);
  };

  const handleSelectPackage = (packageName: string) => {
    const selectedPackage = packages.find(p => p.name === packageName);
    if (selectedPackage) {
        setDepositAmount(String(selectedPackage.minAmount));
    }
  };

  const handleCardPayment = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 1) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum deposit is $1.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create Airwallex PaymentIntent via our Edge Function
      const { data, error } = await supabase.functions.invoke('create-airwallex-checkout', {
        body: { amount: Math.round(amount * 100) }, // amount in cents
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.intent_id || !data.client_secret) {
        throw new Error('Could not create payment session.');
      }

      // Load Airwallex SDK and redirect to Hosted Payment Page
      const { init } = await import('@airwallex/components-sdk');
      
      // Initialize Airwallex SDK - returns { payments, sca }
      const { payments } = await init({
        env: import.meta.env.VITE_AIRWALLEX_ENV === 'demo' ? 'demo' : 'prod',
        enabledElements: ['payments'],
      });

      if (!payments) {
        throw new Error('Failed to initialize Airwallex payments');
      }

      // Redirect to Hosted Payment Page using payments.redirectToCheckout
      await payments.redirectToCheckout({
        intent_id: data.intent_id,
        client_secret: data.client_secret,
        currency: data.currency || 'USD',
        country_code: 'US',
        // Optional, but useful for a clean post-payment redirect:
        successUrl: `${window.location.origin}/dashboard?payment_status=success&amount=${data.amount}`,
      });

    } catch (error: any) {
      console.error('Error creating payment session:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'There was an issue processing your payment. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
    // Note: Don't set isLoading to false here - page will redirect
  };

  const handleCryptoPayment = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 1) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum deposit is $1.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-crypto-payment', {
        body: { amount: amount },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.payment_url) {
        window.open(data.payment_url, '_blank');
        toast({
          title: 'Crypto Payment Created',
          description: 'You will be able to choose from multiple cryptocurrencies on the payment page.',
        });
      } else {
        throw new Error('Could not retrieve crypto payment URL.');
      }
    } catch (error: any) {
      console.error('Error creating crypto payment:', error);
      toast({
        title: 'Crypto Payment Error',
        description: error.message || 'There was an issue creating your crypto payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = () => {
    if (paymentMethod === 'credit') {
      handleCardPayment();
    } else {
      handleCryptoPayment();
    }
  };

  const depositAmountNum = parseFloat(depositAmount) || 0;
  const applicableTier = depositAmountNum >= 1 ? getApplicableTier(depositAmountNum) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-stone-900">Add Funds</h1>
        <p className="text-stone-500 mt-2">Choose the perfect tier for your needs</p>
      </div>

      {/* Wallet Deposit Section */}
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">Add to Wallet</CardTitle>
          <CardDescription className="text-center">
            Enter your deposit amount below to calculate how many upvotes it will convert into:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Method Selection */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Customize your payment below:</Label>
            <div className="flex gap-4">
              <button
                onClick={() => setPaymentMethod('credit')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'credit' 
                    ? 'border-orange-500 bg-orange-100 text-orange-700' 
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                Credit Card
              </button>
              <button
                onClick={() => setPaymentMethod('crypto')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'crypto' 
                    ? 'border-orange-500 bg-orange-100 text-orange-700' 
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                <Bitcoin className="w-5 h-5" />
                Cryptocurrency
              </button>
            </div>
          </div>



          {/* Deposit Amount Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">$</span>
              <Input
                type="number"
                placeholder="Deposit amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="text-xl font-semibold h-12"
                min="1"
              />
              <Button 
                onClick={handlePayment}
                disabled={!depositAmount || parseFloat(depositAmount) < 1 || isLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 h-12"
              >
                {isLoading ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
            
            {paymentMethod === 'crypto' && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Bitcoin className="w-4 h-4" />
                    <span className="font-semibold">Crypto Payment Info</span>
                  </div>
                  <p>You'll be redirected to choose from multiple cryptocurrencies (Bitcoin, Ethereum, USDT, etc.) and complete your payment at current market rates.</p>
                </div>
              </div>
            )}
            
            {depositAmountNum >= 1 && applicableTier && (
              <div className="bg-white p-4 rounded-xl border border-stone-200">
                <div className="text-center space-y-2">
                  <p className="text-lg">
                    <span className="font-semibold">${depositAmountNum}</span> will get you approximately{' '}
                    <span className="font-bold text-orange-600">{calculateUpvotes(depositAmountNum)} upvotes</span>
                  </p>
                  <p className="text-sm text-stone-500">
                    Using {applicableTier.name} tier pricing ({applicableTier.pricePerUpvote}/upvote)
                    {applicableTier.discount && (
                      <span className="text-green-600 font-medium"> • {applicableTier.discount}</span>
                    )}
                  </p>
                </div>
              </div>
            )}
            
            {depositAmount && parseFloat(depositAmount) < 1 && (
              <div className="text-red-500 text-sm text-center">
                Minimum deposit amount is $1
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Tiers */}
      <div>
        <h2 className="text-2xl font-bold font-display text-stone-900 mb-6">Or choose a preset package</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {packages.map((pkg) => (
            <Card 
              key={pkg.name} 
              className={`relative ${pkg.isBestValue ? 'border-2 border-orange-500 shadow-lg' : 'border border-stone-200'}`}
            >
              {pkg.isBestValue && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Best Value
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold">{pkg.name}</CardTitle>
                <div className="mt-2">
                  <div className="text-3xl font-bold text-stone-900">
                    {pkg.price}
                    <span className="text-lg font-normal text-stone-500"> +</span>
                  </div>
                  <div className="text-lg font-semibold text-orange-600">
                    {pkg.pricePerUpvote}/upvote
                  </div>
                  {pkg.discount && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      {pkg.discount}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-stone-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full mt-6 ${
                    pkg.isBestValue 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-stone-100 text-stone-900 hover:bg-stone-200'
                  }`}
                  onClick={() => handleSelectPackage(pkg.name)}
                >
                  Select {pkg.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-stone-50 p-6 rounded-xl border border-stone-200">
        <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
        <div className="space-y-2 text-sm text-stone-600">
          <p>
            • <strong>Credit Card:</strong> Secure payment processing via Airwallex. Funds appear immediately after successful payment.
          </p>
          <p>
            • <strong>Cryptocurrency:</strong> Choose from 100+ cryptocurrencies including Bitcoin, Ethereum, USDT, and more. Processing time varies by network (typically 5-30 minutes).
          </p>
          <p>
            • All packages include access to post upvotes, post downvotes, comment upvotes, and comment downvotes.
          </p>
          <p>
            • Deposit any amount above $15 and automatically get the best tier pricing for that range.
          </p>
        </div>
      </div>
    </div>
  );
};
