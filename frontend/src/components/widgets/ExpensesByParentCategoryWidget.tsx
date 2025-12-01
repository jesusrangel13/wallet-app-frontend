'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'

interface ParentCategoryData {
  category: string
  amount: number
  percentage: number
  icon: string | null
  color: string | null
}

interface ExpensesByParentCategoryWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const ExpensesByParentCategoryWidget = ({ gridWidth = 2, gridHeight = 2 }: ExpensesByParentCategoryWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const { month, year } = useSelectedMonth()
  const [data, setData] = useState<ParentCategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getExpensesByParentCategory({ month, year })
        setData(res.data.data)
      } catch (error) {
        console.error('Error fetching expenses by parent category:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [month, year])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
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
          dy={15}
          textAnchor="middle"
          fill="#666"
          fontSize="24"
        >
          {icon}
        </text>
      </g>
    )
  }

  // Calculate responsive sizes
  // Optimize chart height for bar charts - use more of the available space
  const chartHeight = dimensions.isSmall
    ? Math.max(dimensions.contentHeight, 100) // For height 2, use all contentHeight (188px)
    : calculateChartHeight(dimensions.contentHeight)
  const iconSize = dimensions.isSmall ? 18 : 24
  const yAxisWidth = dimensions.isSmall ? 40 : 60
  const showYAxis = dimensions.width >= 400

  // Optimize margins for small widgets - minimize all margins to maximize chart area
  const chartMargins = dimensions.isSmall
    ? { top: 5, right: 10, left: showYAxis ? 25 : 0, bottom: 0 }
    : { top: 10, right: 20, left: showYAxis ? 20 : 0, bottom: 0 }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Gastos por Categoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data} margin={chartMargins}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                tick={<CustomXAxisTick />}
                height={dimensions.isSmall ? 40 : 60}
                interval={0}
                minTickGap={0}
              />
              {showYAxis ? (
                <YAxis
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  width={yAxisWidth}
                />
              ) : (
                <YAxis hide />
              )}
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
          <div className="flex items-center justify-center text-gray-500" style={{ height: chartHeight }}>
            No hay gastos este mes
          </div>
        )}
      </CardContent>
    </Card>
  )
}
