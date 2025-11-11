'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { transactionAPI } from '@/lib/api'

export const MonthlyExpensesWidget = () => {
  const [expense, setExpense] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true)
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()
        const res = await transactionAPI.getStats(month, year)
        setExpense(res.data.data.totalExpense)
      } catch (error) {
        console.error('Error fetching expenses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpense()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            Monthly Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-red-600" />
          Monthly Expenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-600">
          {formatCurrency(expense, 'CLP')}
        </div>
        <p className="text-xs text-gray-500 mt-1">This month</p>
      </CardContent>
    </Card>
  )
}
