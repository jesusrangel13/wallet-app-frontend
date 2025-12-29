'use client'

/**
 * Portfolio Performance Chart Component
 *
 * Displays a line chart showing the portfolio value over time
 * with period selectors and cost basis reference line
 *
 * Optimizations:
 * - Pre-fetches all periods on mount for instant switching
 * - Extended cache (60min) keeps data in memory
 */

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts'
import { useQueryClient } from '@tanstack/react-query'
import { usePortfolioPerformance, investmentKeys } from '@/hooks/useInvestments'
import { investmentAPI } from '@/lib/api'
import { format, parseISO } from 'date-fns'

interface PortfolioPerformanceChartProps {
  accountId: string
  currency?: string
}

type Period = '1M' | '3M' | '6M' | '1Y' | 'ALL'

const PERIOD_LABELS = {
  '1M': '1 Month',
  '3M': '3 Months',
  '6M': '6 Months',
  '1Y': '1 Year',
  'ALL': 'All Time',
}

export function PortfolioPerformanceChart({
  accountId,
  currency = 'USD',
}: PortfolioPerformanceChartProps) {
  const [period, setPeriod] = useState<Period>('1Y')
  const queryClient = useQueryClient()

  const { data: performanceData, isLoading, error } = usePortfolioPerformance(
    accountId,
    period
  )

  // Pre-fetch all periods when component mounts for instant switching
  useEffect(() => {
    const periods: Period[] = ['1M', '3M', '6M', '1Y', 'ALL']

    // Pre-fetch all periods in background (skip current period, already loading)
    periods.forEach(p => {
      if (p !== period) {
        queryClient.prefetchQuery({
          queryKey: investmentKeys.portfolioPerformance(accountId, p),
          queryFn: async () => {
            const response = await investmentAPI.getPortfolioPerformance(accountId, p)
            return response.data.data
          },
          staleTime: 30 * 60 * 1000, // Match hook config
        })
      }
    })
  }, [accountId, queryClient, period])

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      if (period === '1M') {
        return format(date, 'MMM d')
      } else if (period === '3M' || period === '6M') {
        return format(date, 'MMM d')
      } else {
        return format(date, 'MMM yyyy')
      }
    } catch {
      return dateString
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const value = data.value
      const costBasis = data.costBasis
      const gainLoss = value - costBasis
      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0

      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {formatDate(data.date)}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Portfolio Value:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(value)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Cost Basis:
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(costBasis)}
              </span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-gray-200 dark:border-gray-600">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Gain/Loss:
              </span>
              <span
                className={`text-sm font-medium ${
                  gainLoss >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(gainLoss)} ({gainLossPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-80 text-red-500">
        Error loading performance data
      </div>
    )
  }

  if (!performanceData || performanceData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        No performance data available
      </div>
    )
  }

  // Determine if portfolio is overall positive or negative
  const latestValue = performanceData[performanceData.length - 1]?.value || 0
  const latestCostBasis = performanceData[performanceData.length - 1]?.costBasis || 0
  const isPositive = latestValue >= latestCostBasis

  return (
    <div className="w-full space-y-4">
      {/* Period Selector */}
      <div className="flex justify-end gap-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              period === p
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={performanceData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isPositive ? '#22c55e' : '#ef4444'}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={isPositive ? '#22c55e' : '#ef4444'}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            style={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            stroke="#6b7280"
            style={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            iconType="line"
          />
          <Area
            type="monotone"
            dataKey="value"
            fill="url(#colorValue)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="costBasis"
            stroke="#6b7280"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Cost Basis"
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={isPositive ? '#22c55e' : '#ef4444'}
            strokeWidth={3}
            dot={false}
            name="Portfolio Value"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Current Value
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(latestValue)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total Return
          </p>
          <p
            className={`text-lg font-semibold ${
              isPositive
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(latestValue - latestCostBasis)} (
            {latestCostBasis > 0
              ? ((latestValue - latestCostBasis) / latestCostBasis * 100).toFixed(2)
              : '0.00'}
            %)
          </p>
        </div>
      </div>
    </div>
  )
}
