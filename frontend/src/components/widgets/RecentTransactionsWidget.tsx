'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp } from 'lucide-react'
import { formatCurrency, type Currency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { transactionAPI } from '@/lib/api'
import Link from 'next/link'

interface RecentTransaction {
  id: string
  description?: string
  amount: number
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  date: string
  category?: {
    name: string
    icon?: string
    color?: string
  }
  account?: {
    name: string
    currency: string
  }
}

export const RecentTransactionsWidget = () => {
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await transactionAPI.getRecent(5)
        setTransactions(res.data.data || [])
      } catch (error) {
        console.error('Error fetching recent transactions:', error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Transactions
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
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
                    <p className="font-medium text-gray-900">
                      {transaction.description || transaction.category?.name || 'Transaction'}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.account?.name || 'Account'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === 'EXPENSE'
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
              No recent transactions. Add your first transaction to get started!
            </p>
          )}
        </div>
        {transactions.length > 0 && (
          <Link href="/dashboard/transactions" className="block mt-4">
            <button className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all transactions →
            </button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
