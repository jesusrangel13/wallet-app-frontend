'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp } from 'lucide-react'
import { formatCurrency, type Currency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { transactionAPI } from '@/lib/api'
import Link from 'next/link'
import { useWidgetDimensions, calculateMaxListItems } from '@/hooks/useWidgetDimensions'

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
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)

  // Calculate how many items can fit based on widget height
  // Each transaction item is approximately 72px tall
  const maxItems = calculateMaxListItems(dimensions.contentHeight, 72)
  // Fetch more transactions than we might need (up to 10)
  const fetchCount = Math.min(Math.max(maxItems, 3), 10)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await transactionAPI.getRecent(fetchCount)
        setTransactions(res.data.data || [])
      } catch (error) {
        console.error('Error fetching recent transactions:', error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fetchCount])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('label')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
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
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                      <p className="font-medium text-gray-900">
                        {transaction.description || transaction.category?.name || 'Transaction'}
                      </p>
                      {transaction.sharedExpenseId && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded-full border border-purple-200">
                          👥
                        </span>
                      )}
                    </div>
                    {transaction.payee && (
                      <p className="text-xs text-gray-600">→ {transaction.payee}</p>
                    )}
                    <p className="text-xs text-gray-500">{transaction.account?.name || 'Account'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${transaction.type === 'EXPENSE'
                        ? 'text-red-600'
                        : transaction.type === 'INCOME'
                          ? 'text-green-600'
                          : 'text-blue-600'
                      }`}
                  >
                    {transaction.type === 'EXPENSE'
                      ? '-'
                      : transaction.type === 'INCOME'
                        ? '+'
                        : ''}
                    {formatCurrency(
                      transaction.amount,
                      (transaction.account?.currency as Currency) || 'CLP'
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">
              {t('noRecentTransactions')}
            </p>
          )}
        </div>
        {transactions.length > 0 && (
          <Link href="/dashboard/transactions" prefetch={true} className="block mt-4 w-full text-center py-2 px-4 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors">
            {t('viewMoreTransactions')} →
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
