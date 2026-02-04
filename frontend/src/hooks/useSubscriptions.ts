import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscriptionService';
import type { SubscriptionFormData, VacationFormData } from '@/types';

// Subscription hooks
export const useSubscriptions = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['subscriptions', page, limit],
    queryFn: () => subscriptionService.getAll(page, limit),
  });
};

export const useSubscription = (id: string) => {
  return useQuery({
    queryKey: ['subscription', id],
    queryFn: () => subscriptionService.getById(id),
    enabled: !!id,
  });
};

export const useCreateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubscriptionFormData) => subscriptionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['customerDashboard'] });
    },
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubscriptionFormData> }) =>
      subscriptionService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.id] });
    },
  });
};

export const usePauseSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, resumeDate }: { id: string; resumeDate?: string }) =>
      subscriptionService.pause(id, resumeDate),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['customerDashboard'] });
    },
  });
};

export const useResumeSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionService.resume(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      queryClient.invalidateQueries({ queryKey: ['customerDashboard'] });
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => subscriptionService.cancel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      queryClient.invalidateQueries({ queryKey: ['customerDashboard'] });
    },
  });
};

// Vacation hooks
export const useVacations = (subscriptionId: string) => {
  return useQuery({
    queryKey: ['vacations', subscriptionId],
    queryFn: () => subscriptionService.getVacations(subscriptionId),
    enabled: !!subscriptionId,
  });
};

export const useAddVacation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriptionId, data }: { subscriptionId: string; data: VacationFormData }) =>
      subscriptionService.addVacation(subscriptionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vacations', variables.subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
};

export const useCancelVacation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      vacationId,
    }: {
      subscriptionId: string;
      vacationId: string;
    }) => subscriptionService.cancelVacation(subscriptionId, vacationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vacations', variables.subscriptionId] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
};
