import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  TruckIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { adminDeliveryService } from '@/services/adminService';
import {
  Card,
  Button,
  Input,
  Select,
  Modal,
  StatusBadge,
  PageLoader,
  ErrorState,
  Pagination,
} from '@/components/ui';
import { formatDate, formatCurrency } from '@/utils';
import type { Delivery } from '@/types';
import toast from 'react-hot-toast';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';

export const AdminDeliveries: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('SCHEDULED');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateDate, setGenerateDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminDeliveries', page, statusFilter, dateFilter],
    queryFn: () =>
      adminDeliveryService.getAll({
        page,
        limit: 50,
        status: statusFilter || undefined,
        date: dateFilter || undefined,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      adminDeliveryService.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDeliveries'] });
      setDetailsOpen(false);
      setSelectedDelivery(null);
      toast.success('Delivery status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const generateScheduleMutation = useMutation({
    mutationFn: (date: string) => adminDeliveryService.generateSchedule(date),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminDeliveries'] });
      setGenerateOpen(false);
      toast.success(`Generated ${data.count} deliveries`);
    },
    onError: () => {
      toast.error('Failed to generate schedule');
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const deliveries = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const openDetails = async (delivery: Delivery) => {
    try {
      const details = await adminDeliveryService.getById(delivery.id);
      setSelectedDelivery(details);
      setDetailsOpen(true);
    } catch (err) {
      toast.error('Failed to load delivery details');
    }
  };

  const handleStatusUpdate = (status: string) => {
    if (!selectedDelivery) return;
    updateStatusMutation.mutate({ id: selectedDelivery.id, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'OUT_FOR_DELIVERY':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Group deliveries by status for the summary
  const statusCounts = deliveries.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-600">Manage delivery schedules and status</p>
        </div>
        <Button
          onClick={() => setGenerateOpen(true)}
          leftIcon={<CalendarDaysIcon className="h-5 w-5" />}
        >
          Generate Schedule
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {statusCounts.SCHEDULED || 0}
          </p>
          <p className="text-sm text-gray-500">Scheduled</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {statusCounts.OUT_FOR_DELIVERY || 0}
          </p>
          <p className="text-sm text-gray-500">Out for Delivery</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {statusCounts.DELIVERED || 0}
          </p>
          <p className="text-sm text-gray-500">Delivered</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">
            {statusCounts.FAILED || 0}
          </p>
          <p className="text-sm text-gray-500">Failed</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-600">
            {statusCounts.CANCELLED || 0}
          </p>
          <p className="text-sm text-gray-500">Cancelled</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          />
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'SCHEDULED', label: 'Scheduled' },
              { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'FAILED', label: 'Failed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-48"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateFilter(format(new Date(), 'yyyy-MM-dd'))}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDateFilter(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
              }
            >
              Tomorrow
            </Button>
          </div>
        </div>
      </Card>

      {/* Deliveries Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Time Slot
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveries.map((delivery) => (
                <tr key={delivery.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {delivery.subscription?.customer?.user?.name ||
                          delivery.adhocRequest?.customer?.user?.name ||
                          'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {delivery.address?.addressLine1}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {delivery.subscription?.product?.name ||
                      delivery.adhocRequest?.items?.[0]?.product?.name ||
                      'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {delivery.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {delivery.deliverySlot || 'Morning'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        delivery.status
                      )}`}
                    >
                      {delivery.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetails(delivery)}
                      >
                        Details
                      </Button>
                      {delivery.status === 'SCHEDULED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: delivery.id,
                              status: 'OUT_FOR_DELIVERY',
                            })
                          }
                          leftIcon={<TruckIcon className="h-4 w-4" />}
                        >
                          Start
                        </Button>
                      )}
                      {delivery.status === 'OUT_FOR_DELIVERY' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: delivery.id,
                              status: 'DELIVERED',
                            })
                          }
                          leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {deliveries.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No deliveries found for the selected criteria
          </div>
        )}

        <div className="p-4 border-t">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* Delivery Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedDelivery(null);
        }}
        title="Delivery Details"
        size="lg"
      >
        {selectedDelivery && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">
                  {selectedDelivery.subscription?.customer?.user?.name ||
                    selectedDelivery.adhocRequest?.customer?.user?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={selectedDelivery.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Date</p>
                <p className="font-medium">
                  {formatDate(selectedDelivery.deliveryDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time Slot</p>
                <p className="font-medium">
                  {selectedDelivery.deliverySlot || 'Morning'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-medium">
                  {selectedDelivery.subscription?.product?.name ||
                    selectedDelivery.adhocRequest?.items?.[0]?.product?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium">{selectedDelivery.quantity}</p>
              </div>
            </div>

            {selectedDelivery.address && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium">{selectedDelivery.address.label}</p>
                  <p className="text-gray-600">
                    {selectedDelivery.address.addressLine1},{' '}
                    {selectedDelivery.address.city},{' '}
                    {selectedDelivery.address.state}{' '}
                    {selectedDelivery.address.postalCode}
                  </p>
                </div>
              </div>
            )}

            {selectedDelivery.notes && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Notes:</strong> {selectedDelivery.notes}
                </p>
              </div>
            )}

            {selectedDelivery.status !== 'DELIVERED' &&
              selectedDelivery.status !== 'CANCELLED' && (
                <div className="flex gap-3 pt-4 border-t">
                  {selectedDelivery.status === 'SCHEDULED' && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate('OUT_FOR_DELIVERY')}
                        isLoading={updateStatusMutation.isPending}
                        leftIcon={<TruckIcon className="h-4 w-4" />}
                      >
                        Mark Out for Delivery
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate('CANCELLED')}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {selectedDelivery.status === 'OUT_FOR_DELIVERY' && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate('DELIVERED')}
                        isLoading={updateStatusMutation.isPending}
                        leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                      >
                        Mark Delivered
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleStatusUpdate('FAILED')}
                      >
                        Mark Failed
                      </Button>
                    </>
                  )}
                </div>
              )}
          </div>
        )}
      </Modal>

      {/* Generate Schedule Modal */}
      <Modal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generate Delivery Schedule"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Generate delivery schedule for active subscriptions on a specific date.
            This will create delivery records for all customers with active
            subscriptions scheduled for that day.
          </p>
          <Input
            label="Date"
            type="date"
            value={generateDate}
            onChange={(e) => setGenerateDate(e.target.value)}
            min={format(new Date(), 'yyyy-MM-dd')}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => generateScheduleMutation.mutate(generateDate)}
              isLoading={generateScheduleMutation.isPending}
            >
              Generate Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
