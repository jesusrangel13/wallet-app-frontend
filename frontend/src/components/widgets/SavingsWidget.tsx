'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PiggyBank, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useMonthlySavings } from '@/hooks/useDashboard'

interface SavingsWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const SavingsWidget = ({ gridWidth = 1, gridHeight = 1 }: SavingsWidgetProps) => {
  const t = useTranslations('widgets.savings')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const { month, year } = useSelectedMonth()
  const { data, isLoading } = useMonthlySavings({ month, year })

  const savings = data?.savings ?? 0
  const savingsRate = data?.savingsRate ?? 0

  const isPositive = savings >= 0
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
  const bgClass = isPositive ? 'bg-green-50' : 'bg-red-50'
  const borderClass = isPositive ? 'border-green-100' : 'border-red-100'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
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
          <PiggyBank className={`h-4 w-4 ${colorClass}`} />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold ${colorClass}`}>
          {formatCurrency(savings, 'CLP')}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgClass} ${colorClass} border ${borderClass}`}>
            <TrendIcon className="h-3 w-3" />
            {savingsRate.toFixed(1)}%
          </div>
          <p className={`${fontSizes.label} text-gray-500`}>{t('savingsRate')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
