'use client'

/**
 * Holdings Allocation Chart Component
 *
 * Displays a donut chart showing the distribution of assets by individual holdings
 * (BTC, AAPL, VOO, etc.) with percentages and values
 */

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { PortfolioSummary } from '@/types/investment'

interface HoldingsAllocationChartProps {
  summary: PortfolioSummary
}

// Dynamic color palette (12 colors for variety)
const COLORS = [
  '#0088cc', // Blue
  '#f7931a', // Orange
  '#22c55e', // Green
  '#8b5cf6', // Purple
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#f97316', // Orange
  '#6b7280', // Gray (for "Others")
]

const MAX_HOLDINGS_DISPLAY = 10 // Top 10 holdings

export function HoldingsAllocationChart({ summary }: HoldingsAllocationChartProps) {
  const chartData = useMemo(() => {
    if (!summary.holdings || summary.holdings.length === 0 || summary.totalValue === 0) {
      return []
    }

    // Filter active holdings (quantity > 0)
    const activeHoldings = summary.holdings.filter(h => h.totalQuantity > 0 && h.currentValue > 0)

    if (activeHoldings.length === 0) return []

    // Calculate percentages and sort by value
    const holdingsWithPercentage = activeHoldings.map(holding => ({
      symbol: holding.assetSymbol,
      name: holding.assetName,
      value: holding.currentValue,
      percentage: (holding.currentValue / summary.totalValue) * 100,
      assetType: holding.assetType,
    })).sort((a, b) => b.value - a.value)

    // Separate top holdings from small ones
    const topHoldings = holdingsWithPercentage.slice(0, MAX_HOLDINGS_DISPLAY)
    const smallHoldings = holdingsWithPercentage.slice(MAX_HOLDINGS_DISPLAY)

    // Group small holdings into "Others" if exist
    if (smallHoldings.length > 0) {
      const othersValue = smallHoldings.reduce((sum, h) => sum + h.value, 0)
      const othersPercentage = smallHoldings.reduce((sum, h) => sum + h.percentage, 0)

      topHoldings.push({
        symbol: 'OTHERS',
        name: `Others (${smallHoldings.length} holdings)`,
        value: othersValue,
        percentage: othersPercentage,
        assetType: 'MIXED',
      })
    }

    return topHoldings
  }, [summary.holdings, summary.totalValue])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No holdings data available
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: summary.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">
            {data.symbol === 'OTHERS' ? data.name : `${data.symbol} - ${data.name}`}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Value: <span className="font-medium">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Allocation: <span className="font-medium">{data.percentage.toFixed(2)}%</span>
          </p>
          {data.symbol !== 'OTHERS' && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Type: {data.assetType}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percentage < 5) return null // Don't show label if percentage is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${percentage.toFixed(1)}%`}
      </text>
    )
  }

  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm font-medium text-gray-900">
              {chartData[index].symbol}
            </span>
            <span className="text-sm text-gray-700 ml-1">
              {formatCurrency(chartData[index].value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
