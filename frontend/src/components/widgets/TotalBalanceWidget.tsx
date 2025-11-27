'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wallet } from 'lucide-react'
import { formatCurrency, type Currency, CURRENCIES } from '@/types/currency'
import { useState, useEffect } from 'react'
import { accountAPI } from '@/lib/api'
import { useWidgetDimensions, getResponsiveFontSizes } from '@/hooks/useWidgetDimensions'

interface TotalBalanceWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const TotalBalanceWidget = ({ gridWidth = 1, gridHeight = 1 }: TotalBalanceWidgetProps) => {
  const dimensions = useWidgetDimensions(gridWidth, gridHeight)
  const fontSizes = getResponsiveFontSizes(dimensions)
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
        <CardTitle className={`${dimensions.isWide ? 'text-base' : 'text-sm'} font-medium text-gray-600 flex items-center gap-2`}>
          <Wallet className={`${dimensions.isWide ? 'h-5 w-5' : 'h-4 w-4'} text-gray-600`} />
          Total Balance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {Object.entries(totalBalance).map(([currency, amount]) => {
            const currencyCode = currency as Currency
            return (
              <div key={currency}>
                <div className={`${fontSizes.value} font-bold text-gray-900`}>
                  {formatCurrency(amount, currencyCode)}
                </div>
                <p className={`${fontSizes.label} text-gray-500`}>{CURRENCIES[currencyCode]?.name || currency}</p>
              </div>
            )
          })}
          {Object.keys(totalBalance).length === 0 && (
            <div className={`${fontSizes.value} font-bold text-gray-900`}>{formatCurrency(0, 'CLP')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
