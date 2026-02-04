import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService } from '@/services/billingService';
import type { BillFilterParams, PaymentFormData } from '@/types';

// Billing hooks
export const useBills = (params?: BillFilterParams) => {
  return useQuery({
    queryKey: ['bills', params],
    queryFn: () => billingService.getMyBills(params),
  });
};

export const useBill = (id: string) => {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: () => billingService.getBillById(id),
    enabled: !!id,
  });
};

export const useMakePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PaymentFormData) => billingService.makePayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['customerDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

export const usePayments = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['payments', page, limit],
    queryFn: () => billingService.getPayments(page, limit),
  });
};
