import React, { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useWallet, useWalletTransactions } from '@/hooks';
import {
  Card,
  CardHeader,
  PageLoader,
  ErrorState,
  EmptyState,
  Pagination,
} from '@/components/ui';
import { formatDate, formatCurrency, cn } from '@/utils';

export const WalletPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data: wallet, isLoading: walletLoading, error: walletError, refetch } = useWallet();
  const { data: transactionsData, isLoading: txLoading } = useWalletTransactions(page, 20);

  const isLoading = walletLoading || txLoading;

  if (isLoading) return <PageLoader />;
  if (walletError) return <ErrorState onRetry={refetch} />;

  const transactions = transactionsData?.data || [];
  const totalPages = transactionsData?.pagination?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600">Manage your wallet balance</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-primary-100">Available Balance</p>
            <p className="text-4xl font-bold mt-1">
              {formatCurrency(wallet?.balance || 0)}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 text-sm text-primary-100">
            Last updated: {wallet?.updatedAt ? formatDate(wallet.updatedAt) : 'N/A'}
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader title="Transaction History" />
        
        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions"
            description="Your wallet transaction history will appear here"
          />
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      tx.type === 'CREDIT'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    )}
                  >
                    {tx.type === 'CREDIT' ? (
                      <ArrowDownIcon className="h-5 w-5" />
                    ) : (
                      <ArrowUpIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(tx.createdAt, 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                  {tx.referenceId && (
                    <p className="text-xs text-gray-400">{tx.referenceId}</p>
                  )}
                </div>
              </div>
            ))}

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              className="mt-4"
            />
          </div>
        )}
      </Card>
    </div>
  );
};
