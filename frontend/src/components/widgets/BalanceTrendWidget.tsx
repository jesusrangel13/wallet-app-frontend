'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'
import { useBalanceHistory } from '@/hooks/useDashboard'
import { BalanceTrendWidgetSkeleton } from '@/components/ui/WidgetSkeletons'
import { AnimatedCurrency, AnimatedCounter } from '@/components/ui/animations'
import { EnhancedAreaChart } from '@/components/charts/EnhancedAreaChart'
import { useMemo, useState } from 'react'
import { calculateLinearRegression } from '@/lib/analytics'

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
  const { data: history, isLoading } = useBalanceHistory(30)

  // Forecast state
  const [showForecast, setShowForecast] = useState(false)

  // Calculate responsive sizes
  // We need to subtract the height of the stats section (approx 100-130px) to avoid scrolling
  const statsHeight = dimensions.isSmall ? 90 : 130
  const chartHeight = calculateChartHeight(dimensions.contentHeight - statsHeight)

  const spacingClass = dimensions.isSmall ? 'gap-1' : dimensions.isLarge ? 'gap-4' : 'gap-2'
  const labelFontSize = dimensions.isSmall ? 'text-[10px]' : 'text-xs'
  const valueFontSize = dimensions.isSmall ? 'text-lg' : dimensions.isLarge ? 'text-3xl' : 'text-2xl'
  const badgeFontSize = dimensions.isSmall ? 'text-[9px]' : 'text-xs'

  // Calculate stats
  const currentBalance = history && history.length > 0 ? history[history.length - 1].balance : 0
  const initialBalance = history && history.length > 0 ? history[0].balance : 0
  const change = currentBalance - initialBalance
  const changePercentage = initialBalance !== 0 ? (change / Math.abs(initialBalance)) * 100 : 0
  const isPositive = change >= 0

  // Transform data for EnhancedAreaChart with Forecast
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return []

    // 1. Map historical data
    const mappedHistory = history.map((d: BalanceData) => ({
      date: d.date,
      value: d.balance,
      forecast: undefined as number | undefined
    }))

    if (!showForecast) return mappedHistory

    // 2. Calculate forecast
    const balances = history.map((d: BalanceData) => d.balance)
    const { m, b } = calculateLinearRegression(balances)
    // Avoid error if date parsing fails, but assuming history has valid dates
    const lastDate = new Date(history[history.length - 1].date)

    // Generate 7 days forecast
    const forecastPoints = []

    // Add connection point (last actual value)
    forecastPoints.push({
      date: history[history.length - 1].date,
      value: undefined,
      forecast: history[history.length - 1].balance
    })

    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(lastDate)
      nextDate.setDate(lastDate.getDate() + i)

      const x = (history.length - 1) + i
      const y = m * x + b

      forecastPoints.push({
        date: nextDate.toISOString(),
        value: undefined,
        forecast: y
      })
    }

    // Merge
    // Clone history to avoid mutation issues if any
    const finalHistory = [...mappedHistory]
    const lastHistoryPoint = finalHistory[finalHistory.length - 1]

    // We want the line to connect. Recharts connects if data points share key OR if we use a specific structure.
    // For AreaChart with different dataKeys ('value' vs 'forecast'), they are different areas.
    // To make them look connected, they should share a point.
    // I set `forecast` on the last history point above in `forecastPoints` push but that was a separate array.
    // I need to set it on the object in `finalHistory`.
    lastHistoryPoint.forecast = lastHistoryPoint.value

    // Rest of forecast points
    const futurePoints = forecastPoints.slice(1).map(p => ({
      date: p.date,
      value: undefined,
      forecast: p.forecast
    }))

    return [...finalHistory, ...futurePoints]
  }, [history, showForecast])

  if (isLoading) {
    return <BalanceTrendWidgetSkeleton />
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-metric-label flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {t('title') || 'Balance Trend'}
          </CardTitle>
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${showForecast
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-transparent border-gray-200 dark:border-gray-700 text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
          >
            {showForecast ? 'Hide Forecast' : 'Show Forecast'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {history && history.length > 0 ? (
          <div className={`flex flex-col items-center justify-center ${spacingClass}`}>
            <div className="text-center w-full">
              <p className={`${labelFontSize} text-muted-foreground ${dimensions.isSmall ? 'mb-0.5' : 'mb-1.5'}`}>{t('currentBalance')}</p>
              <p className={`${valueFontSize} font-bold text-foreground ${dimensions.isSmall ? 'mb-1' : 'mb-2'} leading-tight`}>
                <AnimatedCurrency amount={currentBalance} currency="CLP" />
              </p>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isPositive ? 'bg-income-subtle text-income' : 'bg-expense-subtle text-expense'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className={`${badgeFontSize} font-semibold`}>
                  <AnimatedCounter value={changePercentage} decimals={1} />% {t('sinceStart')}
                </span>
              </div>
              {/* Compact info line */}
              <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{t('initial')}: <span className="font-semibold"><AnimatedCurrency amount={initialBalance} currency="CLP" /></span></span>
                <span className="text-muted-foreground/50">|</span>
                <span className={isPositive ? 'text-income' : 'text-expense'}>
                  {t('change')}: <span className="font-semibold">{isPositive ? '+' : ''}<AnimatedCurrency amount={change} currency="CLP" /></span>
                </span>
              </div>
            </div>

            {/* Chart - Dynamic height based on widget size */}
            <EnhancedAreaChart
              data={chartData}
              title=""
              height={chartHeight}
              currency="CLP"
              hideHeader={true}
              showTimeSelector={false}
              showForecast={showForecast}
            />
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
