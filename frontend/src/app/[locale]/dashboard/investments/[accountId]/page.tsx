'use client'

/**
 * Investment Account Detail Page
 *
 * Shows portfolio holdings, transactions, and metrics for a specific investment account
 */

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Plus, Trash2, Calendar, Upload } from 'lucide-react'
import { useAccount } from '@/hooks/useAccounts'
import {
  useInvestmentHoldings,
  useClosedPositions,
  usePortfolioSummary,
  useInvestmentTransactions,
  useDeleteInvestmentTransaction,
} from '@/hooks/useInvestments'
import { HoldingsTable } from '@/components/investments/HoldingsTable'
import { ClosedPositionsTable } from '@/components/investments/ClosedPositionsTable'
import { PortfolioSummaryCard } from '@/components/investments/PortfolioSummaryCard'
import { InvestmentTransactionModal } from '@/components/investments/InvestmentTransactionModal'
import { AssetAllocationChart } from '@/components/investments/AssetAllocationChart'
import { PortfolioPerformanceChart } from '@/components/investments/PortfolioPerformanceChart'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import Link from 'next/link'
import { toast } from 'sonner'
import { parseLocalDate } from '@/lib/utils'
import { format } from 'date-fns'

export default function InvestmentAccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.accountId as string

  const t = useTranslations('investments')
  const tCommon = useTranslations('common')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  )
  const [activeTab, setActiveTab] = useState<'portfolio' | 'performance' | 'transactions'>('portfolio')

  // Queries
  const { data: account, isLoading: accountLoading } = useAccount(accountId)
  const { data: holdings, isLoading: holdingsLoading } =
    useInvestmentHoldings(accountId)
  const { data: closedPositions, isLoading: closedLoading } =
    useClosedPositions(accountId)
  const { data: summary, isLoading: summaryLoading } =
    usePortfolioSummary(accountId)
  const { data: transactionsData, isLoading: transactionsLoading } =
    useInvestmentTransactions({ accountId })

  // Mutations
  const deleteTransaction = useDeleteInvestmentTransaction()

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return

    try {
      await deleteTransaction.mutateAsync(transactionToDelete)
      toast.success(t('transactionDeleted'))
      setDeleteDialogOpen(false)
      setTransactionToDelete(null)
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t('transactionDeleteFailed')
      )
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  if (accountLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  const accountData = account?.data?.data

  if (!accountData || accountData.type !== 'INVESTMENT') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold mb-2">{t('accountNotFound')}</h2>
        <p className="text-gray-500 mb-6">
          {t('accountNotFoundDescription')}
        </p>
        <Link href="/dashboard/investments">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToInvestments')}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/investments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {accountData.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {t('cashBalance')}:{' '}
              {formatCurrency(Number(accountData.balance), accountData.currency)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/investments/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              {t('importTransactions')}
            </Button>
          </Link>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('newTransaction')}
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {summaryLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
        </div>
      ) : summary ? (
        <PortfolioSummaryCard summary={summary} />
      ) : null}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'portfolio'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {t('portfolio')}
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'performance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {t('performance')}
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {t('transactions')}
          </button>
        </nav>
      </div>

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          {/* Active Holdings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('holdings')}</CardTitle>
              <p className="text-sm text-gray-500">{t('holdingsDescription')}</p>
            </CardHeader>
            <CardContent>
              {holdingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
              ) : holdings && holdings.length > 0 ? (
                <HoldingsTable holdings={holdings} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {t('noHoldings')}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Closed Positions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('closedPositions')}</CardTitle>
              <p className="text-sm text-gray-500">{t('closedPositionsDescription')}</p>
            </CardHeader>
            <CardContent>
              {closedLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
              ) : closedPositions && closedPositions.length > 0 ? (
                <ClosedPositionsTable holdings={closedPositions} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {t('noClosedPositions')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('performanceChart')}</CardTitle>
              <p className="text-sm text-gray-500">
                Track your portfolio value over time
              </p>
            </CardHeader>
            <CardContent>
              <PortfolioPerformanceChart
                accountId={accountId}
                currency={accountData.currency}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('allocationChart')}</CardTitle>
              <p className="text-sm text-gray-500">
                Distribution of assets by type
              </p>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                </div>
              ) : summary ? (
                <AssetAllocationChart summary={summary} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No allocation data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('transactionHistory')}</CardTitle>
            <p className="text-sm text-gray-500">
              {t('transactionHistoryDescription')}
            </p>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              </div>
            ) : transactionsData?.data && transactionsData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('date')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('asset')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('type')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">{t('quantity')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">{t('price')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">{t('total')}</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactionsData.data.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {format(
                              parseLocalDate(transaction.transactionDate),
                              'MMM dd, yyyy'
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{transaction.assetSymbol}</p>
                            <span className="inline-block mt-1 px-2 py-1 text-xs rounded border border-gray-300 text-gray-700">
                              {t(transaction.assetType.toLowerCase())}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 text-xs rounded ${
                              transaction.type === 'BUY'
                                ? 'bg-blue-100 text-blue-800'
                                : transaction.type === 'SELL'
                                ? 'bg-gray-100 text-gray-800'
                                : transaction.type === 'DIVIDEND'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {t(transaction.type.toLowerCase())}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {transaction.type === 'DIVIDEND' || transaction.type === 'INTEREST'
                            ? '-'
                            : transaction.quantity.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 8,
                              })}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">
                          {transaction.type === 'DIVIDEND' || transaction.type === 'INTEREST'
                            ? '-'
                            : formatCurrency(
                                Number(transaction.pricePerUnit),
                                transaction.currency
                              )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(
                            Number(transaction.totalAmount),
                            transaction.currency
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setTransactionToDelete(transaction.id)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {t('noTransactions')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction Modal */}
      <InvestmentTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultAccountId={accountId}
      />

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title={t('deleteTransaction')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {t('deleteTransactionConfirm')}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleDeleteTransaction}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {tCommon('delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
