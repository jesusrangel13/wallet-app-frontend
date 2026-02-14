'use client'

import { ClairCard } from '@/components/ui/ClairCard'
import { TrendingUp } from 'lucide-react'
import { formatCurrency, type Currency } from '@/types/currency'
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRecentTransactions } from '@/hooks/useTransactions'
import Link from 'next/link'
import { useWidgetDimensions, calculateMaxListItems } from '@/hooks/useWidgetDimensions'
import { RecentTransactionsWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency } from '@/components/ui/animations'
import { TransactionCard } from '@/components/transactions/TransactionCard'

interface RecentTransaction {
  id: string
  description?: string
  amount: number
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  date: string
  payee?: string
  sharedExpenseId?: string
  category?: {
    name: string
    icon?: string | null
    color?: string | null
  } | null
  account?: {
    name: string
    currency: string
  }
  sharedExpense?: {
    id: string
    participants?: Array<{
      isPaid?: boolean
    }>
  }
}

interface RecentTransactionsWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const RecentTransactionsWidget = ({ gridWidth = 2, gridHeight = 2 }: RecentTransactionsWidgetProps) => {
  const t = useTranslations('widgets.recentTransactions')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)

  // Calculate how many items can fit based on widget height
  // Each transaction item is approximately 72px tall
  const maxItems = calculateMaxListItems(dimensions.contentHeight, 72)
  // Fetch more transactions than we might need (up to 10)
  const fetchCount = Math.min(Math.max(maxItems, 3), 10)

  // Use React Query hook for data fetching with automatic caching and revalidation
  const { data: response, isLoading } = useRecentTransactions(fetchCount)

  // Extract transactions from response
  const transactions = useMemo(() => {
    return response?.data?.data || []
  }, [response])

  if (isLoading) {
    return <RecentTransactionsWidgetSkeleton />
  }

  return (
    <ClairCard className="h-full flex flex-col">
      <div className="px-6 py-4 flex-none border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
            <TrendingUp className="h-4 w-4" />
            {t('title') || 'Recent Transactions'}
          </h3>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col min-h-0">
        <div className="space-y-3 flex-1 overflow-y-auto min-h-0 pr-1">
          {transactions.length > 0 ? (
            transactions.slice(0, maxItems).map((transaction) => (
              <div key={transaction.id}>
                <TransactionCard
                  id={transaction.id}
                  type={transaction.type}
                  amount={transaction.amount}
                  currency={(transaction.account?.currency as Currency) || 'CLP'}
                  category={transaction.category?.name || 'Uncategorized'}
                  categoryIcon={transaction.category?.icon || undefined}
                  categoryColor={transaction.category?.color || undefined}
                  description={transaction.description}
                  payee={transaction.payee}
                  date={new Date(transaction.date)}
                  isShared={!!transaction.sharedExpenseId}
                />
              </div>
            ))
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">
              {t('noRecentTransactions')}
            </p>
          )}
        </div>
        {transactions.length > 0 && (
          <div className="flex-none pt-4">
            <Link href="/dashboard/transactions" prefetch={true} className="block w-full text-center py-2 px-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-white/30 rounded-lg font-medium transition-colors">
              {t('viewMoreTransactions')} →
            </Link>
          </div>
        )}
      </div>
    </ClairCard>
  )
}
