'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useTranslations } from 'next-intl'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useBalanceHistory } from '@/hooks/useDashboard'
import { BalanceTrendWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency, AnimatedCounter } from '@/components/ui/animations'

interface BalanceData {
  date: string
  balance: number
}

interface BalanceTrendWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const BalanceTrendWidget = ({ gridWidth = 2, gridHeight = 2 }: BalanceTrendWidgetProps) => {
  const t = useTranslations('widgets.balanceTrend')
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const { month, year } = useSelectedMonth()
  const { data, isLoading } = useBalanceHistory(30)

  // Calculate responsive sizes
  const chartHeight = calculateChartHeight(dimensions.contentHeight)
  const spacingClass = dimensions.isSmall ? 'gap-1' : dimensions.isLarge ? 'gap-4' : 'gap-2'
  const labelFontSize = dimensions.isSmall ? 'text-[10px]' : 'text-xs'
  const valueFontSize = dimensions.isSmall ? 'text-lg' : dimensions.isLarge ? 'text-3xl' : 'text-2xl'
  const badgeFontSize = dimensions.isSmall ? 'text-[9px]' : 'text-xs'

  // Calculate stats
  const currentBalance = data && data.length > 0 ? data[data.length - 1].balance : 0
  const initialBalance = data && data.length > 0 ? data[0].balance : 0
  const change = currentBalance - initialBalance
  const changePercentage = initialBalance !== 0 ? (change / Math.abs(initialBalance)) * 100 : 0
  const isPositive = change >= 0

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload

      // Parse date properly - handle both ISO strings and date objects
      let formattedDate = 'Fecha no disponible'
      try {
        const dateStr = data.date
        // Create date object and format it
        const dateObj = new Date(dateStr)
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString('es-ES', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        }
      } catch (error) {
        console.error('Error parsing date:', data.date)
      }

      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">
            {formattedDate}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {formatCurrency(data.balance, 'CLP')}
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return <BalanceTrendWidgetSkeleton />
  }


  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Balance Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <div className={`flex flex-col items-center justify-center ${spacingClass}`}>
            <div className="text-center w-full">
              <p className={`${labelFontSize} text-muted-foreground ${dimensions.isSmall ? 'mb-0.5' : 'mb-1.5'}`}>{t('currentBalance')}</p>
              <p className={`${valueFontSize} font-bold text-foreground ${dimensions.isSmall ? 'mb-1' : 'mb-2'} leading-tight`}>
                <AnimatedCurrency amount={currentBalance} currency="CLP" />
              </p>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className={`${badgeFontSize} font-semibold`}>
                  <AnimatedCounter value={changePercentage} decimals={1} />% {t('sinceStart')}
                </span>
              </div>
              {/* Compact info line */}
              <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{t('initial')}: <span className="font-semibold"><AnimatedCurrency amount={initialBalance} currency="CLP" /></span></span>
                <span className="text-muted-foreground/50">|</span>
                <span className={isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                  {t('change')}: <span className="font-semibold">{isPositive ? '+' : ''}<AnimatedCurrency amount={change} currency="CLP" /></span>
                </span>
              </div>
            </div>

            {/* Chart - Dynamic height based on widget size */}
            <div className="w-full">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    fill="url(#colorBalance)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            {t('noBalanceHistory')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
