'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Wallet } from 'lucide-react'
import { formatCurrency, type Currency } from '@/types/currency'
import { useState, useEffect } from 'react'
import { dashboardAPI } from '@/lib/api'

interface AccountBalance {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  creditLimit: number | null
  color: string
}

export const AccountBalancesWidget = () => {
  const [accounts, setAccounts] = useState<AccountBalance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getAccountBalances()
        setAccounts(res.data.data)
      } catch (error) {
        console.error('Error fetching account balances:', error)
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
            <Wallet className="h-5 w-5" />
            Account Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-48 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Account Balances
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.length > 0 ? (
            accounts.map((account) => {
              // Calculate spent and percentage for credit cards
              const isCreditCard = account.type === 'CREDIT' && account.creditLimit
              const spent = isCreditCard ? account.creditLimit! - account.balance : 0
              const percentageUsed = isCreditCard ? (spent / account.creditLimit!) * 100 : 0

              return (
                <div
                  key={account.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {isCreditCard ? (
                    // CREDIT CARD LAYOUT
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side: Color dot + Name + Type */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: account.color }}
                        />
                        <div>
                          <h3 className="font-medium text-gray-900">{account.name}</h3>
                          <p className="text-xs text-gray-500 uppercase">{account.type}</p>
                        </div>
                      </div>

                      {/* Right side: Amounts + Progress Bar */}
                      <div className="flex flex-col items-end gap-1 min-w-0">
                        {/* Spent amount */}
                        <p className="font-semibold text-lg text-gray-900 whitespace-nowrap">
                          {formatCurrency(spent, account.currency as Currency)} <span className="text-sm font-normal text-gray-500">gastado</span>
                        </p>

                        {/* Progress bar - compact */}
                        <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(Math.max(percentageUsed, 0), 100)}%` }}
                          />
                        </div>

                        {/* Available info */}
                        <p className="text-xs text-gray-500 whitespace-nowrap">
                          Disponible: {formatCurrency(account.balance, account.currency as Currency)} / {formatCurrency(account.creditLimit!, account.currency as Currency)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // DEBIT/OTHER ACCOUNTS LAYOUT
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: account.color }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{account.name}</p>
                          <p className="text-xs text-gray-500 uppercase">{account.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(account.balance, account.currency as Currency)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-gray-500 text-center py-8">
              No accounts yet. Add your first account to get started!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
