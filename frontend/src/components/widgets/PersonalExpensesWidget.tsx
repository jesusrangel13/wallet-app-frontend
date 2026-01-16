'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { usePersonalExpenses } from '@/hooks/useDashboard'
import { PersonalExpensesWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency } from '@/components/ui/animations'

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
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4 text-amber-600" />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold text-amber-600`}>
          <AnimatedCurrency amount={expense} currency="CLP" />
        </div>
        <p className={`${fontSizes.label} text-gray-500 mt-1`}>{t('thisMonth')}</p>
      </CardContent>
    </Card>
  )
}
