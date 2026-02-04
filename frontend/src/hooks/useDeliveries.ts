import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '@/services/deliveryService';
import type { DeliveryFilterParams } from '@/types';

// Delivery hooks
export const useDeliveries = (params?: DeliveryFilterParams) => {
  return useQuery({
    queryKey: ['deliveries', params],
    queryFn: () => deliveryService.getMyDeliveries(params),
  });
};

export const useDelivery = (id: string) => {
  return useQuery({
    queryKey: ['delivery', id],
    queryFn: () => deliveryService.getById(id),
    enabled: !!id,
  });
};

export const useReportDeliveryIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, issue }: { id: string; issue: string }) =>
      deliveryService.reportIssue(id, issue),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['delivery', variables.id] });
    },
  });
};

export const useDeliveryCalendar = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['deliveryCalendar', startDate, endDate],
    queryFn: () => deliveryService.getCalendar(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
};
