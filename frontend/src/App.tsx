import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Auth
import { useAuthStore } from '@/stores/authStore';
import { LoginPage, RegisterPage } from '@/pages/auth';

// Layouts
import { CustomerLayout } from '@/components/layout/CustomerLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Customer Pages
import {
  CustomerDashboard,
  Subscriptions,
  NewSubscription,
  AdhocRequests,
  NewAdhocRequest,
  Deliveries,
  Billing,
  Wallet,
  Profile,
} from '@/pages/customer';

// Admin Pages
import {
  AdminDashboard,
  AdminCustomers,
  AdminProducts,
  AdminAdhoc,
  AdminDeliveries,
  AdminBilling,
  AdminHolidays,
  AdminSettings,
} from '@/pages/admin';

// Loading component
import { PageLoader } from '@/components/ui';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
interface ProtectedRouteProps {
  allowedRoles?: ('ADMIN' | 'CUSTOMER')[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    return user.role === 'ADMIN' ? (
      <Navigate to="/admin" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

// Public Route - redirects to dashboard if already logged in
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated && user) {
    return user.role === 'ADMIN' ? (
      <Navigate to="/admin" replace />
    ) : (
      <Navigate to="/dashboard" replace />
    );
  }

  return <>{children}</>;
};

// App Routes
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Customer Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<CustomerDashboard />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/subscriptions/new" element={<NewSubscription />} />
        <Route path="/adhoc" element={<AdhocRequests />} />
        <Route path="/adhoc/new" element={<NewAdhocRequest />} />
        <Route path="/deliveries" element={<Deliveries />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/adhoc" element={<AdminAdhoc />} />
        <Route path="/admin/deliveries" element={<AdminDeliveries />} />
        <Route path="/admin/billing" element={<AdminBilling />} />
        <Route path="/admin/holidays" element={<AdminHolidays />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
