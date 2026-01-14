'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wallet } from 'lucide-react'
import { formatCurrency, type Currency, CURRENCIES } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { useTotalBalance } from '@/hooks/useAccounts'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'

interface TotalBalanceWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const TotalBalanceWidget = ({ gridWidth = 1, gridHeight = 1 }: TotalBalanceWidgetProps) => {
  const t = useTranslations('widgets.totalBalance')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)

  // Use React Query hook for automatic caching and revalidation
  const { data: response, isLoading } = useTotalBalance()
  const totalBalance = response?.data?.data || {}

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
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
          <Wallet className="h-4 w-4" />
          {t('label')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {Object.entries(totalBalance).map(([currency, amount]) => {
            const currencyCode = currency as Currency
            return (
              <div key={currency}>
                <div className={`${fontSizes.value} font-bold text-gray-900`}>
                  {formatCurrency(amount, currencyCode)}
                </div>
                <p className={`${fontSizes.label} text-gray-500`}>{CURRENCIES[currencyCode]?.name || currency}</p>
              </div>
            )
          })}
          {Object.keys(totalBalance).length === 0 && (
            <div className={`${fontSizes.value} font-bold text-gray-900`}>{formatCurrency(0, 'CLP')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
