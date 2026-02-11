'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-metric-label flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
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
            <p className="text-muted-foreground text-center py-8">
              {t('noRecentTransactions')}
            </p>
          )}
        </div>
        {transactions.length > 0 && (
          <Link href="/dashboard/transactions" prefetch={true} className="block mt-4 w-full text-center py-2 px-4 text-sm text-primary hover:text-primary-hover hover:bg-primary/10 rounded-lg font-medium transition-colors">
            {t('viewMoreTransactions')} →
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
