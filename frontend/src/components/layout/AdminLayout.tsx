import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils';
import { Avatar } from '../ui/Avatar';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Customers', href: '/admin/customers', icon: UsersIcon },
  { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: ClipboardDocumentListIcon },
  { name: 'Adhoc Requests', href: '/admin/adhoc', icon: ClipboardDocumentListIcon },
  { name: 'Deliveries', href: '/admin/deliveries', icon: TruckIcon },
  { name: 'Billing', href: '/admin/billing', icon: CurrencyDollarIcon },
  { name: 'Holidays', href: '/admin/holidays', icon: CalendarDaysIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <Transition show={sidebarOpen} as={React.Fragment}>
        <div className="fixed inset-0 z-40 lg:hidden">
          <Transition.Child
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
          </Transition.Child>

          <Transition.Child
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex flex-col w-full max-w-xs bg-gray-800 h-full">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              <SidebarContent
                navigation={navigation}
                currentPath={location.pathname}
              />
            </div>
          </Transition.Child>
        </div>
      </Transition>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-gray-800">
          <SidebarContent
            navigation={navigation}
            currentPath={location.pathname}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navbar */}
        <div className="sticky top-0 z-10 bg-white shadow">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex-1 flex items-center lg:ml-0">
              <h1 className="text-lg font-semibold text-gray-900">
                Admin Portal
              </h1>
            </div>

            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                <Avatar name={user?.name || 'Admin'} size="md" />
                <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name}
                </span>
              </Menu.Button>
              <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={cn(
                          'block w-full text-left px-4 py-2 text-sm text-gray-700',
                          active && 'bg-gray-100'
                        )}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

interface SidebarContentProps {
  navigation: typeof navigation;
  currentPath: string;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  navigation,
  currentPath,
}) => {
  return (
    <>
      <div className="flex items-center flex-shrink-0 px-4 h-16">
        <Link to="/admin" className="flex items-center">
          <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="ml-2 text-xl font-semibold text-white">
            Admin
          </span>
        </Link>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive =
              item.href === '/admin'
                ? currentPath === '/admin'
                : currentPath.startsWith(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-gray-300'
                      : 'text-gray-400 group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};
