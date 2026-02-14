'use client'

import { ClairCard } from '@/components/ui/ClairCard'
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
  const colorClass = isPositive ? 'text-income' : 'text-expense'
  const bgClass = isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
  const borderClass = isPositive ? 'border-green-100 dark:border-green-800' : 'border-red-100 dark:border-red-800'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  if (isLoading) {
    return <SavingsWidgetSkeleton />
  }

  return (
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <PiggyBank className={`h-4 w-4 ${colorClass}`} />
          {t('label')}
        </h3>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-center">
        <div className="text-3xl font-bold text-income">
          <AnimatedCurrency amount={savings} currency="CLP" />
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgClass} ${colorClass} border ${borderClass}`}>
            <TrendIcon className="h-3 w-3" />
            <AnimatedCounter value={savingsRate} decimals={1} suffix="%" />
          </div>
          <p className={`${fontSizes.label} text-slate-500 dark:text-slate-400`}>{t('savingsRate')}</p>
        </div>
      </div>
    </ClairCard>
  )
}
