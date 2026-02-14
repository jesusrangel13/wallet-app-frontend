'use client'

import { ClairCard } from '@/components/ui/ClairCard'
import { TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTransactionStats } from '@/hooks/useTransactions'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { MonthlyIncomeWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency } from '@/components/ui/animations'

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
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          {t('label')}
        </h3>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-center">
        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          <AnimatedCurrency amount={income} currency="CLP" />
        </div>
        <p className={`${fontSizes.label} text-slate-500 dark:text-slate-400 mt-1`}>{t('thisMonth')}</p>
      </div>
    </ClairCard>
  )
}
