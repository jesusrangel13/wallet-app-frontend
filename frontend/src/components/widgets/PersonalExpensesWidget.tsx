'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-metric-label flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-balance-large font-bold text-amber-600 dark:text-amber-500">
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
