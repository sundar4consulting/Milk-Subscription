import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Card, Alert } from '@/components/ui';

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const [showError, setShowError] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.name, data.phone);
      navigate('/customer');
    } catch (err) {
      setShowError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Start your milk subscription journey today
          </p>
        </div>

        <Card className="p-8">
          {showError && error && (
            <Alert
              type="error"
              className="mb-6"
              onClose={() => {
                setShowError(false);
                clearError();
              }}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Full name"
              type="text"
              autoComplete="name"
              {...register('name', {
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
              error={errors.name?.message}
            />

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
              error={errors.email?.message}
            />

            <Input
              label="Phone number"
              type="tel"
              autoComplete="tel"
              placeholder="10-digit mobile number"
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Invalid Indian mobile number',
                },
              })}
              error={errors.phone?.message}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message:
                    'Password must contain uppercase, lowercase, and number',
                },
              })}
              error={errors.password?.message}
            />

            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
              error={errors.confirmPassword?.message}
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </a>
              </span>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
