'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { useTransactionStats } from '@/hooks/useTransactions'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'

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
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            {t('label')}
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
          <TrendingDown className="h-4 w-4 text-red-600" />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold text-red-600`}>
          {formatCurrency(expense, 'CLP')}
        </div>
        <p className={`${fontSizes.label} text-gray-500 mt-1`}>{t('thisMonth')}</p>
      </CardContent>
    </Card>
  )
}
