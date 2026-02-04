import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adhocService } from '@/services/adhocService';
import type { AdhocRequestFormData } from '@/types';

// Adhoc request hooks
export const useAdhocRequests = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['adhocRequests', page, limit],
    queryFn: () => adhocService.getMyRequests(page, limit),
  });
};

export const useAdhocRequest = (id: string) => {
  return useQuery({
    queryKey: ['adhocRequest', id],
    queryFn: () => adhocService.getById(id),
    enabled: !!id,
  });
};

export const useCreateAdhocRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdhocRequestFormData) => adhocService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adhocRequests'] });
      queryClient.invalidateQueries({ queryKey: ['customerDashboard'] });
    },
  });
};

export const useCancelAdhocRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adhocService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['adhocRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adhocRequest', id] });
    },
  });
};

export const useAdhocCapacity = (date: string) => {
  return useQuery({
    queryKey: ['adhocCapacity', date],
    queryFn: () => adhocService.checkCapacity(date),
    enabled: !!date,
  });
};
