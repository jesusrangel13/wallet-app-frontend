'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingDown, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTransactionStats } from '@/hooks/useTransactions'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { MonthlyExpensesWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency } from '@/components/ui/animations'
import { Tooltip } from '@/components/ui/Tooltip'

interface MonthlyExpensesWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const MonthlyExpensesWidget = ({ gridWidth = 1, gridHeight = 1 }: MonthlyExpensesWidgetProps) => {
  const t = useTranslations('widgets.monthlyExpenses')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const { month, year } = useSelectedMonth()

  // Use React Query hook for automatic caching and revalidation
  const { data: statsResponse, isLoading } = useTransactionStats(month + 1, year)
  const expense = statsResponse?.data?.data?.totalExpense || 0

  if (isLoading) {
    return <MonthlyExpensesWidgetSkeleton />
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-metric-label flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-expense" />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-balance-large font-bold text-expense">
          <AnimatedCurrency amount={expense} currency="CLP" />
        </div>
        <div className={`${fontSizes.label} text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1`}>
          {t('thisMonth')}
          <Tooltip content={t('tooltip')} side="bottom">
            <Info className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors cursor-help" />
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  )
}
