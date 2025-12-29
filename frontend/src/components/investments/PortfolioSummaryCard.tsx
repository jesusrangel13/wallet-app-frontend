'use client'

/**
 * PortfolioSummaryCard Component
 *
 * Displays portfolio summary metrics (total value, P&L, ROI)
 */

import { useTranslations } from 'next-intl'
import { TrendingUp, TrendingDown, DollarSign, Target, PieChart } from 'lucide-react'
import type { PortfolioSummary } from '@/types/investment'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface PortfolioSummaryCardProps {
  summary: PortfolioSummary
  className?: string
}

export function PortfolioSummaryCard({
  summary,
  className = '',
}: PortfolioSummaryCardProps) {
  const t = useTranslations('investments')

  const formatCurrency = (amount: number, currency: string) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00%'
    }
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const isProfitable = summary.totalGainLoss >= 0
  const plColor = isProfitable ? 'text-green-600' : 'text-red-600'
  const plBgColor = isProfitable ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-5', className)}>
      {/* Total Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('totalValue')}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalValue, summary.currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('costBasis')}: {formatCurrency(summary.totalCostBasis, summary.currency)}
          </p>
        </CardContent>
      </Card>

      {/* Unrealized P&L */}
      <Card className={plBgColor}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('unrealizedPL')}
          </CardTitle>
          {isProfitable ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={cn('text-2xl font-bold', plColor)}>
            {formatCurrency(summary.totalUnrealizedGainLoss, summary.currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatPercentage(
              summary.totalCostBasis > 0
                ? (summary.totalUnrealizedGainLoss / summary.totalCostBasis) * 100
                : 0
            )}
          </p>
        </CardContent>
      </Card>

      {/* Realized P&L */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('realizedPL')}
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'text-2xl font-bold',
              summary.totalRealizedGainLoss >= 0
                ? 'text-green-600'
                : 'text-red-600'
            )}
          >
            {formatCurrency(summary.totalRealizedGainLoss, summary.currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('fromSales')}
          </p>
        </CardContent>
      </Card>

      {/* ROI */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('roi')}</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={cn('text-2xl font-bold', plColor)}>
            {formatPercentage(summary.roi)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('totalReturn')}
          </p>
        </CardContent>
      </Card>

      {/* Total Dividends */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('totalDividends')}
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalDividends, summary.currency)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('dividendsReceived')}
          </p>
        </CardContent>
      </Card>

      {/* Asset Allocation */}
      {Object.keys(summary.assetAllocation).length > 0 && (
        <Card className="md:col-span-2 lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {t('assetAllocation')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(summary.assetAllocation).map(([type, data]) => (
                <div
                  key={type}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">{t(type.toLowerCase())}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.count} {data.count === 1 ? t('asset') : t('assets')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {formatCurrency(data.value, summary.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.percentage?.toFixed(1) || '0.0'}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
