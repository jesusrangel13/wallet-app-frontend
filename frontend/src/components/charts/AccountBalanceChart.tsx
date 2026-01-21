'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, type Currency } from '@/types/currency'

interface BalanceDataPoint {
  date: string
  balance: number | null
}

interface AccountBalanceChartProps {
  data: BalanceDataPoint[]
  currency: Currency
  previousMonthBalance: number
  percentageChange: number
}

/**
 * Account Balance Chart Component
 *
 * This component is lazy-loaded to reduce initial bundle size.
 * recharts adds ~200KB to the bundle, so we only load it when needed.
 */
export function AccountBalanceChart({
  data,
  currency,
  previousMonthBalance,
  percentageChange,
}: AccountBalanceChartProps) {
  return (
    <div className="relative">
      {/* Comparison Badge - Top Right */}
      <div className="absolute top-0 right-8 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-gray-500">vs periodo anterior</p>
            <p className="text-sm font-medium text-gray-700">
              {formatCurrency(previousMonthBalance, currency)}
            </p>
          </div>
          <div className={`flex items-center gap-1 ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {percentageChange >= 0 ? '↗' : '↘'}
            <span className="text-lg font-semibold">
              {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}/${date.getMonth() + 1}`
            }}
          />
          <YAxis
            width={80}
            tickFormatter={(value) => {
              // Format to shorter display (K for thousands, M for millions)
              const absValue = Math.abs(value)
              if (absValue >= 1000000) {
                return `${currency === 'CLP' ? '$' : ''}${(value / 1000000).toFixed(1)}M`
              } else if (absValue >= 1000) {
                return `${currency === 'CLP' ? '$' : ''}${(value / 1000).toFixed(0)}K`
              }
              return formatCurrency(value, currency)
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value, currency)}
            labelFormatter={(label) => {
              const date = new Date(label)
              return date.toLocaleDateString()
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorBalance)"
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
