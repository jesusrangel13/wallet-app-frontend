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
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.slice(0, maxItems).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                    style={{ backgroundColor: transaction.category?.color || '#6b7280' }}
                  >
                    {transaction.category?.icon || '📊'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">
                        {transaction.description || transaction.category?.name || 'Transaction'}
                      </p>
                      {transaction.sharedExpenseId && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                          👥
                        </span>
                      )}
                    </div>
                    {transaction.payee && (
                      <p className="text-xs text-muted-foreground">→ {transaction.payee}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{transaction.account?.name || 'Account'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${transaction.type === 'EXPENSE'
                      ? 'text-red-600 dark:text-red-500'
                      : transaction.type === 'INCOME'
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-blue-600 dark:text-blue-500'
                      }`}
                  >
                    {transaction.type === 'EXPENSE'
                      ? '-'
                      : transaction.type === 'INCOME'
                        ? '+'
                        : ''}
                    <AnimatedCurrency
                      amount={transaction.amount}
                      currency={(transaction.account?.currency as Currency) || 'CLP'}
                    />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
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
