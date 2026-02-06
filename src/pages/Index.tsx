import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { OrderUpvotes } from '@/components/OrderUpvotes';
import { OrderComments, CommentOrderTracking } from '@/components/OrderComments';
import { OrderTracking } from '@/components/OrderTracking';
import { AddFunds } from '@/components/AddFunds';
import { Account } from '@/components/Account';
import { Support } from '@/components/Support';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { useProfile } from '@/hooks/useProfile';
import { AdminDashboard } from '@/components/AdminDashboard';
import { BuyRedditAccounts } from '@/components/BuyRedditAccounts';
import { AdminRedditAccounts } from '@/components/AdminRedditAccounts';
import { AdminAffiliateLinks } from '@/components/AdminAffiliateLinks';
import { AdminUserBalances } from '@/components/AdminUserBalances';
import { MyPurchasedAccounts } from '@/components/MyPurchasedAccounts';

import { TransactionHistory } from '@/components/TransactionHistory';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, X } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingCryptoPayment, setPendingCryptoPayment] = useState<{amount: string, timestamp: number} | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = useProfile();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    
    // Handle payment status first
    if (query.get('payment_status') === 'success') {
      const amount = query.get('amount');
      const paymentMethod = query.get('method'); // We'll need to add this parameter
      
      // Check if this looks like a crypto payment return (from NowPayments)
      const isCryptoPayment = location.search.includes('nowpayments') || 
                             window.document.referrer.includes('nowpayments');
      
      if (isCryptoPayment && amount) {
        // Show crypto payment pending notice
        setPendingCryptoPayment({ 
          amount: amount, 
          timestamp: Date.now() 
        });
        toast({
          title: "Crypto Payment Received!",
          description: `$${amount} payment received. Awaiting network confirmation - your balance will update automatically within 10-15 minutes.`,
          duration: 6000,
        });
      } else {
        // Card payment via Airwallex - instant after webhook
        toast({
          title: "Payment Successful!",
          description: amount 
            ? `$${amount} has been successfully added to your balance.`
            : "Your funds have been added and should reflect in your balance shortly.",
        });
      }
      
      // Set dashboard tab immediately and clean up URL
      setActiveTab('dashboard');
      navigate('/dashboard', { replace: true });
      return; // Exit early to prevent other tab logic
    }

    if (query.get('payment_status') === 'cancelled') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You have not been charged.",
        variant: "destructive"
      });
      // Clean up URL
      navigate('/dashboard', { replace: true });
      return; // Exit early
    }

    // Only handle tab parameter if not a payment status redirect
    const tab = query.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search, navigate, toast]);

  // Auto-hide pending crypto payment notice after 20 minutes
  useEffect(() => {
    if (pendingCryptoPayment) {
      const timer = setTimeout(() => {
        setPendingCryptoPayment(null);
      }, 20 * 60 * 1000); // 20 minutes

      return () => clearTimeout(timer);
    }
  }, [pendingCryptoPayment]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'admin-dashboard':
        return profile?.is_admin ? <AdminDashboard /> : <Dashboard />;
      case 'admin-manage-accounts':
        return profile?.is_admin ? <AdminRedditAccounts /> : <Dashboard />;
      case 'admin-affiliate-links':
        return profile?.is_admin ? <AdminAffiliateLinks /> : <Dashboard />;
      case 'admin-user-balances':
        return profile?.is_admin ? <AdminUserBalances /> : <Dashboard />;
      case 'buy-accounts':
        return <BuyRedditAccounts />;
      case 'my-purchases':
        return <MyPurchasedAccounts />;
      case 'order-upvotes':
        return <OrderUpvotes />;
      case 'order-comments':
        return <OrderComments />;
      case 'track-upvote-orders':
        return <OrderTracking />;
      case 'track-comment-orders':
        return <CommentOrderTracking />;
      case 'order-tracking':
        return <OrderTracking />;
      case 'add-funds':
        return <AddFunds />;
      case 'account':
        return <Account setActiveTab={setActiveTab} />;
      case 'transaction-history':
        return <TransactionHistory />;
      case 'support':
        return <Support />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex flex-col flex-1 w-full md:w-auto">
        <Header setActiveTab={setActiveTab} />
        
        {/* Pending Crypto Payment Notice */}
        {pendingCryptoPayment && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="flex justify-between items-center">
                  <div>
                    <strong>${pendingCryptoPayment.amount} payment received.</strong> Awaiting network confirmation.
                    <br />
                    <span className="text-sm">Your wallet balance will update in 10-15 minutes (usually sooner) automatically, as soon as we receive confirmation from the network.</span>
                  </div>
                  <button 
                    onClick={() => setPendingCryptoPayment(null)}
                    className="text-blue-600 hover:text-blue-800 ml-4"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <main className="flex-1 p-3 md:p-6 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      <Toaster />
    </div>
  );
};

export default Index;
