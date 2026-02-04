import api from './api';
import type {
  AdhocRequest,
  AdhocRequestFormData,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

interface AdhocCapacity {
  date: string;
  productId: string;
  productName: string;
  maxCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
}

export const adhocService = {
  // Customer endpoints
  async getMyRequests(page = 1, limit = 20): Promise<PaginatedResponse<AdhocRequest>> {
    const response = await api.get<PaginatedResponse<AdhocRequest>>('/customer/adhoc-requests', {
      params: { page, limit },
    });
    return response.data;
  },

  async getById(id: string): Promise<AdhocRequest> {
    const response = await api.get<ApiResponse<AdhocRequest>>(`/customer/adhoc-requests/${id}`);
    return response.data.data!;
  },

  async create(data: AdhocRequestFormData): Promise<AdhocRequest> {
    const response = await api.post<ApiResponse<AdhocRequest>>('/customer/adhoc-requests', data);
    return response.data.data!;
  },

  async cancel(id: string): Promise<AdhocRequest> {
    const response = await api.post<ApiResponse<AdhocRequest>>(
      `/customer/adhoc-requests/${id}/cancel`
    );
    return response.data.data!;
  },

  async checkCapacity(date: string): Promise<AdhocCapacity[]> {
    const response = await api.get<ApiResponse<AdhocCapacity[]>>(
      '/customer/adhoc-requests/capacity',
      {
        params: { date },
      }
    );
    return response.data.data!;
  },
};
