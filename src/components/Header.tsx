
import { useProfile } from '@/hooks/useProfile';
import { Wallet, Loader2, Menu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface HeaderProps {
  setActiveTab?: (tab: string) => void;
}

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount));
};

export const Header = ({ setActiveTab }: HeaderProps) => {
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleBalanceClick = () => {
    if (setActiveTab) {
      setActiveTab('add-funds');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'order-upvotes', label: 'Order Upvotes' },
    { id: 'order-comments', label: 'Order Comments' },
    { id: 'buy-accounts', label: 'Buy Accounts' },
    { id: 'my-purchases', label: 'My Purchases' },
    { id: 'add-funds', label: 'Add Funds' },
    { id: 'transaction-history', label: 'Transaction History' },
    { id: 'support', label: 'Support' },
    { id: 'account', label: 'Account' },
  ];

  const handleMobileMenuClick = (tabId: string) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="p-3 md:p-4 border-b border-stone-200/70 bg-white flex justify-between items-center sticky top-0 z-40">
      {/* Left side - Mobile Menu or spacer */}
      <div className="flex items-center">
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="space-y-4 mt-6">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMobileMenuClick(item.id)}
                    className="block w-full text-left px-4 py-2 rounded-lg text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {/* Desktop spacer - could add logo or other elements here */}
        <div className="hidden md:block">
          {/* Space for future desktop navigation elements */}
        </div>
      </div>

      {/* Right side - Balance Card */}
      <div className="flex items-center">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className="bg-stone-900 text-white border-0 shadow-lg w-fit cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-[1.03]"
              onClick={handleBalanceClick}
            >
              <CardContent className="p-2 md:p-3">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <Wallet className="w-4 h-4 md:w-6 md:h-6" />
                  <div>
                    <p className="text-stone-300 text-xs hidden sm:block">Available Balance</p>
                    {isLoadingProfile ? (
                      <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    ) : (
                      <p className="text-sm md:text-xl font-bold">{formatCurrency(profile?.balance)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to add funds</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      </div>
    </header>
  );
};
