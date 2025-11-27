'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { transactionAPI } from '@/lib/api'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'

interface MonthlyExpensesWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const MonthlyExpensesWidget = ({ gridWidth = 1, gridHeight = 1 }: MonthlyExpensesWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
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
        <CardTitle className={`${dimensions.isWide ? 'text-base' : 'text-sm'} font-medium text-gray-600 flex items-center gap-2`}>
          <TrendingDown className={`${dimensions.isWide ? 'h-5 w-5' : 'h-4 w-4'} text-red-600`} />
          Monthly Expenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold text-red-600`}>
          {formatCurrency(expense, 'CLP')}
        </div>
        <p className={`${fontSizes.label} text-gray-500 mt-1`}>This month</p>
      </CardContent>
    </Card>
  )
}
