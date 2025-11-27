'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PieChart as PieChartIcon } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useWidgetDimensions, calculateChartHeight } from '@/hooks/useWidgetDimensions'

interface CategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}

interface ExpensesByCategoryWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const ExpensesByCategoryWidget = ({ gridWidth = 2, gridHeight = 2 }: ExpensesByCategoryWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const [data, setData] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getExpensesByCategory()
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6b7280', '#ef4444', '#14b8a6']
        const withColors = res.data.data.map((cat: any, idx: number) => ({
          ...cat,
          color: colors[idx % colors.length]
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
            Expenses by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  // Calculate responsive sizes
  // For height 2, we have ~188px content height, which gives ~148px chart height
  // Use a more generous radius to better fill the space
  const chartHeight = calculateChartHeight(dimensions.contentHeight)
  const outerRadius = dimensions.isSmall ? 70 : dimensions.isLarge ? 100 : 80
  const labelFontSize = dimensions.isSmall ? 10 : 12

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Expenses by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={dimensions.isSmall ? false : ({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`}
                outerRadius={outerRadius}
                fill="#8884d8"
                dataKey="amount"
                style={{ fontSize: labelFontSize }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value), 'CLP')} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className={`flex items-center justify-center text-gray-500`} style={{ height: chartHeight }}>
            No expenses this month
          </div>
        )}
      </CardContent>
    </Card>
  )
}
