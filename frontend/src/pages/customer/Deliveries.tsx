import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, ListBulletIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useDeliveries, useDeliveryCalendar, useReportDeliveryIssue } from '@/hooks';
import {
  Card,
  CardHeader,
  Button,
  StatusBadge,
  Modal,
  Textarea,
  PageLoader,
  ErrorState,
  EmptyState,
  Pagination,
} from '@/components/ui';
import { formatDate, cn } from '@/utils';
import type { Delivery } from '@/types';
import toast from 'react-hot-toast';

type ViewMode = 'list' | 'calendar';

export const DeliveriesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [page, setPage] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueText, setIssueText] = useState('');

  const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const {
    data: listData,
    isLoading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useDeliveries({ page, limit: 20 });

  const {
    data: calendarData,
    isLoading: calendarLoading,
  } = useDeliveryCalendar(startDate, endDate);

  const reportIssueMutation = useReportDeliveryIssue();

  const isLoading = viewMode === 'list' ? listLoading : calendarLoading;
  const error = viewMode === 'list' ? listError : null;

  const deliveries = listData?.data || [];
  const totalPages = listData?.pagination?.totalPages || 1;

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days: { date: Date; deliveries: Delivery[] }[] = [];

    // Add padding for days before start of month
    const startDay = start.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push({ date: new Date(0), deliveries: [] });
    }

    // Add days of month
    let current = start;
    while (current <= end) {
      const dateStr = format(current, 'yyyy-MM-dd');
      const dayDeliveries =
        calendarData?.find((d) => d.date === dateStr)?.deliveries || [];
      days.push({ date: new Date(current), deliveries: dayDeliveries });
      current = new Date(current.setDate(current.getDate() + 1));
    }

    return days;
  }, [currentMonth, calendarData]);

  const handleReportIssue = async () => {
    if (!selectedDelivery || !issueText.trim()) return;
    try {
      await reportIssueMutation.mutateAsync({
        id: selectedDelivery.id,
        issue: issueText,
      });
      toast.success('Issue reported successfully');
      setIssueModalOpen(false);
      setSelectedDelivery(null);
      setIssueText('');
    } catch (err) {
      toast.error('Failed to report issue');
    }
  };

  if (error) return <ErrorState onRetry={refetchList} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-gray-600">Track your milk deliveries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            leftIcon={<ListBulletIcon className="h-4 w-4" />}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            leftIcon={<CalendarDaysIcon className="h-4 w-4" />}
          >
            Calendar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : viewMode === 'list' ? (
        // List View
        deliveries.length === 0 ? (
          <EmptyState
            title="No deliveries"
            description="Your deliveries will appear here once you have active subscriptions"
          />
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <Card key={delivery.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0',
                        delivery.type === 'ADHOC'
                          ? 'bg-purple-100'
                          : 'bg-primary-100'
                      )}
                    >
                      <span className="text-xl">🥛</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {delivery.product.name}
                        </h3>
                        <StatusBadge status={delivery.status} />
                        {delivery.type === 'ADHOC' && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                            Adhoc
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(delivery.scheduledDate)} •{' '}
                        {delivery.quantity} {delivery.product.unit}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {delivery.address.label}
                      </p>
                      {delivery.deliveredAt && (
                        <p className="text-sm text-green-600 mt-1">
                          Delivered at {formatDate(delivery.deliveredAt, 'hh:mm a')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    {delivery.status === 'DELIVERED' && !delivery.issueReported && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setIssueModalOpen(true);
                        }}
                      >
                        Report Issue
                      </Button>
                    )}
                    {delivery.issueReported && (
                      <span className="text-sm text-red-600">
                        Issue reported
                      </span>
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
        )
      ) : (
        // Calendar View
        <Card padding="none">
          <div className="p-4 border-b flex items-center justify-between">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h3 className="font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-500 border-b"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const isToday =
                day.date.getTime() > 0 &&
                format(day.date, 'yyyy-MM-dd') ===
                  format(new Date(), 'yyyy-MM-dd');
              const hasDeliveries = day.deliveries.length > 0;

              return (
                <div
                  key={index}
                  className={cn(
                    'min-h-[80px] p-2 border-b border-r',
                    day.date.getTime() === 0 && 'bg-gray-50'
                  )}
                >
                  {day.date.getTime() > 0 && (
                    <>
                      <p
                        className={cn(
                          'text-sm',
                          isToday
                            ? 'bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                            : 'text-gray-900'
                        )}
                      >
                        {format(day.date, 'd')}
                      </p>
                      {hasDeliveries && (
                        <div className="mt-1 space-y-1">
                          {day.deliveries.slice(0, 2).map((del) => (
                            <div
                              key={del.id}
                              className={cn(
                                'text-xs px-1 py-0.5 rounded truncate',
                                del.status === 'DELIVERED'
                                  ? 'bg-green-100 text-green-700'
                                  : del.status === 'FAILED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                              )}
                            >
                              {del.product.name}
                            </div>
                          ))}
                          {day.deliveries.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{day.deliveries.length - 2} more
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Report Issue Modal */}
      <Modal
        isOpen={issueModalOpen}
        onClose={() => {
          setIssueModalOpen(false);
          setSelectedDelivery(null);
          setIssueText('');
        }}
        title="Report Delivery Issue"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Please describe the issue with your delivery:
          </p>
          <Textarea
            value={issueText}
            onChange={(e) => setIssueText(e.target.value)}
            placeholder="e.g., Milk was sour, quantity was less than ordered..."
            rows={4}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIssueModalOpen(false);
                setSelectedDelivery(null);
                setIssueText('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportIssue}
              isLoading={reportIssueMutation.isPending}
              disabled={!issueText.trim()}
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
