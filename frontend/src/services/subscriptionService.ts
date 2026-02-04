import api from './api';
import type {
  Subscription,
  SubscriptionFormData,
  Vacation,
  VacationFormData,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

export const subscriptionService = {
  // Subscriptions
  async getAll(page = 1, limit = 20): Promise<PaginatedResponse<Subscription>> {
    const response = await api.get<PaginatedResponse<Subscription>>('/customer/subscriptions', {
      params: { page, limit },
    });
    return response.data;
  },

  async getById(id: string): Promise<Subscription> {
    const response = await api.get<ApiResponse<Subscription>>(`/customer/subscriptions/${id}`);
    return response.data.data!;
  },

  async create(data: SubscriptionFormData): Promise<Subscription> {
    const response = await api.post<ApiResponse<Subscription>>('/customer/subscriptions', data);
    return response.data.data!;
  },

  async update(id: string, data: Partial<SubscriptionFormData>): Promise<Subscription> {
    const response = await api.put<ApiResponse<Subscription>>(
      `/customer/subscriptions/${id}`,
      data
    );
    return response.data.data!;
  },

  async pause(id: string, resumeDate?: string): Promise<Subscription> {
    const response = await api.post<ApiResponse<Subscription>>(
      `/customer/subscriptions/${id}/pause`,
      { resumeDate }
    );
    return response.data.data!;
  },

  async resume(id: string): Promise<Subscription> {
    const response = await api.post<ApiResponse<Subscription>>(
      `/customer/subscriptions/${id}/resume`
    );
    return response.data.data!;
  },

  async cancel(id: string): Promise<Subscription> {
    const response = await api.post<ApiResponse<Subscription>>(
      `/customer/subscriptions/${id}/cancel`
    );
    return response.data.data!;
  },

  // Vacations
  async getVacations(subscriptionId: string): Promise<Vacation[]> {
    const response = await api.get<ApiResponse<Vacation[]>>(
      `/customer/subscriptions/${subscriptionId}/vacations`
    );
    return response.data.data!;
  },

  async addVacation(subscriptionId: string, data: VacationFormData): Promise<Vacation> {
    const response = await api.post<ApiResponse<Vacation>>(
      `/customer/subscriptions/${subscriptionId}/vacations`,
      data
    );
    return response.data.data!;
  },

  async cancelVacation(subscriptionId: string, vacationId: string): Promise<void> {
    await api.delete(`/customer/subscriptions/${subscriptionId}/vacations/${vacationId}`);
  },
};
