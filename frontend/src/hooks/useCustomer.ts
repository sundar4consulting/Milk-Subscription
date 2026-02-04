import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customerService';
import type { AddressFormData } from '@/types';

// Profile hooks
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: customerService.getProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; phone?: string }) =>
      customerService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Address hooks
export const useAddresses = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: customerService.getAddresses,
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddressFormData) => customerService.addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressFormData> }) =>
      customerService.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Wallet hooks
export const useWallet = () => {
  return useQuery({
    queryKey: ['wallet'],
    queryFn: customerService.getWallet,
  });
};

export const useWalletTransactions = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['walletTransactions', page, limit],
    queryFn: () => customerService.getWalletTransactions(page, limit),
  });
};

// Dashboard hooks
export const useCustomerDashboard = () => {
  return useQuery({
    queryKey: ['customerDashboard'],
    queryFn: customerService.getDashboard,
  });
};
