'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Users } from 'lucide-react'
import { formatCurrency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'

export const SharedExpensesWidget = () => {
  const [expense, setExpense] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getSharedExpensesTotal()
        setExpense(res.data.data.total)
      } catch (error) {
        console.error('Error fetching shared expenses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpense()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          Gastos Compartidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-600">
          {formatCurrency(expense, 'CLP')}
        </div>
        <p className="text-xs text-gray-500 mt-1">Este mes</p>
      </CardContent>
    </Card>
  )
}
