import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { adminHolidayService } from '@/services/adminService';
import {
  Card,
  CardHeader,
  Button,
  Input,
  Modal,
  StatusBadge,
  PageLoader,
  ErrorState,
  EmptyState,
} from '@/components/ui';
import { formatDate } from '@/utils';
import type { Holiday } from '@/types';
import toast from 'react-hot-toast';
import { format, isBefore, isAfter, startOfToday } from 'date-fns';

interface HolidayFormData {
  date: string;
  name: string;
  description?: string;
  isRecurring: boolean;
}

export const AdminHolidays: React.FC = () => {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);
  const [deleteHoliday, setDeleteHoliday] = useState<Holiday | null>(null);

  const { data: holidays, isLoading, error, refetch } = useQuery({
    queryKey: ['adminHolidays'],
    queryFn: () => adminHolidayService.getAll({ year: new Date().getFullYear() }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HolidayFormData>();

  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    reset: editReset,
    formState: { errors: editErrors },
  } = useForm<HolidayFormData>();

  const createMutation = useMutation({
    mutationFn: adminHolidayService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHolidays'] });
      setCreateOpen(false);
      reset();
      toast.success('Holiday created successfully');
    },
    onError: () => {
      toast.error('Failed to create holiday');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HolidayFormData> }) =>
      adminHolidayService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHolidays'] });
      setEditHoliday(null);
      editReset();
      toast.success('Holiday updated successfully');
    },
    onError: () => {
      toast.error('Failed to update holiday');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminHolidayService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminHolidays'] });
      setDeleteHoliday(null);
      toast.success('Holiday deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete holiday');
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const onCreateSubmit = (data: HolidayFormData) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: HolidayFormData) => {
    if (!editHoliday) return;
    updateMutation.mutate({ id: editHoliday.id, data });
  };

  const handleEditClick = (holiday: Holiday) => {
    setEditHoliday(holiday);
    editReset({
      date: format(new Date(holiday.date), 'yyyy-MM-dd'),
      name: holiday.name,
      description: holiday.description || '',
      isRecurring: holiday.isRecurring,
    });
  };

  // Split holidays into upcoming and past
  const today = startOfToday();
  const upcomingHolidays = holidays
    ?.filter((h) => isAfter(new Date(h.date), today) || format(new Date(h.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const pastHolidays = holidays
    ?.filter((h) => isBefore(new Date(h.date), today) && format(new Date(h.date), 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd'))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holidays</h1>
          <p className="text-gray-600">
            Manage non-delivery days and holidays
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          leftIcon={<PlusIcon className="h-5 w-5" />}
        >
          Add Holiday
        </Button>
      </div>

      {!holidays || holidays.length === 0 ? (
        <EmptyState
          title="No holidays"
          description="Add holidays to mark non-delivery days"
          action={{
            label: 'Add Holiday',
            onClick: () => setCreateOpen(true),
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Upcoming Holidays */}
          {upcomingHolidays && upcomingHolidays.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upcoming Holidays ({upcomingHolidays.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingHolidays.map((holiday) => (
                  <Card key={holiday.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-14 h-14 bg-primary-100 rounded-lg flex flex-col items-center justify-center text-primary-600">
                      <span className="text-xs font-medium uppercase">
                        {format(new Date(holiday.date), 'MMM')}
                      </span>
                      <span className="text-xl font-bold">
                        {format(new Date(holiday.date), 'd')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {holiday.name}
                        </h3>
                        {holiday.isRecurring && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Recurring
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      {holiday.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {holiday.description}
                        </p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(holiday)}
                          leftIcon={<PencilIcon className="h-4 w-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteHoliday(holiday)}
                          leftIcon={<TrashIcon className="h-4 w-4" />}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Past Holidays */}
          {pastHolidays && pastHolidays.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4">
                Past Holidays ({pastHolidays.length})
              </h2>
              <Card padding="none">
                <div className="divide-y divide-gray-200">
                  {pastHolidays.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
                          <span className="text-xs font-medium uppercase">
                            {format(new Date(holiday.date), 'MMM')}
                          </span>
                          <span className="text-lg font-bold">
                            {format(new Date(holiday.date), 'd')}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-700">
                              {holiday.name}
                            </h3>
                            {holiday.isRecurring && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Recurring
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {format(new Date(holiday.date), 'EEEE, MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(holiday)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteHoliday(holiday)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Create Holiday Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          reset();
        }}
        title="Add Holiday"
      >
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
          <Input
            label="Date"
            type="date"
            {...register('date', { required: 'Date is required' })}
            error={errors.date?.message}
          />
          <Input
            label="Holiday Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
            placeholder="e.g., Diwali, Christmas"
          />
          <Input
            label="Description (Optional)"
            {...register('description')}
            placeholder="Optional notes about this holiday"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              {...register('isRecurring')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isRecurring" className="text-sm text-gray-700">
              Recurring yearly
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Add Holiday
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Holiday Modal */}
      <Modal
        isOpen={!!editHoliday}
        onClose={() => {
          setEditHoliday(null);
          editReset();
        }}
        title="Edit Holiday"
      >
        {editHoliday && (
          <form onSubmit={editHandleSubmit(onEditSubmit)} className="space-y-4">
            <Input
              label="Date"
              type="date"
              {...editRegister('date', { required: 'Date is required' })}
              error={editErrors.date?.message}
            />
            <Input
              label="Holiday Name"
              {...editRegister('name', { required: 'Name is required' })}
              error={editErrors.name?.message}
            />
            <Input
              label="Description (Optional)"
              {...editRegister('description')}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsRecurring"
                {...editRegister('isRecurring')}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="editIsRecurring" className="text-sm text-gray-700">
                Recurring yearly
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditHoliday(null);
                  editReset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Update Holiday
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteHoliday}
        onClose={() => setDeleteHoliday(null)}
        title="Delete Holiday"
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{deleteHoliday?.name}" on{' '}
          {deleteHoliday && format(new Date(deleteHoliday.date), 'MMMM d, yyyy')}?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteHoliday(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate(deleteHoliday!.id)}
            isLoading={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};
