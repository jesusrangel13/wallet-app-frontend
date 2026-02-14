'use client'

import { ClairCard } from '@/components/ui/ClairCard'
import { Wallet } from 'lucide-react'
import { type Currency, CURRENCIES } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { useTotalBalance } from '@/hooks/useAccounts'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { TotalBalanceWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency } from '@/components/ui/animations'

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
    return <TotalBalanceWidgetSkeleton />
  }

  return (
    <ClairCard>
      <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-800 dark:text-white">
          <Wallet className="h-4 w-4" />
          {t('label')}
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-1">
          {Object.entries(totalBalance).map(([currency, amount]) => {
            const currencyCode = currency as Currency
            return (
              <div key={currency}>
                <div className={`${fontSizes.value} font-bold text-slate-800 dark:text-white`}>
                  <AnimatedCurrency amount={amount} currency={currencyCode} />
                </div>
                <p className={`${fontSizes.label} text-slate-500 dark:text-slate-400`}>{CURRENCIES[currencyCode]?.name || currency}</p>
              </div>
            )
          })}
          {Object.keys(totalBalance).length === 0 && (
            <div className={`${fontSizes.value} font-bold text-slate-800 dark:text-white`}>
              <AnimatedCurrency amount={0} currency="CLP" />
            </div>
          )}
        </div>
      </div>
    </ClairCard>
  )
}
