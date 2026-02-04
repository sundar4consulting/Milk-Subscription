import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, EyeIcon } from '@heroicons/react/24/outline';
import { adminCustomerService } from '@/services/adminService';
import {
  Card,
  CardHeader,
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
import type { CustomerProfile } from '@/types';
import toast from 'react-hot-toast';

export const AdminCustomers: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditDescription, setCreditDescription] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminCustomers', page, search, statusFilter],
    queryFn: () =>
      adminCustomerService.getAll({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminCustomerService.updateStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] });
      toast.success('Customer status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const addCreditMutation = useMutation({
    mutationFn: ({
      id,
      amount,
      description,
    }: {
      id: string;
      amount: number;
      description: string;
    }) => adminCustomerService.addWalletCredit(id, amount, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] });
      setWalletModalOpen(false);
      setSelectedCustomer(null);
      setCreditAmount(0);
      setCreditDescription('');
      toast.success('Wallet credit added');
    },
    onError: () => {
      toast.error('Failed to add credit');
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const customers = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const openDetails = async (customer: CustomerProfile) => {
    try {
      const details = await adminCustomerService.getById(customer.id);
      setSelectedCustomer(details);
      setDetailsOpen(true);
    } catch (err) {
      toast.error('Failed to load customer details');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-600">Manage customer accounts</p>
      </div>

      {/* Filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {/* Customer List */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Subscriptions
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">
                        {customer.user.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <p className="text-gray-900">{customer.user.email}</p>
                      <p className="text-gray-500">
                        {customer.user.phone || 'No phone'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {(customer as any)._count?.subscriptions || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <StatusBadge
                      status={customer.user.isActive ? 'ACTIVE' : 'CANCELLED'}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetails(customer)}
                        leftIcon={<EyeIcon className="h-4 w-4" />}
                      >
                        View
                      </Button>
                      <Button
                        variant={customer.user.isActive ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: customer.id,
                            isActive: !customer.user.isActive,
                          })
                        }
                      >
                        {customer.user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
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

      {/* Customer Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedCustomer(null);
        }}
        title="Customer Details"
        size="lg"
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{selectedCustomer.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{selectedCustomer.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">
                  {selectedCustomer.user.phone || 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge
                  status={selectedCustomer.user.isActive ? 'ACTIVE' : 'CANCELLED'}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="font-medium">
                  {formatDate(selectedCustomer.createdAt)}
                </p>
              </div>
            </div>

            {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Addresses</p>
                <div className="space-y-2">
                  {selectedCustomer.addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-3 bg-gray-50 rounded-lg text-sm"
                    >
                      <p className="font-medium">{addr.label}</p>
                      <p className="text-gray-600">
                        {addr.addressLine1}, {addr.city}, {addr.state}{' '}
                        {addr.postalCode}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setWalletModalOpen(true);
                }}
              >
                Add Wallet Credit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Wallet Credit Modal */}
      <Modal
        isOpen={walletModalOpen}
        onClose={() => {
          setWalletModalOpen(false);
          setCreditAmount(0);
          setCreditDescription('');
        }}
        title="Add Wallet Credit"
      >
        <div className="space-y-4">
          <Input
            label="Amount"
            type="number"
            min={0}
            step={0.01}
            value={creditAmount}
            onChange={(e) => setCreditAmount(parseFloat(e.target.value) || 0)}
          />
          <Input
            label="Description"
            value={creditDescription}
            onChange={(e) => setCreditDescription(e.target.value)}
            placeholder="e.g., Refund for delivery issue"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setWalletModalOpen(false);
                setCreditAmount(0);
                setCreditDescription('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedCustomer &&
                addCreditMutation.mutate({
                  id: selectedCustomer.id,
                  amount: creditAmount,
                  description: creditDescription,
                })
              }
              isLoading={addCreditMutation.isPending}
              disabled={!creditAmount || !creditDescription}
            >
              Add Credit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
