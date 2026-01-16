'use client'

import { useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PieChart as PieChartIcon } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useExpensesByCategory } from '@/hooks/useDashboard'
import { ExpensesByCategoryWidgetSkeleton } from '@/components/ui/WidgetSkeletons'

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
  const t = useTranslations('widgets.expensesByCategory')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const { month, year } = useSelectedMonth()
  const { data: rawData, isLoading } = useExpensesByCategory({ month, year })

  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280', '#ef4444', '#14b8a6']
  const data = rawData ? rawData.map((cat: any, idx: number) => ({
    ...cat,
    color: colors[idx % colors.length]
  })) : []

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

  if (isLoading) {
    return <ExpensesByCategoryWidgetSkeleton />
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
                {data.map((entry: CategoryData, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={`flex items-center justify-center text-gray-500`} style={{ height: chartHeight }}>
            {t('noExpensesThisMonth')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
