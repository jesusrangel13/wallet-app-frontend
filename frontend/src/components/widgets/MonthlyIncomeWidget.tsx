'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { useTransactionStats } from '@/hooks/useTransactions'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { MonthlyIncomeWidgetSkeleton } from '@/components/ui/WidgetSkeletons';

interface MonthlyIncomeWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const MonthlyIncomeWidget = ({ gridWidth = 1, gridHeight = 1 }: MonthlyIncomeWidgetProps) => {
  const t = useTranslations('widgets.monthlyIncome')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const { month, year } = useSelectedMonth()

  // Use React Query hook for automatic caching and revalidation
  const { data: statsResponse, isLoading } = useTransactionStats(month + 1, year)
  const income = statsResponse?.data?.data?.totalIncome || 0

  if (isLoading) {
    return <MonthlyIncomeWidgetSkeleton />
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold text-green-600`}>
          {formatCurrency(income, 'CLP')}
        </div>
        <p className={`${fontSizes.label} text-gray-500 mt-1`}>{t('thisMonth')}</p>
      </CardContent>
    </Card>
  )
}
