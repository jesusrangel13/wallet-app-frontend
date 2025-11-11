'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wallet } from 'lucide-react'
import { formatCurrency, type Currency, CURRENCIES } from '@/types/currency'
import { useState, useEffect } from 'react'
import { accountAPI } from '@/lib/api'

export const TotalBalanceWidget = () => {
  const [totalBalance, setTotalBalance] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true)
        const res = await accountAPI.getTotalBalance()
        setTotalBalance(res.data.data)
      } catch (error) {
        console.error('Error fetching total balance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-600" />
            Total Balance
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
          <Wallet className="h-4 w-4 text-gray-600" />
          Total Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {Object.entries(totalBalance).map(([currency, amount]) => {
            const currencyCode = currency as Currency
            return (
              <div key={currency}>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(amount, currencyCode)}
                </div>
                <p className="text-xs text-gray-500">{CURRENCIES[currencyCode]?.name || currency}</p>
              </div>
            )
          })}
          {Object.keys(totalBalance).length === 0 && (
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(0, 'CLP')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
