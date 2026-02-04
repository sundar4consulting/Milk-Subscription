import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useProducts, useAddresses, useCreateAdhocRequest, useAdhocCapacity } from '@/hooks';
import {
  Card,
  CardHeader,
  Button,
  Input,
  Select,
  Textarea,
  PageLoader,
  Alert,
} from '@/components/ui';
import { formatCurrency, formatDate } from '@/utils';
import type { AdhocRequestFormData } from '@/types';
import toast from 'react-hot-toast';
import { addDays } from 'date-fns';

const timeSlotOptions = [
  { value: '', label: 'Any time' },
  { value: '6AM-8AM', label: '6:00 AM - 8:00 AM' },
  { value: '8AM-10AM', label: '8:00 AM - 10:00 AM' },
  { value: '10AM-12PM', label: '10:00 AM - 12:00 PM' },
  { value: '4PM-6PM', label: '4:00 PM - 6:00 PM' },
];

interface FormData {
  addressId: string;
  requestedDate: string;
  preferredTimeSlot: string;
  customerNotes: string;
  items: { productId: string; quantity: number }[];
}

export const NewAdhocRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();
  const createMutation = useCreateAdhocRequest();

  const minDate = addDays(new Date(), 1).toISOString().split('T')[0];

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      requestedDate: minDate,
      items: [{ productId: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedDate = watch('requestedDate');

  const { data: capacity } = useAdhocCapacity(watchedDate);

  if (productsLoading || addressesLoading) return <PageLoader />;

  if (!products?.length) {
    return (
      <Alert type="warning" title="No Products Available">
        There are no products available for adhoc requests at this time.
      </Alert>
    );
  }

  if (!addresses?.length) {
    return (
      <div className="space-y-6">
        <Alert type="warning" title="No Delivery Address">
          Please add a delivery address before creating an adhoc request.
        </Alert>
        <Button onClick={() => navigate('/customer/profile')}>
          Add Address
        </Button>
      </div>
    );
  }

  const calculateTotal = () => {
    return watchedItems.reduce((total, item) => {
      const product = products?.find((p) => p.id === item.productId);
      const price = product?.currentPrice?.price || 0;
      return total + price * (item.quantity || 0);
    }, 0);
  };

  const getAvailableQuantity = (productId: string) => {
    const cap = capacity?.find((c) => c.productId === productId);
    return cap?.availableCapacity ?? 999;
  };

  const onSubmit = async (data: FormData) => {
    const validItems = data.items.filter(
      (item) => item.productId && item.quantity > 0
    );

    if (validItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    // Check capacity
    for (const item of validItems) {
      const available = getAvailableQuantity(item.productId);
      if (item.quantity > available) {
        const product = products?.find((p) => p.id === item.productId);
        toast.error(
          `Only ${available} ${product?.unit || 'units'} of ${
            product?.name
          } available for ${formatDate(data.requestedDate)}`
        );
        return;
      }
    }

    try {
      await createMutation.mutateAsync({
        addressId: data.addressId,
        requestedDate: data.requestedDate,
        preferredTimeSlot: data.preferredTimeSlot || undefined,
        customerNotes: data.customerNotes || undefined,
        items: validItems,
      });
      toast.success('Adhoc request submitted successfully!');
      navigate('/customer/adhoc');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Adhoc Request</h1>
        <p className="text-gray-600">Request additional milk delivery</p>
      </div>

      <Alert type="info">
        Adhoc requests need admin approval. Please submit at least 24 hours in advance.
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                label="Delivery Date"
                type="date"
                min={minDate}
                {...register('requestedDate', {
                  required: 'Date is required',
                })}
                error={errors.requestedDate?.message}
              />

              <Select
                label="Preferred Time Slot"
                options={timeSlotOptions}
                {...register('preferredTimeSlot')}
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Products"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: '', quantity: 1 })}
                leftIcon={<PlusIcon className="h-4 w-4" />}
              >
                Add Item
              </Button>
            }
          />
          <div className="space-y-4">
            {fields.map((field, index) => {
              const selectedProduct = products?.find(
                (p) => p.id === watchedItems[index]?.productId
              );
              const available = getAvailableQuantity(
                watchedItems[index]?.productId
              );

              return (
                <div
                  key={field.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Select
                      label={index === 0 ? 'Product' : undefined}
                      options={products.map((p) => ({
                        value: p.id,
                        label: `${p.name} - ${formatCurrency(
                          p.currentPrice?.price || 0
                        )}/${p.unit}`,
                      }))}
                      placeholder="Select product"
                      {...register(`items.${index}.productId` as const, {
                        required: 'Product is required',
                      })}
                    />
                    <div>
                      <Input
                        label={index === 0 ? 'Quantity' : undefined}
                        type="number"
                        min={1}
                        max={selectedProduct?.maxQuantity || 10}
                        {...register(`items.${index}.quantity` as const, {
                          required: 'Quantity is required',
                          min: { value: 1, message: 'Min 1' },
                          valueAsNumber: true,
                        })}
                      />
                      {selectedProduct && available < 999 && (
                        <p
                          className={`text-xs mt-1 ${
                            available > 0 ? 'text-gray-500' : 'text-red-500'
                          }`}
                        >
                          Available: {available} {selectedProduct.unit}
                        </p>
                      )}
                    </div>
                  </div>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="mt-7 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Additional Notes" />
          <Textarea
            placeholder="Any special instructions or notes for your request..."
            rows={3}
            {...register('customerNotes')}
          />
        </Card>

        <Card className="bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary-700">Estimated Total</p>
              <p className="text-2xl font-bold text-primary-900">
                {formatCurrency(calculateTotal())}
              </p>
            </div>
            <p className="text-sm text-primary-600">
              {watchedItems.filter((i) => i.productId).length} item(s)
            </p>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/customer/adhoc')}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Submit Request
          </Button>
        </div>
      </form>
    </div>
  );
};
