'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'

interface BalanceData {
  date: string
  balance: number
}

interface BalanceTrendWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const BalanceTrendWidget = ({ gridWidth = 2, gridHeight = 2 }: BalanceTrendWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const [data, setData] = useState<BalanceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getBalanceHistory(30)
        setData(res.data.data)
      } catch (error) {
        console.error('Error fetching balance history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate stats
  const currentBalance = data.length > 0 ? data[data.length - 1].balance : 0
  const initialBalance = data.length > 0 ? data[0].balance : 0
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
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2.5">
          <p className="text-xs text-gray-500 mb-0.5">
            {formattedDate}
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(data.balance, 'CLP')}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Balance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  // Calculate responsive sizes dynamically based on actual content
  // Balance section height varies by widget size:
  // - Small (h<=2): ~90px (text-xl + compact spacing + info line)
  // - Medium (h=3-4): ~110px (text-3xl + normal spacing + info line)
  // - Large (h>=5): ~130px (text-4xl + extra spacing + info line)
  const balanceInfoHeight = dimensions.isSmall ? 90 : dimensions.isMedium ? 110 : 130
  const chartHeight = Math.max(dimensions.contentHeight - balanceInfoHeight - 10, 80)

  const valueFontSize = dimensions.isSmall ? 'text-xl' : dimensions.isLarge ? 'text-4xl' : 'text-3xl'
  const labelFontSize = dimensions.isSmall ? 'text-xs' : dimensions.isLarge ? 'text-sm' : 'text-xs'
  const badgeFontSize = dimensions.isSmall ? 'text-xs' : 'text-xs'
  const spacingClass = dimensions.isSmall ? 'space-y-2' : 'space-y-3'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Balance Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className={`flex flex-col items-center justify-center ${spacingClass}`}>
            <div className="text-center w-full">
              <p className={`${labelFontSize} text-gray-500 ${dimensions.isSmall ? 'mb-0.5' : 'mb-1.5'}`}>Balance Actual</p>
              <p className={`${valueFontSize} font-bold text-gray-900 ${dimensions.isSmall ? 'mb-1' : 'mb-2'} leading-tight`}>
                {formatCurrency(currentBalance, 'CLP')}
              </p>
              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span className={`${badgeFontSize} font-semibold`}>
                  {changePercentage.toFixed(1)}% desde inicio
                </span>
              </div>
              {/* Compact info line */}
              <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-600">
                <span>Inicial: <span className="font-semibold">{formatCurrency(initialBalance, 'CLP')}</span></span>
                <span className="text-gray-300">|</span>
                <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
                  Cambio: <span className="font-semibold">{isPositive ? '+' : ''}{formatCurrency(change, 'CLP')}</span>
                </span>
              </div>
            </div>

            {/* Chart - Dynamic height based on widget size */}
            <div className="w-full">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
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
          <div className="flex items-center justify-center h-full text-gray-500">
            No hay historial de balance disponible
          </div>
        )}
      </CardContent>
    </Card>
  )
}
