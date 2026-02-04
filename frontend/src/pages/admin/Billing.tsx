import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { adminBillingService } from '@/services/adminService';
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
import type { Bill } from '@/types';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const AdminBilling: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [billingMonth, setBillingMonth] = useState(
    format(subMonths(new Date(), 1), 'yyyy-MM')
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminBills', page, statusFilter, search],
    queryFn: () =>
      adminBillingService.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
  });

  const generateBillsMutation = useMutation({
    mutationFn: (month: string) => adminBillingService.generateBills(month),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminBills'] });
      setGenerateOpen(false);
      toast.success(`Generated ${data.count} bills`);
    },
    onError: () => {
      toast.error('Failed to generate bills');
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({
      billId,
      amount,
      method,
      reference,
    }: {
      billId: string;
      amount: number;
      method: string;
      reference?: string;
    }) => adminBillingService.recordPayment(billId, amount, method, reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBills'] });
      setRecordPaymentOpen(false);
      setSelectedBill(null);
      setPaymentAmount(0);
      setPaymentMethod('CASH');
      setPaymentReference('');
      toast.success('Payment recorded successfully');
    },
    onError: () => {
      toast.error('Failed to record payment');
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const bills = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const openDetails = async (bill: Bill) => {
    try {
      const details = await adminBillingService.getById(bill.id);
      setSelectedBill(details);
      setDetailsOpen(true);
    } catch (err) {
      toast.error('Failed to load bill details');
    }
  };

  const openRecordPayment = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentAmount(bill.totalAmount - bill.paidAmount);
    setRecordPaymentOpen(true);
  };

  // Calculate summary stats
  const stats = bills.reduce(
    (acc, bill) => {
      acc.total += bill.totalAmount;
      acc.paid += bill.paidAmount;
      if (bill.status === 'PENDING') acc.pending += bill.totalAmount - bill.paidAmount;
      if (bill.status === 'OVERDUE') acc.overdue += bill.totalAmount - bill.paidAmount;
      return acc;
    },
    { total: 0, paid: 0, pending: 0, overdue: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600">Manage bills and payments</p>
        </div>
        <Button
          onClick={() => setGenerateOpen(true)}
          leftIcon={<DocumentTextIcon className="h-5 w-5" />}
        >
          Generate Bills
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.total)}
          </p>
          <p className="text-sm text-gray-500">Total Billed</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.paid)}
          </p>
          <p className="text-sm text-gray-500">Collected</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(stats.pending)}
          </p>
          <p className="text-sm text-gray-500">Pending</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.overdue)}
          </p>
          <p className="text-sm text-gray-500">Overdue</p>
        </Card>
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
              { value: 'PARTIAL', label: 'Partially Paid' },
              { value: 'PAID', label: 'Paid' },
              { value: 'OVERDUE', label: 'Overdue' },
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

      {/* Bills Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Period
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Balance
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {bill.customer?.user?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {bill.customer?.user?.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(bill.periodStart)} - {formatDate(bill.periodEnd)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {formatCurrency(bill.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                    {formatCurrency(bill.paidAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                    {formatCurrency(bill.totalAmount - bill.paidAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <StatusBadge status={bill.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(bill.dueDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetails(bill)}
                      >
                        View
                      </Button>
                      {bill.status !== 'PAID' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openRecordPayment(bill)}
                          leftIcon={<CreditCardIcon className="h-4 w-4" />}
                        >
                          Pay
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bills.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No bills found for the selected criteria
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

      {/* Bill Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedBill(null);
        }}
        title="Bill Details"
        size="lg"
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">
                  {selectedBill.customer?.user?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={selectedBill.status} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Billing Period</p>
                <p className="font-medium">
                  {formatDate(selectedBill.periodStart)} -{' '}
                  {formatDate(selectedBill.periodEnd)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Due Date</p>
                <p className="font-medium">{formatDate(selectedBill.dueDate)}</p>
              </div>
            </div>

            {selectedBill.items && selectedBill.items.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Items</p>
                <div className="space-y-2">
                  {selectedBill.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Total Amount</span>
                <span className="font-bold">
                  {formatCurrency(selectedBill.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Paid Amount</span>
                <span className="font-medium">
                  -{formatCurrency(selectedBill.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Balance Due</span>
                <span className="text-red-600">
                  {formatCurrency(selectedBill.totalAmount - selectedBill.paidAmount)}
                </span>
              </div>
            </div>

            {selectedBill.payments && selectedBill.payments.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Payment History</p>
                <div className="space-y-2">
                  {selectedBill.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm text-gray-600">
                          {formatDate(payment.createdAt)} via {payment.method}
                        </p>
                        {payment.transactionId && (
                          <p className="text-xs text-gray-500">
                            Ref: {payment.transactionId}
                          </p>
                        )}
                      </div>
                      <p className="font-medium text-green-600">
                        +{formatCurrency(payment.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBill.status !== 'PAID' && (
              <div className="flex justify-end pt-4">
                <Button onClick={() => openRecordPayment(selectedBill)}>
                  Record Payment
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={recordPaymentOpen}
        onClose={() => {
          setRecordPaymentOpen(false);
          setSelectedBill(null);
          setPaymentAmount(0);
          setPaymentMethod('CASH');
          setPaymentReference('');
        }}
        title="Record Payment"
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Total Bill</span>
                <span className="font-medium">
                  {formatCurrency(selectedBill.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Already Paid</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(selectedBill.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Balance Due</span>
                <span className="font-bold text-red-600">
                  {formatCurrency(
                    selectedBill.totalAmount - selectedBill.paidAmount
                  )}
                </span>
              </div>
            </div>

            <Input
              label="Payment Amount"
              type="number"
              step="0.01"
              min={0}
              max={selectedBill.totalAmount - selectedBill.paidAmount}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              leftIcon={<CurrencyDollarIcon className="h-5 w-5" />}
            />

            <Select
              label="Payment Method"
              options={[
                { value: 'CASH', label: 'Cash' },
                { value: 'UPI', label: 'UPI' },
                { value: 'CARD', label: 'Card' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                { value: 'WALLET', label: 'Wallet' },
              ]}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />

            <Input
              label="Reference / Transaction ID (Optional)"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g., UPI transaction ID"
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setRecordPaymentOpen(false);
                  setSelectedBill(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  recordPaymentMutation.mutate({
                    billId: selectedBill.id,
                    amount: paymentAmount,
                    method: paymentMethod,
                    reference: paymentReference || undefined,
                  })
                }
                isLoading={recordPaymentMutation.isPending}
                disabled={paymentAmount <= 0}
              >
                Record Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Generate Bills Modal */}
      <Modal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generate Bills"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Generate bills for all customers for a specific month. This will
            calculate charges based on their subscriptions and delivered items.
          </p>
          <Input
            label="Billing Month"
            type="month"
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setGenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => generateBillsMutation.mutate(billingMonth)}
              isLoading={generateBillsMutation.isPending}
            >
              Generate Bills
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
