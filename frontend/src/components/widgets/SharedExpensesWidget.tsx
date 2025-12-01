'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'

interface SharedExpensesWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const SharedExpensesWidget = ({ gridWidth = 1, gridHeight = 1 }: SharedExpensesWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const { month, year } = useSelectedMonth()
  const [expense, setExpense] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getSharedExpensesTotal({ month, year })
        setExpense(res.data.data.total)
      } catch (error) {
        console.error('Error fetching shared expenses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpense()
  }, [month, year])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Gastos Compartidos
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          Gastos Compartidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold text-blue-600`}>
          {formatCurrency(expense, 'CLP')}
        </div>
        <p className={`${fontSizes.label} text-gray-500 mt-1`}>Este mes</p>
      </CardContent>
    </Card>
  )
}
