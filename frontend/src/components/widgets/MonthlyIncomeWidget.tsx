'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { transactionAPI } from '@/lib/api'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'

interface MonthlyIncomeWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const MonthlyIncomeWidget = ({ gridWidth = 1, gridHeight = 1 }: MonthlyIncomeWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const [income, setIncome] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        setLoading(true)
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()
        const res = await transactionAPI.getStats(month, year)
        setIncome(res.data.data.totalIncome)
      } catch (error) {
        console.error('Error fetching income:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIncome()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            Monthly Income
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          Monthly Income
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold text-green-600`}>
          {formatCurrency(income, 'CLP')}
        </div>
        <p className={`${fontSizes.label} text-gray-500 mt-1`}>This month</p>
      </CardContent>
    </Card>
  )
}
