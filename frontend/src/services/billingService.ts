import api from './api';
import type {
  Bill,
  Payment,
  PaymentFormData,
  BillFilterParams,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const billingService = {
  async getMyBills(params?: BillFilterParams): Promise<PaginatedResponse<Bill>> {
    const response = await api.get<PaginatedResponse<Bill>>('/customer/bills', {
      params,
    });
    return response.data;
  },

  async getBillById(id: string): Promise<Bill> {
    const response = await api.get<ApiResponse<Bill>>(`/customer/bills/${id}`);
    return response.data.data!;
  },

  async makePayment(data: PaymentFormData): Promise<Payment> {
    const response = await api.post<ApiResponse<Payment>>('/customer/payments', data);
    return response.data.data!;
  },

  async getPayments(page = 1, limit = 20): Promise<PaginatedResponse<Payment>> {
    const response = await api.get<PaginatedResponse<Payment>>('/customer/payments', {
      params: { page, limit },
    });
    return response.data;
  },
};
