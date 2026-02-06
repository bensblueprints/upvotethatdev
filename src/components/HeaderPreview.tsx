import { Bell, Search, User, Wallet, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';
import { LayoutDashboard, TrendingUp, MessageSquare, ShoppingBag, KeyRound, Plus, Receipt, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HeaderPreviewProps {
  onSignUpPrompt?: () => void;
}

export const HeaderPreview = ({ onSignUpPrompt }: HeaderPreviewProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
    { id: 'order-upvotes', label: 'Order Upvotes', icon: TrendingUp, active: false },
    { id: 'order-comments', label: 'Order Comments', icon: MessageSquare, active: false },
    { id: 'buy-accounts', label: 'Buy Accounts', icon: ShoppingBag, active: false },
    { id: 'my-purchases', label: 'My Purchases', icon: KeyRound, active: false },
    { id: 'add-funds', label: 'Add Funds', icon: Plus, active: false },
    { id: 'transaction-history', label: 'Transaction History', icon: Receipt, active: false },
    { id: 'support', label: 'Support', icon: HelpCircle, active: false },
    { id: 'account', label: 'Account', icon: User, active: false },
  ];

  const handleMenuItemClick = (item: any) => {
    if (item.id === 'dashboard') {
      // Dashboard is already visible, just close menu
      setMobileMenuOpen(false);
      return;
    }

    // Show sign up prompt for other sections
    toast({
      title: `${item.label} Preview`,
      description: "Sign up for a free account to access this section",
      action: (
        <Button
          size="sm"
          onClick={() => {
            if (onSignUpPrompt) {
              onSignUpPrompt();
            }
          }}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Sign Up Free
        </Button>
      ),
    });
    
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-4 relative z-10 mt-8">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <img 
                      src="/white-bg-logo.png" 
                      alt="UpVoteThat.com Logo" 
                      className="h-12 w-auto"
                    />
                  </SheetTitle>
                </SheetHeader>
                                 <div className="space-y-4 mt-6">
                   {menuItems.map((item) => {
                     const Icon = item.icon;
                     return (
                       <button
                         key={item.id}
                         onClick={() => handleMenuItemClick(item)}
                         className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-full text-left ${
                           item.active ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:text-gray-900'
                         }`}
                       >
                         <Icon className="w-5 h-5" />
                         <span className="font-medium">{item.label}</span>
                       </button>
                     );
                   })}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 text-center">
                      Preview Mode - Sign up to unlock
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="relative opacity-50 hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed w-32 md:w-auto"
              disabled
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2 md:space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg w-fit cursor-pointer hover:shadow-xl transition-all duration-200 hover:scale-105 opacity-90">
                  <CardContent className="p-2 md:p-3">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Wallet className="w-4 h-4 md:w-6 md:h-6" />
                      <div>
                        <p className="text-orange-100 text-xs hidden sm:block">Available Balance</p>
                        <p className="text-sm md:text-xl font-bold">$124.50</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to add funds (Preview)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="ghost" size="sm" className="opacity-50 cursor-not-allowed hidden sm:flex" disabled>
            <Bell className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center space-x-2 md:space-x-3 opacity-75">
            <div className="text-right text-sm hidden md:block">
              <div className="font-medium text-gray-900">Demo User</div>
              <div className="text-gray-500">demo@example.com</div>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-orange-100 text-orange-600">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}; 