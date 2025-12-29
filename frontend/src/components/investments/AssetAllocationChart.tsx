'use client'

/**
 * Asset Allocation Chart Component
 *
 * Displays a donut chart showing the distribution of assets by type
 * (CRYPTO, STOCK, ETF, FOREX) with percentages and values
 */

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { PortfolioSummary } from '@/types/investment'

interface AssetAllocationChartProps {
  summary: PortfolioSummary
}

// Color palette for each asset type
const ASSET_COLORS = {
  CRYPTO: '#f7931a', // Bitcoin orange
  STOCK: '#0088cc',  // Blue
  ETF: '#22c55e',    // Green
  FOREX: '#8b5cf6',  // Purple
} as const

const ASSET_LABELS = {
  CRYPTO: 'Cryptocurrency',
  STOCK: 'Stocks',
  ETF: 'ETFs',
  FOREX: 'Forex',
} as const

export function AssetAllocationChart({ summary }: AssetAllocationChartProps) {
  const chartData = useMemo(() => {
    if (!summary.assetAllocation || Object.keys(summary.assetAllocation).length === 0) {
      return []
    }

    return Object.entries(summary.assetAllocation)
      .map(([assetType, data]) => ({
        name: ASSET_LABELS[assetType as keyof typeof ASSET_LABELS] || assetType,
        value: data.value,
        percentage: data.percentage,
        count: data.count,
        assetType: assetType as keyof typeof ASSET_COLORS,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [summary.assetAllocation])

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No asset allocation data available
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
            {data.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Value: <span className="font-medium">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Allocation: <span className="font-medium">{data.percentage.toFixed(2)}%</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Holdings: <span className="font-medium">{data.count}</span>
          </p>
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
            <div className="text-sm">
              <span className="font-medium text-gray-900 dark:text-white">
                {entry.value}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                {formatCurrency(chartData[index].value)}
              </span>
            </div>
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
              <Cell key={`cell-${index}`} fill={ASSET_COLORS[entry.assetType]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={renderLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
