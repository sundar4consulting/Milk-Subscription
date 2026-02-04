import api from './api';
import type {
  CustomerProfile,
  Product,
  ProductFormData,
  ProductPricing,
  Subscription,
  AdhocRequest,
  Delivery,
  Bill,
  Payment,
  Holiday,
  HolidayFormData,
  AdminDashboard,
  SystemSettings,
  User,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  DateRangeParams,
} from '@/types';

// Admin Dashboard
export const adminDashboardService = {
  async getDashboard(): Promise<AdminDashboard> {
    const response = await api.get<ApiResponse<AdminDashboard>>('/admin/dashboard');
    return response.data.data!;
  },
};

// Admin Customer Management
export const adminCustomerService = {
  async getAll(params?: PaginationParams & { search?: string; status?: string }): Promise<PaginatedResponse<CustomerProfile>> {
    const response = await api.get<PaginatedResponse<CustomerProfile>>('/admin/customers', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<CustomerProfile> {
    const response = await api.get<ApiResponse<CustomerProfile>>(`/admin/customers/${id}`);
    return response.data.data!;
  },

  async updateStatus(id: string, isActive: boolean): Promise<CustomerProfile> {
    const response = await api.patch<ApiResponse<CustomerProfile>>(`/admin/customers/${id}/status`, {
      isActive,
    });
    return response.data.data!;
  },

  async addWalletCredit(id: string, amount: number, description: string): Promise<void> {
    await api.post(`/admin/customers/${id}/wallet/credit`, { amount, description });
  },
};

// Admin Product Management
export const adminProductService = {
  async getAll(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/admin/products');
    return response.data.data!;
  },

  async getById(id: string): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/admin/products/${id}`);
    return response.data.data!;
  },

  async create(data: ProductFormData): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/admin/products', data);
    return response.data.data!;
  },

  async update(id: string, data: Partial<ProductFormData>): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/admin/products/${id}`, data);
    return response.data.data!;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/products/${id}`);
  },

  async setPrice(id: string, price: number, effectiveFrom: string): Promise<ProductPricing> {
    const response = await api.post<ApiResponse<ProductPricing>>(`/admin/products/${id}/pricing`, {
      price,
      effectiveFrom,
    });
    return response.data.data!;
  },

  async getPricingHistory(id: string): Promise<ProductPricing[]> {
    const response = await api.get<ApiResponse<ProductPricing[]>>(`/admin/products/${id}/pricing`);
    return response.data.data!;
  },
};

// Admin Subscription Management
export const adminSubscriptionService = {
  async getAll(params?: PaginationParams & { status?: string; customerId?: string }): Promise<PaginatedResponse<Subscription>> {
    const response = await api.get<PaginatedResponse<Subscription>>('/admin/subscriptions', {
      params,
    });
    return response.data;
  },
};

// Admin Adhoc Request Management
interface AdhocAnalytics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  approvalRate: number;
  averageQuantityPerRequest: number;
}

interface AdhocCapacitySettings {
  productId: string;
  productName: string;
  maxCapacity: number;
}

export const adminAdhocService = {
  async getAll(params?: PaginationParams & { status?: string; customerId?: string; date?: string }): Promise<PaginatedResponse<AdhocRequest>> {
    const response = await api.get<PaginatedResponse<AdhocRequest>>('/admin/adhoc-requests', {
      params,
    });
    return response.data;
  },

  async getPending(): Promise<AdhocRequest[]> {
    const response = await api.get<ApiResponse<AdhocRequest[]>>('/admin/adhoc-requests/pending');
    return response.data.data!;
  },

  async getById(id: string): Promise<AdhocRequest> {
    const response = await api.get<ApiResponse<AdhocRequest>>(`/admin/adhoc-requests/${id}`);
    return response.data.data!;
  },

  async approve(id: string, items?: { itemId: string; approvedQuantity: number }[]): Promise<AdhocRequest> {
    const response = await api.post<ApiResponse<AdhocRequest>>(
      `/admin/adhoc-requests/${id}/approve`,
      { items }
    );
    return response.data.data!;
  },

  async reject(id: string, adminNotes: string): Promise<AdhocRequest> {
    const response = await api.post<ApiResponse<AdhocRequest>>(
      `/admin/adhoc-requests/${id}/reject`,
      { adminNotes }
    );
    return response.data.data!;
  },

  async partialApprove(
    id: string,
    items: { itemId: string; approvedQuantity: number }[],
    adminNotes?: string
  ): Promise<AdhocRequest> {
    const response = await api.post<ApiResponse<AdhocRequest>>(
      `/admin/adhoc-requests/${id}/partial-approve`,
      { items, adminNotes }
    );
    return response.data.data!;
  },

  async getAnalytics(params?: DateRangeParams): Promise<AdhocAnalytics> {
    const response = await api.get<ApiResponse<AdhocAnalytics>>('/admin/adhoc-requests/analytics', {
      params,
    });
    return response.data.data!;
  },

  async getCapacitySettings(): Promise<AdhocCapacitySettings[]> {
    const response = await api.get<ApiResponse<AdhocCapacitySettings[]>>('/admin/adhoc-requests/capacity');
    return response.data.data!;
  },

  async updateCapacitySettings(productId: string, maxCapacity: number): Promise<void> {
    await api.put(`/admin/adhoc-requests/capacity/${productId}`, { maxCapacity });
  },
};

// Admin Delivery Management
export const adminDeliveryService = {
  async getAll(params?: PaginationParams & DateRangeParams & { status?: string; date?: string; deliveryPersonId?: string }): Promise<PaginatedResponse<Delivery>> {
    const response = await api.get<PaginatedResponse<Delivery>>('/admin/deliveries', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<Delivery> {
    const response = await api.get<ApiResponse<Delivery>>(`/admin/deliveries/${id}`);
    return response.data.data!;
  },

  async getToday(): Promise<Delivery[]> {
    const response = await api.get<ApiResponse<Delivery[]>>('/admin/deliveries/today');
    return response.data.data!;
  },

  async updateStatus(id: string, status: string, notes?: string): Promise<Delivery> {
    const response = await api.patch<ApiResponse<Delivery>>(`/admin/deliveries/${id}/status`, {
      status,
      notes,
    });
    return response.data.data!;;
  },

  async bulkUpdateStatus(deliveryIds: string[], status: string): Promise<void> {
    await api.patch('/admin/deliveries/bulk-status', { deliveryIds, status });
  },

  async generateSchedule(date: string): Promise<{ count: number }> {
    const response = await api.post<ApiResponse<{ count: number }>>('/admin/deliveries/generate', {
      date,
    });
    return response.data.data!;
  },

  async assignDeliveryPerson(deliveryIds: string[], deliveryPersonId: string): Promise<void> {
    await api.patch('/admin/deliveries/assign', { deliveryIds, deliveryPersonId });
  },

  async getDeliveryPersons(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/admin/delivery-persons');
    return response.data.data!;
  },
};

// Admin Billing Management
export const adminBillingService = {
  async getAll(params?: PaginationParams & { status?: string; search?: string; customerId?: string }): Promise<PaginatedResponse<Bill>> {
    const response = await api.get<PaginatedResponse<Bill>>('/admin/bills', {
      params,
    });
    return response.data;
  },

  async getById(id: string): Promise<Bill> {
    const response = await api.get<ApiResponse<Bill>>(`/admin/bills/${id}`);
    return response.data.data!;
  },

  async generateBills(month: string): Promise<{ count: number }> {
    const response = await api.post<ApiResponse<{ count: number }>>('/admin/bills/generate', {
      month,
    });
    return response.data.data!;
  },

  async recordPayment(billId: string, amount: number, method: string, reference?: string): Promise<Payment> {
    const response = await api.post<ApiResponse<Payment>>('/admin/payments', {
      billId,
      amount,
      method,
      transactionId: reference,
    });
    return response.data.data!;
  },

  async updateStatus(id: string, status: string): Promise<Bill> {
    const response = await api.patch<ApiResponse<Bill>>(`/admin/bills/${id}/status`, { status });
    return response.data.data!;
  },

  async recordManualPayment(data: {
    billId: string;
    amount: number;
    method: string;
    transactionId?: string;
    notes?: string;
  }): Promise<Payment> {
    const response = await api.post<ApiResponse<Payment>>('/admin/payments/manual', data);
    return response.data.data!;
  },
};

// Admin Holiday Management
export const adminHolidayService = {
  async getAll(params?: { year?: number }): Promise<Holiday[]> {
    const response = await api.get<ApiResponse<Holiday[]>>('/admin/holidays', {
      params,
    });
    return response.data.data!;
  },

  async create(data: HolidayFormData): Promise<Holiday> {
    const response = await api.post<ApiResponse<Holiday>>('/admin/holidays', data);
    return response.data.data!;
  },

  async update(id: string, data: Partial<HolidayFormData>): Promise<Holiday> {
    const response = await api.put<ApiResponse<Holiday>>(`/admin/holidays/${id}`, data);
    return response.data.data!;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/holidays/${id}`);
  },
};

// Admin Settings Management
export const adminSettingsService = {
  async get(): Promise<SystemSettings> {
    const response = await api.get<ApiResponse<SystemSettings>>('/admin/settings');
    return response.data.data!;
  },

  async update(data: Partial<SystemSettings>): Promise<SystemSettings> {
    const response = await api.put<ApiResponse<SystemSettings>>('/admin/settings', data);
    return response.data.data!;
  },
};
