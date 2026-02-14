'use client'

import { useMemo } from 'react'
import { ClairCard } from '@/components/ui/ClairCard'
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

  const chartData = useMemo(() => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280', '#ef4444', '#14b8a6']
    if (!rawData) return []
    return rawData.map((cat: any, idx: number) => ({
      name: cat.category,
      value: cat.amount,
      color: colors[idx % colors.length]
    }))
  }, [rawData])

  const chartHeight = useMemo(() => {
    return calculateChartHeight(dimensions.contentHeight)
  }, [dimensions.contentHeight])

  if (isLoading) {
    return <ExpensesByCategoryWidgetSkeleton />
  }

  return (
    <ClairCard className="h-full">
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <PieChartIcon className="h-4 w-4 text-indigo-500" />
          {t('title')}
        </h3>
      </div>
      <div className="p-6 flex-1 flex flex-col min-h-0">
        {chartData.length > 0 ? (
          <div className="w-full relative flex-1">
            <EnhancedPieChart
              data={chartData}
              height={chartHeight}
              currency="CLP"
            />
          </div>
        ) : (
          <div className={`flex items-center justify-center text-slate-500 dark:text-slate-400`} style={{ height: chartHeight }}>
            {t('noExpensesThisMonth')}
          </div>
        )}
      </div>
    </ClairCard>
  )
}
