import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { adminSettingsService } from '@/services/adminService';
import {
  Card,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  PageLoader,
  ErrorState,
} from '@/components/ui';
import type { SystemSettings } from '@/types';
import toast from 'react-hot-toast';

interface SettingsFormData {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  currency: string;
  timezone: string;
  
  // Delivery settings
  defaultDeliverySlot: string;
  deliveryStartTime: string;
  deliveryEndTime: string;
  maxDeliveriesPerSlot: number;
  
  // Subscription settings
  minSubscriptionDays: number;
  maxVacationDays: number;
  advanceNoticeDays: number;
  
  // Billing settings
  billingCycleDay: number;
  paymentDueDays: number;
  lateFeePercentage: number;
  
  // Notifications
  sendEmailNotifications: boolean;
  sendSmsNotifications: boolean;
  
  // Other
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export const AdminSettings: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: adminSettingsService.get,
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    values: settings as SettingsFormData,
  });

  const updateMutation = useMutation({
    mutationFn: adminSettingsService.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const onSubmit = (data: SettingsFormData) => {
    updateMutation.mutate(data);
  };

  const maintenanceMode = watch('maintenanceMode');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure system settings</p>
        </div>
        {isDirty && (
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Information */}
        <Card>
          <CardHeader
            title="Business Information"
            description="Your business details displayed to customers"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Business Name"
              {...register('businessName', { required: 'Business name is required' })}
              error={errors.businessName?.message}
            />
            <Input
              label="Business Email"
              type="email"
              {...register('businessEmail', { required: 'Email is required' })}
              error={errors.businessEmail?.message}
            />
            <Input
              label="Business Phone"
              {...register('businessPhone', { required: 'Phone is required' })}
              error={errors.businessPhone?.message}
            />
            <Select
              label="Currency"
              options={[
                { value: 'INR', label: 'Indian Rupee (₹)' },
                { value: 'USD', label: 'US Dollar ($)' },
                { value: 'EUR', label: 'Euro (€)' },
                { value: 'GBP', label: 'British Pound (£)' },
              ]}
              {...register('currency')}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Business Address"
                rows={2}
                {...register('businessAddress')}
              />
            </div>
            <Select
              label="Timezone"
              options={[
                { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
                { value: 'America/New_York', label: 'America/New_York (EST)' },
                { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
                { value: 'Europe/London', label: 'Europe/London (GMT)' },
                { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
              ]}
              {...register('timezone')}
            />
          </div>
        </Card>

        {/* Delivery Settings */}
        <Card>
          <CardHeader
            title="Delivery Settings"
            description="Configure delivery slots and limits"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Default Delivery Slot"
              options={[
                { value: 'MORNING', label: 'Morning (6 AM - 9 AM)' },
                { value: 'AFTERNOON', label: 'Afternoon (12 PM - 3 PM)' },
                { value: 'EVENING', label: 'Evening (5 PM - 8 PM)' },
              ]}
              {...register('defaultDeliverySlot')}
            />
            <Input
              label="Max Deliveries Per Slot"
              type="number"
              min={1}
              {...register('maxDeliveriesPerSlot', {
                valueAsNumber: true,
                min: { value: 1, message: 'Must be at least 1' },
              })}
              error={errors.maxDeliveriesPerSlot?.message}
            />
            <Input
              label="Delivery Start Time"
              type="time"
              {...register('deliveryStartTime')}
            />
            <Input
              label="Delivery End Time"
              type="time"
              {...register('deliveryEndTime')}
            />
          </div>
        </Card>

        {/* Subscription Settings */}
        <Card>
          <CardHeader
            title="Subscription Settings"
            description="Configure subscription rules and limits"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Min Subscription Days"
              type="number"
              min={1}
              {...register('minSubscriptionDays', {
                valueAsNumber: true,
                min: { value: 1, message: 'Must be at least 1' },
              })}
              error={errors.minSubscriptionDays?.message}
              helperText="Minimum days for a subscription"
            />
            <Input
              label="Max Vacation Days"
              type="number"
              min={0}
              {...register('maxVacationDays', {
                valueAsNumber: true,
                min: { value: 0, message: 'Cannot be negative' },
              })}
              error={errors.maxVacationDays?.message}
              helperText="Maximum vacation days per month"
            />
            <Input
              label="Advance Notice Days"
              type="number"
              min={0}
              {...register('advanceNoticeDays', {
                valueAsNumber: true,
                min: { value: 0, message: 'Cannot be negative' },
              })}
              error={errors.advanceNoticeDays?.message}
              helperText="Days notice for changes"
            />
          </div>
        </Card>

        {/* Billing Settings */}
        <Card>
          <CardHeader
            title="Billing Settings"
            description="Configure billing cycles and payment terms"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Billing Cycle Day"
              type="number"
              min={1}
              max={28}
              {...register('billingCycleDay', {
                valueAsNumber: true,
                min: { value: 1, message: 'Must be 1-28' },
                max: { value: 28, message: 'Must be 1-28' },
              })}
              error={errors.billingCycleDay?.message}
              helperText="Day of month for billing (1-28)"
            />
            <Input
              label="Payment Due Days"
              type="number"
              min={1}
              {...register('paymentDueDays', {
                valueAsNumber: true,
                min: { value: 1, message: 'Must be at least 1' },
              })}
              error={errors.paymentDueDays?.message}
              helperText="Days after bill for payment"
            />
            <Input
              label="Late Fee %"
              type="number"
              min={0}
              step={0.1}
              {...register('lateFeePercentage', {
                valueAsNumber: true,
                min: { value: 0, message: 'Cannot be negative' },
              })}
              error={errors.lateFeePercentage?.message}
              helperText="Late fee percentage"
            />
          </div>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader
            title="Notification Settings"
            description="Configure customer notifications"
          />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sendEmailNotifications"
                {...register('sendEmailNotifications')}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="sendEmailNotifications" className="text-sm">
                <span className="font-medium text-gray-900">
                  Email Notifications
                </span>
                <p className="text-gray-500">
                  Send email notifications for deliveries, bills, and updates
                </p>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="sendSmsNotifications"
                {...register('sendSmsNotifications')}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="sendSmsNotifications" className="text-sm">
                <span className="font-medium text-gray-900">
                  SMS Notifications
                </span>
                <p className="text-gray-500">
                  Send SMS notifications for important updates
                </p>
              </label>
            </div>
          </div>
        </Card>

        {/* Maintenance Mode */}
        <Card>
          <CardHeader
            title="Maintenance Mode"
            description="Put the system in maintenance mode"
          />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="maintenanceMode"
                {...register('maintenanceMode')}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="maintenanceMode" className="text-sm">
                <span className="font-medium text-gray-900">
                  Enable Maintenance Mode
                </span>
                <p className="text-gray-500">
                  Customers will see a maintenance message and cannot access the
                  system
                </p>
              </label>
            </div>
            {maintenanceMode && (
              <Textarea
                label="Maintenance Message"
                {...register('maintenanceMessage')}
                rows={3}
                placeholder="We're currently undergoing maintenance. Please check back later."
              />
            )}
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            isLoading={updateMutation.isPending}
            disabled={!isDirty}
          >
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
