'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PieChart as PieChartIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useExpensesByCategory } from '@/hooks/useDashboard'
import { ExpensesByCategoryWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { EnhancedPieChart } from '@/components/charts/EnhancedPieChart'

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

  const chartData = useMemo(() => {
    if (!rawData) return []
    return rawData.map((cat: any, idx: number) => ({
      name: cat.category,
      value: cat.amount,
      color: colors[idx % colors.length]
    }))
  }, [rawData, colors])

  const chartHeight = useMemo(() => {
    return calculateChartHeight(dimensions.contentHeight)
  }, [dimensions.contentHeight])

  if (isLoading) {
    return <ExpensesByCategoryWidgetSkeleton />
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-metric-label flex items-center gap-2">
          <PieChartIcon className="h-4 w-4" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="w-full relative">
            <EnhancedPieChart
              data={chartData}
              height={chartHeight}
              currency="CLP"
            />
          </div>
        ) : (
          <div className={`flex items-center justify-center text-gray-500 dark:text-gray-400`} style={{ height: chartHeight }}>
            {t('noExpensesThisMonth')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
