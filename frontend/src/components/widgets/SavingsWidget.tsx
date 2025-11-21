'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PiggyBank, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'

export const SavingsWidget = () => {
  const [savings, setSavings] = useState(0)
  const [savingsRate, setSavingsRate] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSavings = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getMonthlySavings()
        setSavings(res.data.data.savings)
        setSavingsRate(res.data.data.savingsRate)
      } catch (error) {
        console.error('Error fetching savings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSavings()
  }, [])

  const isPositive = savings >= 0
  const colorClass = isPositive ? 'text-green-600' : 'text-red-600'
  const bgClass = isPositive ? 'bg-green-50' : 'bg-red-50'
  const borderClass = isPositive ? 'border-green-100' : 'border-red-100'
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Ahorros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-8 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <PiggyBank className={`h-4 w-4 ${colorClass}`} />
          Ahorros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>
          {formatCurrency(savings, 'CLP')}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bgClass} ${colorClass} border ${borderClass}`}>
            <TrendIcon className="h-3 w-3" />
            {savingsRate.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500">de tasa de ahorro</p>
        </div>
      </CardContent>
    </Card>
  )
}
