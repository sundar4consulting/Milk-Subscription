import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCartIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useCustomerDashboard, useWallet } from '@/hooks';
import { Card, CardHeader, StatusBadge, PageLoader, ErrorState } from '@/components/ui';
import { formatCurrency, formatDate } from '@/utils';

export const CustomerDashboard: React.FC = () => {
  const { data: dashboard, isLoading, error, refetch } = useCustomerDashboard();
  const { data: wallet } = useWallet();

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const stats = [
    {
      name: 'Active Subscriptions',
      value: dashboard?.activeSubscriptions || 0,
      icon: ShoppingCartIcon,
      color: 'bg-green-500',
      href: '/customer/subscriptions',
    },
    {
      name: 'Pending Deliveries',
      value: dashboard?.pendingDeliveries || 0,
      icon: CalendarIcon,
      color: 'bg-blue-500',
      href: '/customer/deliveries',
    },
    {
      name: 'Pending Bills',
      value: dashboard?.pendingBills || 0,
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500',
      href: '/customer/billing',
    },
    {
      name: 'Wallet Balance',
      value: formatCurrency(wallet?.balance || 0),
      icon: ClockIcon,
      color: 'bg-purple-500',
      href: '/customer/wallet',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your milk subscription</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        {/* Upcoming Deliveries */}
        <Card>
          <CardHeader
            title="Upcoming Deliveries"
            action={
              <Link
                to="/customer/deliveries"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                View all <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            }
          />
          {dashboard?.upcomingDeliveries &&
          dashboard.upcomingDeliveries.length > 0 ? (
            <div className="space-y-3">
              {dashboard.upcomingDeliveries.slice(0, 5).map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {delivery.product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(delivery.scheduledDate)} • {delivery.quantity}{' '}
                      {delivery.product.unit}
                    </p>
                  </div>
                  <StatusBadge status={delivery.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No upcoming deliveries
            </p>
          )}
        </Card>

        {/* Recent Bills */}
        <Card>
          <CardHeader
            title="Recent Bills"
            action={
              <Link
                to="/customer/billing"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                View all <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            }
          />
          {dashboard?.recentBills && dashboard.recentBills.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentBills.slice(0, 5).map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {bill.billNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(bill.periodStart)} -{' '}
                      {formatDate(bill.periodEnd)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(bill.totalAmount)}
                    </p>
                    <StatusBadge status={bill.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent bills</p>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/customer/subscriptions/new"
            className="flex flex-col items-center p-4 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
          >
            <ShoppingCartIcon className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-primary-700">
              New Subscription
            </span>
          </Link>
          <Link
            to="/customer/adhoc/new"
            className="flex flex-col items-center p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
          >
            <ClockIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-700">
              Adhoc Request
            </span>
          </Link>
          <Link
            to="/customer/deliveries"
            className="flex flex-col items-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <CalendarIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-700">
              View Calendar
            </span>
          </Link>
          <Link
            to="/customer/billing"
            className="flex flex-col items-center p-4 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"
          >
            <CurrencyDollarIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-700">
              Pay Bills
            </span>
          </Link>
        </div>
      </Card>
    </div>
  );
};
