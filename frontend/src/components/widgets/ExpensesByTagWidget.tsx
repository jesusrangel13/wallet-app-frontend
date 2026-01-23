'use client'

import { useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tag as TagIcon } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useExpensesByTag } from '@/hooks/useDashboard'
import { ExpensesByTagWidgetSkeleton } from '@/components/ui/WidgetSkeletons'

interface TagData {
  tagName: string
  totalAmount: number
  percentage: number
  tagColor: string | null
  transactionCount: number
}

interface ExpensesByTagWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

// Default colors for tags without a color assigned
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#6b7280', // gray
  '#ef4444', // red
  '#14b8a6', // teal
]

export const ExpensesByTagWidget = ({ gridWidth = 2, gridHeight = 2 }: ExpensesByTagWidgetProps) => {
  const t = useTranslations('widgets.expensesByTag')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const { month, year } = useSelectedMonth()
  const { data: rawData, isLoading } = useExpensesByTag({ month, year })

  const data = rawData ? rawData.map((tag: TagData, idx: number) => ({
    ...tag,
    // Use tag's color if available, otherwise use default colors
    color: tag.tagColor || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]
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
    return <ExpensesByTagWidgetSkeleton />
  }

  const { chartHeight, outerRadius, labelFontSize } = chartConfig

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <TagIcon className="h-4 w-4" />
          Expenses by Tag
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
                label={dimensions.isSmall ? false : ({ percentage }) => `${percentage.toFixed(0)}%`}
                outerRadius={outerRadius}
                fill="#8884d8"
                dataKey="totalAmount"
                nameKey="tagName"
                style={{ fontSize: labelFontSize }}
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '6px',
                  color: 'var(--tooltip-text, #111827)',
                }}
                itemStyle={{ color: 'var(--tooltip-text, #111827)' }}
                labelStyle={{ color: 'var(--tooltip-text, #111827)', fontWeight: 600 }}
              />
              <Legend
                wrapperStyle={{ fontSize: dimensions.isSmall ? '10px' : '12px', paddingTop: '10px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={`flex flex-col items-center justify-center text-gray-500 dark:text-gray-400`} style={{ height: chartHeight }}>
            <TagIcon className="h-12 w-12 mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">{t('noTaggedExpenses')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('addTagsHint')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
