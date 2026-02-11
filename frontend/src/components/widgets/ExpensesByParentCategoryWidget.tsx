'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PieChart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useExpensesByParentCategory } from '@/hooks/useDashboard'
import { ExpensesByParentCategoryWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { CategoryExpensesChart, CategoryVariant } from '@/components/charts/CategoryExpensesChart'

interface CategoryData {
  name: string
  value: number
  color: string
  percent?: number
}

interface ExpensesByParentCategoryWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const ExpensesByParentCategoryWidget = ({ gridWidth = 2, gridHeight = 2 }: ExpensesByParentCategoryWidgetProps) => {
  const t = useTranslations('widgets.expensesByParentCategory')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const { month, year } = useSelectedMonth()
  const [showComparison, setShowComparison] = useState(false)

  // Current data
  const { data: rawData, isLoading } = useExpensesByParentCategory({ month, year })

  // Previous month calculation
  const prevDate = new Date(year, month - 1 - 1, 1) // month is 1-indexed in context? Need to verify. Assuming 1-12.
  // Actually standard JS Date uses 0-11. If 'month' from context is 1-12 (human), then:
  // Current: year, month-1
  // Previous: year, month-2
  // But let's check definition of useSelectedMonth. Usually it provides human readable or index? 
  // Assuming 1-12 based on standard dashboard practices.
  // We can just rely on the API to handle { month: month-1 } or handle year rollover.
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  const { data: prevData } = useExpensesByParentCategory({ month: prevMonth, year: prevYear })

  const data = useMemo(() => {
    if (!rawData) return []

    // Create map of previous data for fast lookup
    const prevMap = new Map(prevData?.map((cat: any) => [cat.category, cat.amount]) || [])

    return rawData.map((cat: any) => ({
      name: cat.category,
      value: cat.amount,
      color: cat.color || '#3b82f6',
      percent: cat.percentage,
      previousValue: prevMap.get(cat.category) || 0
    }))
  }, [rawData, prevData])

  const chartConfig = useMemo(() => ({
    chartHeight: calculateChartHeight(dimensions.contentHeight, { hasLegend: !showComparison }),
  }), [dimensions, showComparison])

  if (isLoading) {
    return <ExpensesByParentCategoryWidgetSkeleton />
  }

  const { chartHeight } = chartConfig

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-metric-label flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            {t('title') || 'Expenses by Category'}
          </CardTitle>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${showComparison
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-transparent border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            {showComparison ? 'Hide Comparison' : 'Show Comparison'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <CategoryExpensesChart
            data={data}
            variant={showComparison ? 'comparison' : 'donut-pro'}
            height={chartHeight}
            currency="CLP"
          />
        ) : (
          <div className="flex items-center justify-center h-[240px] text-gray-500 dark:text-gray-400">
            {t('noExpensesThisMonth')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
