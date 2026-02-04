import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useProducts, useAddresses, useCreateSubscription } from '@/hooks';
import {
  Card,
  CardHeader,
  Button,
  Input,
  Select,
  PageLoader,
  ErrorState,
  Alert,
} from '@/components/ui';
import { formatCurrency } from '@/utils';
import type { SubscriptionFormData, SubscriptionFrequency } from '@/types';
import toast from 'react-hot-toast';

const frequencyOptions = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'ALTERNATE_DAYS', label: 'Every Alternate Day' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'CUSTOM', label: 'Custom Days' },
];

const dayOptions = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

export const NewSubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const createMutation = useCreateSubscription();

  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    defaultValues: {
      quantity: 1,
      frequency: 'DAILY',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedProductId = watch('productId');
  const selectedFrequency = watch('frequency');
  const quantity = watch('quantity');

  const selectedProduct = products?.find((p) => p.id === selectedProductId);
  const estimatedPrice = selectedProduct?.currentPrice
    ? selectedProduct.currentPrice.price * (quantity || 1)
    : 0;

  if (productsLoading || addressesLoading) return <PageLoader />;

  if (!products?.length) {
    return (
      <ErrorState
        title="No Products Available"
        message="There are no products available for subscription at this time."
      />
    );
  }

  if (!addresses?.length) {
    return (
      <div className="space-y-6">
        <Alert type="warning" title="No Delivery Address">
          Please add a delivery address before creating a subscription.
        </Alert>
        <Button onClick={() => navigate('/customer/profile')}>
          Add Address
        </Button>
      </div>
    );
  }

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      const payload = {
        ...data,
        customDays:
          data.frequency === 'CUSTOM' && selectedDays.length > 0
            ? selectedDays
            : undefined,
      };
      await createMutation.mutateAsync(payload);
      toast.success('Subscription created successfully!');
      navigate('/customer/subscriptions');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create subscription');
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Subscription</h1>
        <p className="text-gray-600">Set up a new milk subscription</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader title="Select Product" />
          <div className="grid gap-3">
            {products.map((product) => (
              <label
                key={product.id}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedProductId === product.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={product.id}
                  {...register('productId', { required: 'Please select a product' })}
                  className="sr-only"
                />
                <div className="h-12 w-12 rounded-lg bg-white border flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🥛</span>
                </div>
                <div className="ml-4 flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  {product.description && (
                    <p className="text-sm text-gray-500">{product.description}</p>
                  )}
                </div>
                <div className="text-right">
                  {product.currentPrice && (
                    <p className="font-semibold text-primary-600">
                      {formatCurrency(product.currentPrice.price)}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">per {product.unit}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.productId && (
            <p className="mt-2 text-sm text-red-600">{errors.productId.message}</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Delivery Details" />
          <div className="space-y-4">
            <Select
              label="Delivery Address"
              options={addresses.map((addr) => ({
                value: addr.id,
                label: `${addr.label} - ${addr.addressLine1}, ${addr.city}`,
              }))}
              placeholder="Select address"
              {...register('addressId', { required: 'Please select an address' })}
              error={errors.addressId?.message}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity"
                type="number"
                min={selectedProduct?.minQuantity || 1}
                max={selectedProduct?.maxQuantity || 10}
                {...register('quantity', {
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Minimum quantity is 1' },
                  valueAsNumber: true,
                })}
                error={errors.quantity?.message}
                helperText={
                  selectedProduct
                    ? `${selectedProduct.minQuantity} - ${selectedProduct.maxQuantity} ${selectedProduct.unit}`
                    : undefined
                }
              />

              <Select
                label="Frequency"
                options={frequencyOptions}
                {...register('frequency', { required: 'Please select frequency' })}
                error={errors.frequency?.message}
              />
            </div>

            {selectedFrequency === 'CUSTOM' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(parseInt(day.value))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedDays.includes(parseInt(day.value))
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {selectedFrequency === 'CUSTOM' && selectedDays.length === 0 && (
                  <p className="mt-1 text-sm text-red-600">
                    Please select at least one day
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('startDate', { required: 'Start date is required' })}
                error={errors.startDate?.message}
              />

              <Input
                label="End Date (Optional)"
                type="date"
                {...register('endDate')}
                helperText="Leave empty for ongoing subscription"
              />
            </div>
          </div>
        </Card>

        {selectedProduct && (
          <Card className="bg-primary-50 border-primary-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary-700">Estimated cost per delivery</p>
                <p className="text-2xl font-bold text-primary-900">
                  {formatCurrency(estimatedPrice)}
                </p>
              </div>
              <div className="text-right text-sm text-primary-600">
                {quantity} {selectedProduct.unit} × {formatCurrency(selectedProduct.currentPrice?.price || 0)}
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/customer/subscriptions')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={createMutation.isPending}
            disabled={selectedFrequency === 'CUSTOM' && selectedDays.length === 0}
          >
            Create Subscription
          </Button>
        </div>
      </form>
    </div>
  );
};
