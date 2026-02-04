import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  UserIcon,
  MapPinIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import {
  useProfile,
  useUpdateProfile,
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '@/hooks';
import {
  Card,
  CardHeader,
  Button,
  Input,
  Modal,
  Textarea,
  PageLoader,
  ErrorState,
  Avatar,
} from '@/components/ui';
import type { Address, AddressFormData } from '@/types';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: profile, isLoading, error, refetch } = useProfile();
  const { data: addresses } = useAddresses();
  
  const [editingProfile, setEditingProfile] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const updateProfileMutation = useUpdateProfile();
  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();

  const profileForm = useForm<{ name: string; phone: string }>({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  const addressForm = useForm<AddressFormData>();

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const handleUpdateProfile = async (data: { name: string; phone: string }) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      toast.success('Profile updated successfully');
      setEditingProfile(false);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const openAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      addressForm.reset({
        label: address.label,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        isDefault: address.isDefault,
        deliveryInstructions: address.deliveryInstructions || '',
      });
    } else {
      setEditingAddress(null);
      addressForm.reset({
        label: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        isDefault: false,
        deliveryInstructions: '',
      });
    }
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async (data: AddressFormData) => {
    try {
      if (editingAddress) {
        await updateAddressMutation.mutateAsync({
          id: editingAddress.id,
          data,
        });
        toast.success('Address updated successfully');
      } else {
        await addAddressMutation.mutateAsync(data);
        toast.success('Address added successfully');
      }
      setAddressModalOpen(false);
      setEditingAddress(null);
    } catch (err) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (address: Address) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteAddressMutation.mutateAsync(address.id);
      toast.success('Address deleted successfully');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader
          title="Personal Information"
          action={
            !editingProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingProfile(true)}
                leftIcon={<PencilIcon className="h-4 w-4" />}
              >
                Edit
              </Button>
            )
          }
        />

        {editingProfile ? (
          <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
            <Input
              label="Full Name"
              {...profileForm.register('name', { required: 'Name is required' })}
              error={profileForm.formState.errors.name?.message}
            />
            <Input
              label="Phone Number"
              {...profileForm.register('phone', {
                pattern: {
                  value: /^[6-9]\d{9}$/,
                  message: 'Invalid phone number',
                },
              })}
              error={profileForm.formState.errors.phone?.message}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProfile(false)}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateProfileMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-6">
            <Avatar name={user?.name || 'User'} size="xl" />
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">
                  {user?.phone || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Addresses Card */}
      <Card>
        <CardHeader
          title="Delivery Addresses"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddressModal()}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Add Address
            </Button>
          }
        />

        {addresses && addresses.length > 0 ? (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{address.label}</p>
                      {address.isDefault && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary-100 text-primary-700">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    {address.deliveryInstructions && (
                      <p className="text-sm text-gray-400 mt-1 italic">
                        {address.deliveryInstructions}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddressModal(address)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={() => handleDeleteAddress(address)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No addresses added yet
          </p>
        )}
      </Card>

      {/* Address Modal */}
      <Modal
        isOpen={addressModalOpen}
        onClose={() => {
          setAddressModalOpen(false);
          setEditingAddress(null);
        }}
        title={editingAddress ? 'Edit Address' : 'Add Address'}
        size="lg"
      >
        <form onSubmit={addressForm.handleSubmit(handleSaveAddress)} className="space-y-4">
          <Input
            label="Label"
            placeholder="e.g., Home, Office"
            {...addressForm.register('label', { required: 'Label is required' })}
            error={addressForm.formState.errors.label?.message}
          />

          <Input
            label="Address Line 1"
            placeholder="House/Flat number, Building name"
            {...addressForm.register('addressLine1', {
              required: 'Address is required',
            })}
            error={addressForm.formState.errors.addressLine1?.message}
          />

          <Input
            label="Address Line 2"
            placeholder="Street, Area, Landmark"
            {...addressForm.register('addressLine2')}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              {...addressForm.register('city', { required: 'City is required' })}
              error={addressForm.formState.errors.city?.message}
            />
            <Input
              label="State"
              {...addressForm.register('state', { required: 'State is required' })}
              error={addressForm.formState.errors.state?.message}
            />
          </div>

          <Input
            label="Postal Code"
            {...addressForm.register('postalCode', {
              required: 'Postal code is required',
              pattern: {
                value: /^\d{6}$/,
                message: 'Invalid postal code',
              },
            })}
            error={addressForm.formState.errors.postalCode?.message}
          />

          <Textarea
            label="Delivery Instructions"
            placeholder="Any special instructions for delivery person..."
            {...addressForm.register('deliveryInstructions')}
          />

          <label className="flex items-center">
            <input
              type="checkbox"
              {...addressForm.register('isDefault')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-600">
              Set as default address
            </span>
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAddressModalOpen(false);
                setEditingAddress(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={
                addAddressMutation.isPending || updateAddressMutation.isPending
              }
            >
              {editingAddress ? 'Update Address' : 'Add Address'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
