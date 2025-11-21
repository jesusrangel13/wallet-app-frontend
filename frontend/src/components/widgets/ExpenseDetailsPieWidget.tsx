'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PieChart as PieChartIcon } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface CategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

export const ExpenseDetailsPieWidget = () => {
  const [data, setData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getExpensesByCategory()
        // Use colors from backend, fallback to default if not provided
        const defaultColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280', '#ef4444', '#14b8a6']
        const withColors = res.data.data.map((cat: any, idx: number) => ({
          ...cat,
          color: cat.color || defaultColors[idx % defaultColors.length]
        }))
        setData(withColors)
      } catch (error) {
        console.error('Error fetching expenses by category:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Detalle de Gastos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  // Custom legend formatter
  const renderLegend = (props: any) => {
    const { payload } = props
    return (
      <ul className="space-y-1 text-sm">
        {payload.map((entry: any, index: number) => (
          <li key={`legend-${index}`} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="truncate flex-1">{entry.value}</span>
            <span className="text-gray-500 text-xs">
              {entry.payload.percentage.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Detalle de Gastos
        </CardTitle>
        <p className="text-sm text-gray-500">Este mes</p>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                cx="35%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="amount"
                nameKey="category"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  const percentage = props.payload.percentage
                  return [
                    `${formatCurrency(value, 'CLP')} (${percentage.toFixed(0)}%)`,
                    props.payload.category
                  ]
                }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                content={renderLegend}
                wrapperStyle={{
                  paddingLeft: '20px',
                  maxHeight: '320px',
                  overflowY: 'auto',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-gray-500">
            No hay gastos este mes
          </div>
        )}
      </CardContent>
    </Card>
  )
}
