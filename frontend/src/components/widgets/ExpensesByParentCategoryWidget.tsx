'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ParentCategoryData {
  category: string
  amount: number
  percentage: number
  icon: string | null
  color: string | null
}

export const ExpensesByParentCategoryWidget = () => {
  const [data, setData] = useState<ParentCategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getExpensesByParentCategory()
        setData(res.data.data)
      } catch (error) {
        console.error('Error fetching expenses by parent category:', error)
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
            <BarChart3 className="h-5 w-5" />
            Gastos por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  // Custom tick component to show only icon
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props
    const categoryData = data.find(d => d.category === payload.value)

    // Get icon, fallback to default if null, undefined, or empty string
    const icon = categoryData?.icon && categoryData.icon.trim() !== ''
      ? categoryData.icon
      : '📊'

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={20}
          textAnchor="middle"
          fill="#666"
          fontSize="24"
        >
          {icon}
        </text>
      </g>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Gastos por Categoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                tick={<CustomXAxisTick />}
                height={60}
                interval={0}
                minTickGap={0}
              />
              <YAxis
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  const percentage = props.payload.percentage
                  return [
                    `${formatCurrency(value, 'CLP')} (${percentage.toFixed(1)}%)`,
                    'Monto'
                  ]
                }}
                labelFormatter={(label) => `Categoría: ${label}`}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[240px] text-gray-500">
            No hay gastos este mes
          </div>
        )}
      </CardContent>
    </Card>
  )
}
