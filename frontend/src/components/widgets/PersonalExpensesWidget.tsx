'use client'

import { ClairCard } from '@/components/ui/ClairCard'
import { ShoppingCart, Info } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { usePersonalExpenses } from '@/hooks/useDashboard'
import { PersonalExpensesWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency } from '@/components/ui/animations'
import { Tooltip } from '@/components/ui/Tooltip'

interface PersonalExpensesWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const PersonalExpensesWidget = ({ gridWidth = 1, gridHeight = 1 }: PersonalExpensesWidgetProps) => {
  const t = useTranslations('widgets.personalExpenses')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const { month, year } = useSelectedMonth()
  const { data, isLoading } = usePersonalExpenses({ month, year })

  const expense = data?.total ?? 0

  if (isLoading) {
    return <PersonalExpensesWidgetSkeleton />
  }

  return (
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <ShoppingCart className="h-4 w-4 text-amber-500" />
          {t('label')}
        </h3>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-center">
        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
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
