'use client'

import { useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PieChart as PieChartIcon } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'

interface CategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ExpensesByCategoryWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const ExpensesByCategoryWidget = ({ gridWidth = 2, gridHeight = 2 }: ExpensesByCategoryWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const { month, year } = useSelectedMonth()
  const [data, setData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getExpensesByCategory({ month, year })
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280', '#ef4444', '#14b8a6']
        const withColors = res.data.data.map((cat: any, idx: number) => ({
          ...cat,
          color: colors[idx % colors.length]
        }))
        setData(withColors)
      } catch (error) {
        console.error('Error fetching expenses by category:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [month, year])

  // Memoize chart configuration
  const chartConfig = useMemo(() => {
    const chartHeight = calculateChartHeight(dimensions.contentHeight)
    const outerRadius = dimensions.isSmall ? 70 : dimensions.isLarge ? 100 : 80
    const labelFontSize = dimensions.isSmall ? 10 : 12

    return { chartHeight, outerRadius, labelFontSize }
  }, [dimensions])

  // Memoize Tooltip formatter to prevent recreation on every render
  const tooltipFormatter = useCallback(
    (value: number) => formatCurrency(Number(value), 'CLP'),
    []
  )

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Expenses by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  const { chartHeight, outerRadius, labelFontSize } = chartConfig

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          Expenses by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={dimensions.isSmall ? false : ({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`}
                outerRadius={outerRadius}
                fill="#8884d8"
                dataKey="amount"
                style={{ fontSize: labelFontSize }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={`flex items-center justify-center text-gray-500`} style={{ height: chartHeight }}>
            No expenses this month
          </div>
        )}
      </CardContent>
    </Card>
  )
}
