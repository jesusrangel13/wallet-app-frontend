'use client'

import { ClairCard } from '@/components/ui/ClairCard'
import { PieChart as PieChartIcon } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useExpensesByCategory } from '@/hooks/useDashboard'
import { ExpenseDetailsPieWidgetSkeleton } from '@/components/ui/WidgetSkeletons';

interface CategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ExpenseDetailsPieWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const ExpenseDetailsPieWidget = ({ gridWidth = 2, gridHeight = 2 }: ExpenseDetailsPieWidgetProps) => {
  const t = useTranslations('widgets.expenseDetailsPie')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const { month, year } = useSelectedMonth()
  const { data: rawData, isLoading } = useExpensesByCategory({ month, year })

  // Use colors from backend, fallback to default if not provided
  const defaultColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280', '#ef4444', '#14b8a6']
  const data = rawData ? rawData.map((cat: any, idx: number) => ({
    ...cat,
    color: cat.color || defaultColors[idx % defaultColors.length]
  })) : []

  if (isLoading) {
    return <ExpenseDetailsPieWidgetSkeleton />
  }

  // Custom legend component
  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <ul className="space-y-1 text-sm">
        {payload.map((entry: any, index: number) => (
          <li key={`legend-${index}`} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="truncate flex-1 text-foreground">{entry.value}</span>
            <span className="text-muted-foreground text-xs">
              {entry.payload.percentage.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    )
  }

  // Calculate responsive sizes
  const chartHeight = calculateChartHeight(dimensions.contentHeight)
  const outerRadius = dimensions.isSmall ? 60 : dimensions.isLarge ? 120 : 100
  const piePosition = dimensions.isSmall ? "50%" : "35%"
  const showLegend = dimensions.width >= 500

  return (
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
            <PieChartIcon className="h-4 w-4" />
            {t('label')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('thisMonth')}</p>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col min-h-0">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                cx={piePosition}
                cy="50%"
                labelLine={false}
                outerRadius={outerRadius}
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
              >
                {data.map((entry: CategoryData, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  const percentage = props.payload.percentage
                  return [
                    `${formatCurrency(value, 'CLP')} (${percentage.toFixed(0)}%)`,
                    props.payload.category
                  ]
                }}
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg, #fff)',
                  border: '1px solid var(--tooltip-border, #e5e7eb)',
                  borderRadius: '6px',
                  color: 'var(--tooltip-text, #111827)',
                }}
                itemStyle={{ color: 'var(--tooltip-text, #111827)' }}
                labelStyle={{ color: 'var(--tooltip-text, #111827)', fontWeight: 600 }}
              />
              {showLegend && (
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  content={renderLegend}
                  wrapperStyle={{
                    paddingLeft: '20px',
                    maxHeight: chartHeight - 30,
                    overflowY: 'auto',
                  }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center text-slate-500 dark:text-slate-400" style={{ height: chartHeight }}>
            {t('noExpensesThisMonth')}
          </div>
        )}
      </div>
    </ClairCard>
  )
}
