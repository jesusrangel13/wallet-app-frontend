'use client'

import { useMemo, useCallback } from 'react'
import { ClairCard } from '@/components/ui/ClairCard'
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

// Default colors for tags without a color assigned (Clair Palette)
const DEFAULT_COLORS = [
  '#8B5CF6', // Clair Violet (Primary)
  '#06B6D4', // Flux Cyan (Secondary)
  '#34D399', // Mint Spark (Success)
  '#F472B6', // Soft Rose (Expense)
  '#FBBF24', // Warm Amber (Warning)
  '#A78BFA', // Lighter Violet
  '#22D3EE', // Lighter Cyan
  '#6EE7B7', // Lighter Mint
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
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <TagIcon className="h-4 w-4" />
          Expenses by Tag
        </h3>
      </div>
      <div className="p-6">
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
                fill="hsl(var(--primary))"
                dataKey="totalAmount"
                nameKey="tagName"
                style={{ fontSize: labelFontSize }}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={2}
              >
                {data.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={tooltipFormatter}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  borderRadius: '12px',
                  color: '#1e293b',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                itemStyle={{ color: '#334155' }}
                labelStyle={{ color: '#0f172a', fontWeight: 600 }}
              />
              <Legend
                wrapperStyle={{ fontSize: dimensions.isSmall ? '10px' : '12px', paddingTop: '10px', color: '#64748b' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={`flex flex-col items-center justify-center text-slate-500 dark:text-slate-400`} style={{ height: chartHeight }}>
            <TagIcon className="h-12 w-12 mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm">{t('noTaggedExpenses')}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('addTagsHint')}</p>
          </div>
        )}
      </div>
    </ClairCard>
  )
}
