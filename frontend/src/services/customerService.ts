import api from './api';
import type {
  CustomerProfile,
  Address,
  AddressFormData,
  CustomerWallet,
  WalletTransaction,
  CustomerDashboard,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const customerService = {
  // Profile
  async getProfile(): Promise<CustomerProfile> {
    const response = await api.get<ApiResponse<CustomerProfile>>('/customer/profile');
    return response.data.data!;
  },

  async updateProfile(data: { name?: string; phone?: string }): Promise<CustomerProfile> {
    const response = await api.put<ApiResponse<CustomerProfile>>('/customer/profile', data);
    return response.data.data!;
  },

  // Addresses
  async getAddresses(): Promise<Address[]> {
    const response = await api.get<ApiResponse<Address[]>>('/customer/addresses');
    return response.data.data!;
  },

  async addAddress(data: AddressFormData): Promise<Address> {
    const response = await api.post<ApiResponse<Address>>('/customer/addresses', data);
    return response.data.data!;
  },

  async updateAddress(id: string, data: Partial<AddressFormData>): Promise<Address> {
    const response = await api.put<ApiResponse<Address>>(`/customer/addresses/${id}`, data);
    return response.data.data!;
  },

  async deleteAddress(id: string): Promise<void> {
    await api.delete(`/customer/addresses/${id}`);
  },

  async setDefaultAddress(id: string): Promise<Address> {
    const response = await api.put<ApiResponse<Address>>(`/customer/addresses/${id}`, {
      isDefault: true,
    });
    return response.data.data!;
  },

  // Wallet
  async getWallet(): Promise<CustomerWallet> {
    const response = await api.get<ApiResponse<CustomerWallet>>('/customer/wallet');
    return response.data.data!;
  },

  async getWalletTransactions(page = 1, limit = 20): Promise<PaginatedResponse<WalletTransaction>> {
    const response = await api.get<PaginatedResponse<WalletTransaction>>(
      '/customer/wallet/transactions',
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  // Dashboard
  async getDashboard(): Promise<CustomerDashboard> {
    const response = await api.get<ApiResponse<CustomerDashboard>>('/customer/dashboard/summary');
    return response.data.data!;
  },
};
