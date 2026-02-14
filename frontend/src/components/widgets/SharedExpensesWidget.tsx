'use client'

import { ClairCard } from '@/components/ui/ClairCard'
import { Users, Info } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useSharedExpensesTotal } from '@/hooks/useDashboard'
import { SharedExpensesWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency } from '@/components/ui/animations'
import { Tooltip } from '@/components/ui/Tooltip'

interface SharedExpensesWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const SharedExpensesWidget = ({ gridWidth = 1, gridHeight = 1 }: SharedExpensesWidgetProps) => {
  const t = useTranslations('widgets.sharedExpenses')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const { month, year } = useSelectedMonth()
  const { data, isLoading } = useSharedExpensesTotal({ month, year })

  const expense = data?.total ?? 0

  if (isLoading) {
    return <SharedExpensesWidgetSkeleton />
  }

  return (
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          {t('label')}
        </h3>
      </div>
      <div className="p-6">
        <div className="text-balance-large font-bold text-blue-600 dark:text-blue-500">
          <AnimatedCurrency amount={expense} currency="CLP" />
        </div>
        <div className={`${fontSizes.label} text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1`}>
          {t('thisMonth')}
          <Tooltip content={t('tooltip')} side="bottom">
            <Info className="h-3 w-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-help" />
          </Tooltip>
        </div>
      </div>
    </ClairCard>
  )
}
