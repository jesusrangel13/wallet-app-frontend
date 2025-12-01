'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'
import { useSelectedMonth } from '@/contexts/SelectedMonthContext'

interface PersonalExpensesWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const PersonalExpensesWidget = ({ gridWidth = 1, gridHeight = 1 }: PersonalExpensesWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
  const { month, year } = useSelectedMonth()
  const [expense, setExpense] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getPersonalExpenses({ month, year })
        setExpense(res.data.data.total)
      } catch (error) {
        console.error('Error fetching personal expenses:', error)
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
            <ShoppingCart className="h-4 w-4 text-amber-600" />
            Gastos Personales
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
          <ShoppingCart className="h-4 w-4 text-amber-600" />
          Gastos Personales
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${fontSizes.value} font-bold text-amber-600`}>
          {formatCurrency(expense, 'CLP')}
        </div>
        <p className={`${fontSizes.label} text-gray-500 mt-1`}>Este mes</p>
      </CardContent>
    </Card>
  )
}
