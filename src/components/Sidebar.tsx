import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  MessageSquare,
  ClipboardList,
  User,
  LogOut,
  Plus,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
  KeyRound,
  Users,
  ChevronLeft,
  ChevronRight,
  Receipt,
  HelpCircle,
  Link as LinkIcon,
  Server
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { useState } from 'react';
import v2Logo from '../../resources/upvotethatv2.png';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type AffiliateLink = {
  id: string;
  label: string;
  url: string;
  icon_url: string | null;
  sort_order: number;
  enabled: boolean;
};

async function fetchAffiliateLinks(): Promise<AffiliateLink[]> {
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('id, label, url, icon_url, sort_order, enabled')
    .eq('enabled', true)
    .order('sort_order', { ascending: true });

  if (error) {
    if ((error as any)?.message?.toLowerCase?.().includes('does not exist')) return [];
    throw error;
  }
  return (data || []) as any;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const [collapsed, setCollapsed] = useState(false);

  const { data: affiliateLinks } = useQuery<AffiliateLink[]>({
    queryKey: ['affiliate_links_sidebar'],
    queryFn: fetchAffiliateLinks,
    staleTime: 60_000,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const baseMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'order-upvotes', label: 'Order Upvotes', icon: TrendingUp },
    { id: 'order-comments', label: 'Order Comments', icon: MessageSquare },
    { id: 'order-proxies', label: 'Order Proxies', icon: Server },
    { id: 'buy-accounts', label: 'Buy Accounts', icon: ShoppingBag },
    { id: 'my-purchases', label: 'My Purchases', icon: KeyRound },
    { id: 'add-funds', label: 'Add Funds', icon: Plus },
    // { id: 'track-upvote-orders', label: 'Track Upvote Orders', icon: ClipboardList }, // Hidden - tracking now embedded in order pages
    // { id: 'track-comment-orders', label: 'Track Comment Orders', icon: ClipboardList }, // Hidden - tracking now embedded in order pages

    { id: 'transaction-history', label: 'Transaction History', icon: Receipt },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'account', label: 'Account', icon: User },
  ];

  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: ShieldCheck },
    { id: 'admin-manage-accounts', label: 'Manage Accounts', icon: Users },
    { id: 'admin-affiliate-links', label: 'Affiliate Links', icon: LinkIcon },
    { id: 'admin-user-balances', label: 'User Balances', icon: CreditCard },
  ];

  const renderMenuButton = (item: { id: string; label: string; icon: any }) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={cn(
          collapsed
            ? 'w-full flex items-center justify-center py-3 hover:bg-stone-50 transition-colors'
            : 'w-full flex items-center px-6 py-3 text-left hover:bg-stone-50 transition-colors',
          activeTab === item.id
            ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
            : 'text-stone-600 hover:text-stone-900'
        )}
      >
        <Icon className="w-5 h-5 mr-0" />
        {!collapsed && <span className="ml-3">{item.label}</span>}
      </button>
    );
  };

  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-stone-200/70 flex flex-col hidden md:flex`}>
      <div className="p-6 border-b border-stone-200/70 flex items-center justify-between">
        <div>
          <div className={collapsed ? 'hidden' : 'flex items-center'}>
            <img 
              src={v2Logo}
              alt="UpvoteThat"
              className="h-10 w-auto"
            />
          </div>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-2 p-1 rounded hover:bg-stone-100 text-stone-700 hover:text-stone-900 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      <nav className="mt-6 flex-1">
        {baseMenuItems.map(renderMenuButton)}

        {profile?.is_admin && (
          <div className={collapsed ? 'mt-2' : 'mt-6'}>
            {!collapsed && (
              <div className="px-6 pb-2 text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                Admin
              </div>
            )}
            <div className="flex flex-col">
              {adminMenuItems.map(renderMenuButton)}
            </div>
          </div>
        )}

        {(affiliateLinks || []).length > 0 && (
          <div className={collapsed ? 'mt-4' : 'mt-6'}>
            {!collapsed && (
              <div className="px-6 pb-2 text-[11px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                Links
              </div>
            )}
            <div className={collapsed ? 'flex flex-col' : 'flex flex-col'}>
              {(affiliateLinks || []).map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    collapsed
                      ? 'w-full flex items-center justify-center py-3 hover:bg-stone-50 transition-colors'
                      : 'w-full flex items-center px-6 py-3 text-left hover:bg-stone-50 transition-colors',
                    'text-stone-600 hover:text-stone-900'
                  )}
                  title={l.label}
                >
                  {l.icon_url ? (
                    <img
                      src={l.icon_url}
                      alt=""
                      className="w-5 h-5 rounded object-cover border border-stone-200 bg-white"
                    />
                  ) : (
                    <LinkIcon className="w-5 h-5" />
                  )}
                  {!collapsed && <span className="ml-3 truncate">{l.label}</span>}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
      <div className="p-6 border-t border-stone-200/70">
        <button
          onClick={handleSignOut}
          className={collapsed
            ? 'flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors w-full'
            : 'flex items-center text-stone-500 hover:text-stone-900 transition-colors w-full'}
        >
          <LogOut className="w-5 h-5 mr-0" />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};
