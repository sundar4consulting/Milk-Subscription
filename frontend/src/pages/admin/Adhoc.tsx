import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { adminAdhocService } from '@/services/adminService';
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
import { formatDate, formatCurrency, cn } from '@/utils';
import type { AdhocRequest, AdhocItem } from '@/types';
import toast from 'react-hot-toast';

export const AdminAdhoc: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<AdhocRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminAdhoc', page, statusFilter, search],
    queryFn: () =>
      adminAdhocService.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, items }: { id: string; items?: { itemId: string; approvedQuantity: number }[] }) =>
      adminAdhocService.approve(id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAdhoc'] });
      setApproveOpen(false);
      setSelectedRequest(null);
      setItemQuantities({});
      toast.success('Request approved successfully');
    },
    onError: () => {
      toast.error('Failed to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminAdhocService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAdhoc'] });
      setRejectOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      toast.success('Request rejected');
    },
    onError: () => {
      toast.error('Failed to reject request');
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const requests = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const openDetails = async (request: AdhocRequest) => {
    try {
      const details = await adminAdhocService.getById(request.id);
      setSelectedRequest(details);
      setDetailsOpen(true);
    } catch (err) {
      toast.error('Failed to load request details');
    }
  };

  const openApprove = (request: AdhocRequest) => {
    setSelectedRequest(request);
    // Initialize quantities with requested amounts
    const quantities: Record<string, number> = {};
    request.items?.forEach((item) => {
      quantities[item.id] = item.quantity;
    });
    setItemQuantities(quantities);
    setApproveOpen(true);
  };

  const handleApprove = () => {
    if (!selectedRequest) return;

    // Check if any quantities were modified (partial approval)
    const items = selectedRequest.items?.map((item) => ({
      itemId: item.id,
      approvedQuantity: itemQuantities[item.id] ?? item.quantity,
    }));

    const hasPartialApproval = items?.some(
      (item, index) =>
        item.approvedQuantity !== selectedRequest.items?.[index].quantity
    );

    approveMutation.mutate({
      id: selectedRequest.id,
      items: hasPartialApproval ? items : undefined,
    });
  };

  const calculateTotal = () => {
    if (!selectedRequest?.items) return 0;
    return selectedRequest.items.reduce((sum, item) => {
      const qty = itemQuantities[item.id] ?? item.quantity;
      return sum + qty * item.pricePerUnit;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Adhoc Requests</h1>
        <p className="text-gray-600">Manage one-time delivery requests</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'PARTIAL_APPROVED', label: 'Partially Approved' },
              { value: 'REJECTED', label: 'Rejected' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-48"
          />
        </div>
      </Card>

      {/* Requests List */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Delivery Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total
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
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.customer?.user?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {request.customer?.user?.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <p className="font-medium">{formatDate(request.deliveryDate)}</p>
                    <p className="text-gray-500">{request.deliverySlot}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    {request.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {formatCurrency(request.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetails(request)}
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                      >
                        View
                      </Button>
                      {request.status === 'PENDING' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openApprove(request)}
                            leftIcon={<CheckIcon className="h-4 w-4" />}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setRejectOpen(true);
                            }}
                            leftIcon={<XMarkIcon className="h-4 w-4" />}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedRequest(null);
        }}
        title="Request Details"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">
                  {selectedRequest.customer?.user?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Delivery Date</p>
                <p className="font-medium">
                  {formatDate(selectedRequest.deliveryDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time Slot</p>
                <p className="font-medium">{selectedRequest.deliverySlot}</p>
              </div>
            </div>

            {selectedRequest.address && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium">{selectedRequest.address.label}</p>
                  <p className="text-gray-600">
                    {selectedRequest.address.addressLine1},{' '}
                    {selectedRequest.address.city}, {selectedRequest.address.state}{' '}
                    {selectedRequest.address.postalCode}
                  </p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 mb-2">Items</p>
              <div className="space-y-2">
                {selectedRequest.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × {formatCurrency(item.pricePerUnit)}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.quantity * item.pricePerUnit)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <span className="font-medium">Total Amount</span>
              <span className="font-bold text-lg">
                {formatCurrency(selectedRequest.totalAmount)}
              </span>
            </div>

            {selectedRequest.notes && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Notes:</strong> {selectedRequest.notes}
                </p>
              </div>
            )}

            {selectedRequest.rejectionReason && (
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Rejection Reason:</strong>{' '}
                  {selectedRequest.rejectionReason}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={approveOpen}
        onClose={() => {
          setApproveOpen(false);
          setSelectedRequest(null);
          setItemQuantities({});
        }}
        title="Approve Request"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Approve or adjust quantities for this request. Reducing quantities
              will result in a partial approval.
            </p>

            <div className="space-y-3">
              {selectedRequest.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.product?.name}</p>
                    <p className="text-sm text-gray-500">
                      Requested: {item.quantity} ×{' '}
                      {formatCurrency(item.pricePerUnit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Approve:</label>
                    <Input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={itemQuantities[item.id] ?? item.quantity}
                      onChange={(e) =>
                        setItemQuantities({
                          ...itemQuantities,
                          [item.id]: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <span className="font-medium">Approved Total</span>
              <span className="font-bold text-lg">
                {formatCurrency(calculateTotal())}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setApproveOpen(false);
                  setSelectedRequest(null);
                  setItemQuantities({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                isLoading={approveMutation.isPending}
              >
                Approve Request
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setSelectedRequest(null);
          setRejectReason('');
        }}
        title="Reject Request"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please provide a reason for rejecting this request.
          </p>
          <Input
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Out of stock, Delivery area not serviceable"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setRejectOpen(false);
                setSelectedRequest(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                selectedRequest &&
                rejectMutation.mutate({
                  id: selectedRequest.id,
                  reason: rejectReason,
                })
              }
              isLoading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
