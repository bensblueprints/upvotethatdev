import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, MessageSquare, Clock, DollarSign, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';

export const DashboardPreview = () => {
  // Demo stats data
  const demoStats = [
    {
      title: 'Total Orders',
      value: '127',
      change: '+23',
      changeText: 'this month',
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Active Orders',
      value: '8',
      change: '+5',
      changeText: 'this month',
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      title: 'Comments Posted',
      value: '45',
      change: '+12',
      changeText: 'this month',
      icon: MessageSquare,
      color: 'text-green-600',
    },
    {
      title: 'Upvotes Delivered',
      value: '2,847',
      change: '+524',
      changeText: 'this month',
      icon: ThumbsUp,
      color: 'text-emerald-600',
    },
    {
      title: 'Total Spent',
      value: '$1,249.50',
      change: '+$287.20',
      changeText: 'this month',
      icon: DollarSign,
      color: 'text-purple-600',
    },
  ];

  // Demo recent orders
  const demoOrders = [
    {
      id: 'demo-001',
      service: 'Reddit Upvotes',
      quantity: 100,
      status: 'In progress',
      created_at: new Date('2024-01-15'),
    },
    {
      id: 'demo-002',
      service: 'Reddit Comments',
      quantity: 5,
      status: 'Completed',
      created_at: new Date('2024-01-14'),
    },
    {
      id: 'demo-003',
      service: 'Reddit Upvotes',
      quantity: 250,
      status: 'Completed',
      created_at: new Date('2024-01-13'),
    },
    {
      id: 'demo-004',
      service: 'Reddit Comments',
      quantity: 10,
      status: 'Pending',
      created_at: new Date('2024-01-12'),
    },
  ];

  const getStatusDotColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in progress': return 'bg-orange-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 min-h-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2 text-sm md:text-base">Monitor your Reddit marketing campaigns</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
        {demoStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="transition-all hover:shadow-lg bg-white border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600 mt-1">
                  {stat.change} {stat.changeText}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="transition-all hover:shadow-lg bg-white border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Your latest upvote and comment orders</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile-friendly horizontal scroll container */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px] space-y-4">
              {demoOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4 min-w-0 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${getStatusDotColor(order.status)} flex-shrink-0`}></div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">Order #{order.id}</p>
                      <p className="text-sm text-gray-600 truncate">{order.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 md:space-x-4 flex-shrink-0">
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      {order.quantity} {order.service.includes('Comments') ? 'comments' : 'votes'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${getStatusBadgeColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-sm text-gray-500 whitespace-nowrap hidden sm:block">
                      {format(order.created_at, 'yyyy-MM-dd')}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap sm:hidden">
                      {format(order.created_at, 'MM/dd')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mobile scroll hint */}
          <div className="mt-3 text-xs text-gray-500 text-center sm:hidden">
            ← Swipe to see more details →
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 