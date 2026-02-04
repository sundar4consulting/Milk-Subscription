import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, PlayIcon, PauseIcon, XMarkIcon } from '@heroicons/react/24/outline';
import {
  useSubscriptions,
  usePauseSubscription,
  useResumeSubscription,
  useCancelSubscription,
} from '@/hooks';
import {
  Card,
  CardHeader,
  Button,
  StatusBadge,
  Modal,
  Input,
  PageLoader,
  ErrorState,
  EmptyState,
  Pagination,
} from '@/components/ui';
import { formatDate, getFrequencyLabel, formatCurrency } from '@/utils';
import type { Subscription } from '@/types';
import toast from 'react-hot-toast';

export const SubscriptionsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useSubscriptions(page);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [resumeDate, setResumeDate] = useState('');

  const pauseMutation = usePauseSubscription();
  const resumeMutation = useResumeSubscription();
  const cancelMutation = useCancelSubscription();

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={refetch} />;

  const subscriptions = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const handlePause = async () => {
    if (!selectedSubscription) return;
    try {
      await pauseMutation.mutateAsync({
        id: selectedSubscription.id,
        resumeDate: resumeDate || undefined,
      });
      toast.success('Subscription paused successfully');
      setPauseModalOpen(false);
      setSelectedSubscription(null);
      setResumeDate('');
    } catch (err) {
      toast.error('Failed to pause subscription');
    }
  };

  const handleResume = async (subscription: Subscription) => {
    try {
      await resumeMutation.mutateAsync(subscription.id);
      toast.success('Subscription resumed successfully');
    } catch (err) {
      toast.error('Failed to resume subscription');
    }
  };

  const handleCancel = async () => {
    if (!selectedSubscription) return;
    try {
      await cancelMutation.mutateAsync(selectedSubscription.id);
      toast.success('Subscription cancelled successfully');
      setCancelModalOpen(false);
      setSelectedSubscription(null);
    } catch (err) {
      toast.error('Failed to cancel subscription');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600">Manage your milk subscriptions</p>
        </div>
        <Link to="/customer/subscriptions/new">
          <Button leftIcon={<PlusIcon className="h-5 w-5" />}>
            New Subscription
          </Button>
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          title="No subscriptions yet"
          description="Start a milk subscription to get fresh milk delivered regularly"
          action={{
            label: 'Create Subscription',
            onClick: () => {},
          }}
        />
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🥛</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {subscription.product.name}
                      </h3>
                      <StatusBadge status={subscription.status} />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {subscription.quantity} {subscription.product.unit} •{' '}
                      {getFrequencyLabel(
                        subscription.frequency,
                        subscription.customDays || undefined
                      )}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Started {formatDate(subscription.startDate)} •{' '}
                      {subscription.address.label}
                    </p>
                    {subscription.product.currentPrice && (
                      <p className="text-sm font-medium text-primary-600 mt-1">
                        {formatCurrency(
                          subscription.product.currentPrice.price *
                            subscription.quantity
                        )}{' '}
                        per delivery
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:flex-shrink-0">
                  {subscription.status === 'ACTIVE' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSubscription(subscription);
                          setPauseModalOpen(true);
                        }}
                        leftIcon={<PauseIcon className="h-4 w-4" />}
                      >
                        Pause
                      </Button>
                      <Link to={`/customer/subscriptions/${subscription.id}`}>
                        <Button variant="ghost" size="sm">
                          Manage
                        </Button>
                      </Link>
                    </>
                  )}
                  {subscription.status === 'PAUSED' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResume(subscription)}
                        isLoading={resumeMutation.isPending}
                        leftIcon={<PlayIcon className="h-4 w-4" />}
                      >
                        Resume
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedSubscription(subscription);
                          setCancelModalOpen(true);
                        }}
                        leftIcon={<XMarkIcon className="h-4 w-4" />}
                      >
                        Cancel
                      </Button>
                    </>
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

      {/* Pause Modal */}
      <Modal
        isOpen={pauseModalOpen}
        onClose={() => {
          setPauseModalOpen(false);
          setSelectedSubscription(null);
          setResumeDate('');
        }}
        title="Pause Subscription"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to pause your subscription for{' '}
            <strong>{selectedSubscription?.product.name}</strong>?
          </p>
          <Input
            label="Resume Date (optional)"
            type="date"
            value={resumeDate}
            onChange={(e) => setResumeDate(e.target.value)}
            helperText="Leave empty to resume manually"
            min={new Date().toISOString().split('T')[0]}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setPauseModalOpen(false);
                setSelectedSubscription(null);
                setResumeDate('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePause}
              isLoading={pauseMutation.isPending}
            >
              Pause Subscription
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedSubscription(null);
        }}
        title="Cancel Subscription"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel your subscription for{' '}
            <strong>{selectedSubscription?.product.name}</strong>? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setCancelModalOpen(false);
                setSelectedSubscription(null);
              }}
            >
              Keep Subscription
            </Button>
            <Button
              variant="danger"
              onClick={handleCancel}
              isLoading={cancelMutation.isPending}
            >
              Cancel Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
