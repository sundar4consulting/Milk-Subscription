import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAdhocRequests, useCancelAdhocRequest } from '@/hooks';
import {
  Card,
  Button,
  StatusBadge,
  Modal,
  PageLoader,
  ErrorState,
  EmptyState,
  Pagination,
} from '@/components/ui';
import { formatDate, formatCurrency } from '@/utils';
import type { AdhocRequest } from '@/types';
import toast from 'react-hot-toast';

export const AdhocRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useAdhocRequests(page);
  const [selectedRequest, setSelectedRequest] = useState<AdhocRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const cancelMutation = useCancelAdhocRequest();

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const requests = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const handleCancel = async () => {
    if (!selectedRequest) return;
    try {
      await cancelMutation.mutateAsync(selectedRequest.id);
      toast.success('Request cancelled successfully');
      setCancelModalOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      toast.error('Failed to cancel request');
    }
  };

  const openDetails = (request: AdhocRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const calculateTotal = (request: AdhocRequest) => {
    return request.items.reduce((total, item) => {
      const qty = item.approvedQuantity ?? item.requestedQuantity;
      const price = item.product.currentPrice?.price || 0;
      return total + qty * price;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adhoc Requests</h1>
          <p className="text-gray-600">Request additional milk deliveries</p>
        </div>
        <Link to="/customer/adhoc/new">
          <Button leftIcon={<PlusIcon className="h-5 w-5" />}>
            New Request
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="No adhoc requests"
          description="Request additional milk deliveries when you need extra"
          action={{
            label: 'Create Request',
            onClick: () => navigate('/customer/adhoc/new'),
          }}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {request.requestNumber}
                    </h3>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Requested for {formatDate(request.requestedDate)}
                    {request.preferredTimeSlot && ` • ${request.preferredTimeSlot}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {request.items.length} item(s) • {request.address.label}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {request.items.map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                      >
                        {item.product.name} × {item.approvedQuantity ?? item.requestedQuantity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetails(request)}
                    leftIcon={<EyeIcon className="h-4 w-4" />}
                  >
                    Details
                  </Button>
                  {request.status === 'PENDING' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setCancelModalOpen(true);
                      }}
                      leftIcon={<XMarkIcon className="h-4 w-4" />}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

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
                <p className="text-sm text-gray-500">Request Number</p>
                <p className="font-medium">{selectedRequest.requestNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Requested Date</p>
                <p className="font-medium">
                  {formatDate(selectedRequest.requestedDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time Slot</p>
                <p className="font-medium">
                  {selectedRequest.preferredTimeSlot || 'Any time'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Delivery Address</p>
              <p className="text-sm">
                {selectedRequest.address.addressLine1}
                {selectedRequest.address.addressLine2 &&
                  `, ${selectedRequest.address.addressLine2}`}
                <br />
                {selectedRequest.address.city}, {selectedRequest.address.state}{' '}
                {selectedRequest.address.postalCode}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Items</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Product
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        Requested
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        Approved
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedRequest.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.product.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {item.requestedQuantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          {item.approvedQuantity !== null ? (
                            <span
                              className={
                                item.approvedQuantity === item.requestedQuantity
                                  ? 'text-green-600'
                                  : item.approvedQuantity > 0
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }
                            >
                              {item.approvedQuantity}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {formatCurrency(
                            (item.approvedQuantity ?? item.requestedQuantity) *
                              (item.product.currentPrice?.price || 0)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-2 text-sm font-medium text-right"
                      >
                        Total
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-right">
                        {formatCurrency(calculateTotal(selectedRequest))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedRequest.customerNotes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Your Notes</p>
                <p className="text-sm text-gray-700">
                  {selectedRequest.customerNotes}
                </p>
              </div>
            )}

            {selectedRequest.adminNotes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Admin Notes</p>
                <p className="text-sm text-gray-700">
                  {selectedRequest.adminNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedRequest(null);
        }}
        title="Cancel Request"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel request{' '}
            <strong>{selectedRequest?.requestNumber}</strong>?
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCancelModalOpen(false);
                setSelectedRequest(null);
              }}
            >
              Keep Request
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              isLoading={cancelMutation.isPending}
            >
              Cancel Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
