'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-500" />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold text-blue-600 dark:text-blue-500`}>
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
