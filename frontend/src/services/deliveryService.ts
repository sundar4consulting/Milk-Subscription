import api from './api';
import type {
  Delivery,
  DeliveryFilterParams,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

interface CalendarDelivery {
  date: string;
  deliveries: Delivery[];
}

export const deliveryService = {
  async getMyDeliveries(params?: DeliveryFilterParams): Promise<PaginatedResponse<Delivery>> {
    const response = await api.get<PaginatedResponse<Delivery>>('/customer/deliveries', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<Delivery> {
    const response = await api.get<ApiResponse<Delivery>>(`/customer/deliveries/${id}`);
    return response.data.data!;
  },

  async reportIssue(id: string, issue: string): Promise<Delivery> {
    const response = await api.post<ApiResponse<Delivery>>(
      `/customer/deliveries/${id}/report-issue`,
      { issue }
    );
    return response.data.data!;
  },

  async getCalendar(startDate: string, endDate: string): Promise<CalendarDelivery[]> {
    const response = await api.get<ApiResponse<CalendarDelivery[]>>('/customer/deliveries/calendar', {
      params: { startDate, endDate },
    });
    return response.data.data!;
  },
};
