import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  UsersIcon,
  ShoppingCartIcon,
  TruckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { adminDashboardService } from '@/services/adminService';
import { Card, CardHeader, StatusBadge, PageLoader, ErrorState } from '@/components/ui';
import { formatCurrency, formatDate } from '@/utils';

export const AdminDashboard: React.FC = () => {
  const { data: dashboard, isLoading, error, refetch } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: adminDashboardService.getDashboard,
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const stats = [
    {
      name: 'Total Customers',
      value: dashboard?.totalCustomers || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      href: '/admin/customers',
    },
    {
      name: 'Active Subscriptions',
      value: dashboard?.activeSubscriptions || 0,
      icon: ShoppingCartIcon,
      color: 'bg-green-500',
      href: '/admin/subscriptions',
    },
    {
      name: "Today's Deliveries",
      value: dashboard?.todayDeliveries || 0,
      icon: TruckIcon,
      color: 'bg-purple-500',
      href: '/admin/deliveries',
    },
    {
      name: 'Pending Adhoc',
      value: dashboard?.pendingAdhocRequests || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      href: '/admin/adhoc',
    },
    {
      name: 'Pending Payments',
      value: dashboard?.pendingPayments || 0,
      icon: CurrencyDollarIcon,
      color: 'bg-red-500',
      href: '/admin/billing',
    },
    {
      name: 'Monthly Revenue',
      value: formatCurrency(dashboard?.monthlyRevenue || 0),
      icon: CurrencyDollarIcon,
      color: 'bg-emerald-500',
      href: '/admin/billing',
    },
  ];

  const deliveryStats = dashboard?.deliveryStats || {
    scheduled: 0,
    outForDelivery: 0,
    delivered: 0,
    failed: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your milk delivery business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Status */}
        <Card>
          <CardHeader
            title="Today's Delivery Status"
            action={
              <Link
                to="/admin/deliveries"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                View all <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Scheduled</p>
              <p className="text-2xl font-bold text-blue-700">
                {deliveryStats.scheduled}
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="text-sm text-indigo-600">Out for Delivery</p>
              <p className="text-2xl font-bold text-indigo-700">
                {deliveryStats.outForDelivery}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Delivered</p>
              <p className="text-2xl font-bold text-green-700">
                {deliveryStats.delivered}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Failed</p>
              <p className="text-2xl font-bold text-red-700">
                {deliveryStats.failed}
              </p>
            </div>
          </div>
        </Card>

        {/* Recent Adhoc Requests */}
        <Card>
          <CardHeader
            title="Recent Adhoc Requests"
            action={
              <Link
                to="/admin/adhoc"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                View all <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            }
          />
          {dashboard?.recentOrders && dashboard.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.requestNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(order.requestedDate)} •{' '}
                      {order.items.length} items
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No recent adhoc requests
            </p>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/adhoc"
            className="flex flex-col items-center p-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"
          >
            <ClockIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-700">
              Review Adhoc
            </span>
            {(dashboard?.pendingAdhocRequests || 0) > 0 && (
              <span className="mt-1 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded-full">
                {dashboard?.pendingAdhocRequests} pending
              </span>
            )}
          </Link>
          <Link
            to="/admin/deliveries"
            className="flex flex-col items-center p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <TruckIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-700">
              Manage Deliveries
            </span>
          </Link>
          <Link
            to="/admin/billing"
            className="flex flex-col items-center p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">
              Generate Bills
            </span>
          </Link>
          <Link
            to="/admin/products"
            className="flex flex-col items-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <ShoppingCartIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">
              Manage Products
            </span>
          </Link>
        </div>
      </Card>
    </div>
  );
};
