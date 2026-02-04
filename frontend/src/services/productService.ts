import api from './api';
import type { Product, ApiResponse } from '@/types';

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/products');
    return response.data.data!;
  },

  async getById(id: string): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data!;
  },
};
