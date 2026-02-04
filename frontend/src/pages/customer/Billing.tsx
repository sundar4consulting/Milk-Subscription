import React, { useState } from 'react';
import { useBills, useBill, useMakePayment } from '@/hooks';
import {
  Card,
  CardHeader,
  Button,
  StatusBadge,
  Modal,
  Select,
  Input,
  PageLoader,
  ErrorState,
  EmptyState,
  Pagination,
} from '@/components/ui';
import { formatDate, formatCurrency, cn } from '@/utils';
import type { Bill, PaymentMethod } from '@/types';
import toast from 'react-hot-toast';

const paymentMethodOptions = [
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'WALLET', label: 'Wallet Balance' },
  { value: 'CASH', label: 'Cash' },
];

export const BillingPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data, isLoading, error, refetch } = useBills({ page, status: statusFilter as any });
  
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [transactionId, setTransactionId] = useState('');

  const { data: billDetails, isLoading: detailsLoading } = useBill(selectedBillId || '');
  const paymentMutation = useMakePayment();

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const bills = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const openDetails = (bill: Bill) => {
    setSelectedBillId(bill.id);
    setDetailsOpen(true);
  };

  const openPayment = (bill: Bill) => {
    setSelectedBillId(bill.id);
    setPaymentAmount(bill.totalAmount - bill.paidAmount);
    setDetailsOpen(false);
    setPaymentOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedBillId) return;
    try {
      await paymentMutation.mutateAsync({
        billId: selectedBillId,
        amount: paymentAmount,
        method: paymentMethod,
        transactionId: transactionId || undefined,
      });
      toast.success('Payment recorded successfully');
      setPaymentOpen(false);
      setSelectedBillId(null);
      setTransactionId('');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
    { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
    { value: 'OVERDUE', label: 'Overdue' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600">View and pay your bills</p>
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40"
        />
      </div>

      {bills.length === 0 ? (
        <EmptyState
          title="No bills yet"
          description="Your bills will appear here as deliveries are completed"
        />
      ) : (
        <div className="space-y-4">
          {bills.map((bill) => {
            const isPending = ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(
              bill.status
            );
            const dueAmount = bill.totalAmount - bill.paidAmount;

            return (
              <Card key={bill.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {bill.billNumber}
                      </h3>
                      <StatusBadge status={bill.status} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(bill.periodStart)} -{' '}
                      {formatDate(bill.periodEnd)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Due: {formatDate(bill.dueDate)}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(bill.totalAmount)}
                      </p>
                      {bill.paidAmount > 0 && bill.paidAmount < bill.totalAmount && (
                        <p className="text-sm text-gray-500">
                          Paid: {formatCurrency(bill.paidAmount)} | Due:{' '}
                          {formatCurrency(dueAmount)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetails(bill)}
                      >
                        View Details
                      </Button>
                      {isPending && (
                        <Button size="sm" onClick={() => openPayment(bill)}>
                          Pay {formatCurrency(dueAmount)}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Bill Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedBillId(null);
        }}
        title="Bill Details"
        size="lg"
      >
        {detailsLoading ? (
          <PageLoader />
        ) : billDetails ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Bill Number</p>
                <p className="font-medium">{billDetails.billNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={billDetails.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Period</p>
                <p className="font-medium">
                  {formatDate(billDetails.periodStart)} -{' '}
                  {formatDate(billDetails.periodEnd)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">{formatDate(billDetails.dueDate)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">Items</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                        Product
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                        Rate
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {billDetails.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.product.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {formatCurrency(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-sm font-medium text-right">
                        Total
                      </td>
                      <td className="px-4 py-2 text-sm font-bold text-right">
                        {formatCurrency(billDetails.totalAmount)}
                      </td>
                    </tr>
                    {billDetails.paidAmount > 0 && (
                      <>
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-sm text-right text-green-600">
                            Paid
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-green-600">
                            -{formatCurrency(billDetails.paidAmount)}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-sm font-medium text-right">
                            Balance Due
                          </td>
                          <td className="px-4 py-2 text-sm font-bold text-right text-red-600">
                            {formatCurrency(billDetails.totalAmount - billDetails.paidAmount)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>

            {billDetails.payments.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Payment History</p>
                <div className="space-y-2">
                  {billDetails.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between py-2 border-b"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(payment.amount)} via {payment.method}
                        </p>
                        <p className="text-xs text-gray-500">
                          {payment.paidAt
                            ? formatDate(payment.paidAt, 'MMM dd, yyyy hh:mm a')
                            : 'Pending'}
                        </p>
                      </div>
                      <StatusBadge status={payment.status} size="sm" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(billDetails.status) && (
              <div className="flex justify-end">
                <Button onClick={() => openPayment(billDetails)}>
                  Pay {formatCurrency(billDetails.totalAmount - billDetails.paidAmount)}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={paymentOpen}
        onClose={() => {
          setPaymentOpen(false);
          setSelectedBillId(null);
          setTransactionId('');
        }}
        title="Make Payment"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Amount to Pay</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(paymentAmount)}
            </p>
          </div>

          <Select
            label="Payment Method"
            options={paymentMethodOptions}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          />

          {['UPI', 'BANK_TRANSFER'].includes(paymentMethod) && (
            <Input
              label="Transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction reference"
            />
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setPaymentOpen(false);
                setSelectedBillId(null);
                setTransactionId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              isLoading={paymentMutation.isPending}
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
