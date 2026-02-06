import { LayoutDashboard, TrendingUp, MessageSquare, ShoppingBag, KeyRound, Plus, Receipt, HelpCircle, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SidebarPreviewProps {
  onSignUpPrompt?: () => void;
}

export const SidebarPreview = ({ onSignUpPrompt }: SidebarPreviewProps) => {
  const [collapsed, setCollapsed] = useState(false);
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
      // Dashboard is already visible
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
  };

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 hidden md:flex`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <img 
              src="/white-bg-logo.png" 
              alt="UpVoteThat.com Logo" 
              className="h-12 w-auto"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button 
                  onClick={() => handleMenuItemClick(item)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors w-full text-left ${
                    item.active ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Demo Mode - Sign in to unlock
          </div>
        </div>
      )}
    </div>
  );
}; 