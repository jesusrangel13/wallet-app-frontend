'use client'

/**
 * Investment Portfolio Widget
 *
 * Shows a global summary of all investment accounts for the dashboard
 */

import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useGlobalPortfolioSummary } from '@/hooks/useInvestments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function InvestmentPortfolioWidget() {
  const t = useTranslations('investments')
  const tCommon = useTranslations('common')

  const { data: summary, isLoading, error } = useGlobalPortfolioSummary()

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            {tCommon('error')}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary || summary.totalAccounts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{t('noAccounts')}</p>
            <p className="text-sm text-gray-400 mb-6">
              {t('noAccountsDescription')}
            </p>
            <Link href="/dashboard/accounts">
              <Button>{t('createInvestmentAccount')}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isPositive = summary.totalUnrealizedPL >= 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('title')}</CardTitle>
        <div className="text-sm text-gray-500">
          {summary.totalAccounts} {summary.totalAccounts === 1 ? 'account' : 'accounts'}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Value */}
          <div>
            <p className="text-sm text-gray-500 mb-1">{t('totalValue')}</p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.totalValue)}
              </p>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                  isPositive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {formatPercent(summary.totalUnrealizedPLPercent)}
              </div>
            </div>
          </div>

          {/* P&L Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('unrealizedPL')}</p>
              <p
                className={`text-lg font-semibold ${
                  isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(summary.totalUnrealizedPL)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">{t('realizedPL')}</p>
              <p
                className={`text-lg font-semibold ${
                  summary.totalRealizedPL >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(summary.totalRealizedPL)}
              </p>
            </div>
          </div>

          {/* Top Performer */}
          {summary.topPerformer && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Top Performer</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {summary.topPerformer.symbol}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t(summary.topPerformer.assetType.toLowerCase())}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {formatPercent(summary.topPerformer.roi)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(summary.topPerformer.unrealizedPL)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* View Full Portfolio Link */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link href="/dashboard/investments">
              <Button variant="outline" className="w-full">
                {t('viewPortfolio')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
