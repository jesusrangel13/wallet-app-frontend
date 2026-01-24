'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PiggyBank, TrendingUp, TrendingDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useMonthlySavings } from '@/hooks/useDashboard'
import { SavingsWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency, AnimatedCounter } from '@/components/ui/animations'

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
  const colorClass = isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
  const bgClass = isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
  const borderClass = isPositive ? 'border-green-100 dark:border-green-800' : 'border-red-100 dark:border-red-800'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  if (isLoading) {
    return <SavingsWidgetSkeleton />
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <PiggyBank className={`h-4 w-4 ${colorClass}`} />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold ${colorClass}`}>
          <AnimatedCurrency amount={savings} currency="CLP" />
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgClass} ${colorClass} border ${borderClass}`}>
            <TrendIcon className="h-3 w-3" />
            <AnimatedCounter value={savingsRate} decimals={1} suffix="%" />
          </div>
          <p className={`${fontSizes.label} text-gray-500 dark:text-gray-400`}>{t('savingsRate')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
