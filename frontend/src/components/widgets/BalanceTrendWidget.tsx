'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'

interface BalanceData {
  date: string
  balance: number
}

export const BalanceTrendWidget = () => {
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Balance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Balance Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            {/* Current Balance - Optimized for minHeight 2 */}
            <div className="text-center w-full">
              <p className="text-xs text-gray-500 mb-1.5">Balance Actual</p>
              <p className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {formatCurrency(currentBalance, 'CLP')}
              </p>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span className="text-xs font-semibold">
                  {changePercentage.toFixed(1)}% desde inicio
                </span>
              </div>
            </div>

            {/* Sparkline - Compact */}
            <div className="w-full">
              <ResponsiveContainer width="100%" height={70}>
                <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
          <div className="flex items-center justify-center h-[250px] text-gray-500">
            No hay historial de balance disponible
          </div>
        )}
      </CardContent>
    </Card>
  )
}
