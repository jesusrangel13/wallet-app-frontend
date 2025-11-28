'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'

interface CashFlowData {
  month: string
  year?: string
  income: number
  expense: number
}

interface CashFlowWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const CashFlowWidget = ({ gridWidth = 2, gridHeight = 2 }: CashFlowWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const [data, setData] = useState<CashFlowData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getCashFlow(6)
        setData(res.data.data)
      } catch (error) {
        console.error('Error fetching cash flow:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate statistics
  const avgIncome = data.length > 0 ? data.reduce((sum, d) => sum + d.income, 0) / data.length : 0
  const avgExpense = data.length > 0 ? data.reduce((sum, d) => sum + d.expense, 0) / data.length : 0
  const avgBalance = avgIncome - avgExpense

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  // Calculate responsive sizes
  const chartHeight = calculateChartHeight(dimensions.contentHeight)
  const cardPadding = dimensions.isSmall ? 'p-1.5' : 'p-2'
  const cardFontSize = dimensions.isSmall ? 'text-[10px]' : 'text-xs'
  const valueFontSize = dimensions.isSmall ? 'text-sm' : 'text-base'
  const xAxisFontSize = dimensions.isSmall ? 8 : 10

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Cash Flow
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-3">
            {/* Summary cards - Responsive sizing */}
            <div className="grid grid-cols-3 gap-2">
              <div className={`bg-green-50 rounded-lg ${cardPadding} border border-green-100`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                  <p className={`${cardFontSize} text-green-700 font-medium`}>Ingreso Promedio</p>
                </div>
                <p className={`${valueFontSize} font-bold text-green-900`}>
                  {formatCurrency(avgIncome, 'CLP')}
                </p>
              </div>
              <div className={`bg-red-50 rounded-lg ${cardPadding} border border-red-100`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                  <p className={`${cardFontSize} text-red-700 font-medium`}>Gasto Promedio</p>
                </div>
                <p className={`${valueFontSize} font-bold text-red-900`}>
                  {formatCurrency(avgExpense, 'CLP')}
                </p>
              </div>
              <div className={`${avgBalance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'} rounded-lg ${cardPadding} border`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <DollarSign className={`h-3.5 w-3.5 ${avgBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                  <p className={`${cardFontSize} font-medium ${avgBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>Balance Neto</p>
                </div>
                <p className={`${valueFontSize} font-bold ${avgBalance >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
                  {formatCurrency(avgBalance, 'CLP')}
                </p>
              </div>
            </div>

            {/* Dynamic height bar chart */}
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: xAxisFontSize }} tickLine={false} />
                <YAxis hide />
                <Tooltip formatter={(value) => formatCurrency(Number(value), 'CLP')} />
                <Bar dataKey="income" fill="#10b981" name="Ingresos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="Gastos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[240px] text-gray-500">
            No hay datos disponibles
          </div>
        )}
      </CardContent>
    </Card>
  )
}
