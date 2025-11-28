'use client'

import { formatCurrency, type Currency } from '@/types/currency'
import { useState, useEffect, useRef } from 'react'
import { dashboardAPI } from '@/lib/api'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'

interface AccountBalance {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  creditLimit: number | null
  color: string
}

interface AccountBalancesWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const AccountBalancesWidget = ({ gridWidth = 4, gridHeight = 1 }: AccountBalancesWidgetProps) => {
  const [accounts, setAccounts] = useState<AccountBalance[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
      <Card className="h-[140px]">
        <CardContent className="h-full flex items-center justify-center !p-0">
          <div className="animate-pulse h-20 w-full bg-gray-200 rounded mx-4"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[140px]">
      <CardContent className="h-full flex items-center !p-0">
        {accounts.length > 0 ? (
          <div className="relative w-full h-full flex items-center px-4">
            {/* Carousel container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory w-full"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {accounts.map((account) => {
                // Calculate spent and percentage for credit cards
                const isCreditCard = account.type === 'CREDIT' && account.creditLimit
                const spent = isCreditCard ? account.creditLimit! - account.balance : 0
                const percentageUsed = isCreditCard ? (spent / account.creditLimit!) * 100 : 0

                return (
                  <div
                    key={account.id}
                    className="min-w-[230px] flex-shrink-0 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors snap-start"
                  >
                    {isCreditCard ? (
                      // CREDIT CARD LAYOUT - Ultra Compact
                      <div className="flex flex-col gap-1">
                        {/* Top: Color dot + Name */}
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: account.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-xs text-gray-900 truncate">{account.name}</h3>
                          </div>
                        </div>

                        {/* Middle: Spent amount */}
                        <div className="flex items-baseline justify-between">
                          <span className="text-[9px] text-gray-500 uppercase tracking-wide">Gastado</span>
                          <p className="font-semibold text-sm text-gray-900 tabular-nums">
                            {formatCurrency(spent, account.currency as Currency)}
                          </p>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(Math.max(percentageUsed, 0), 100)}%` }}
                          />
                        </div>

                        {/* Bottom: Available info */}
                        <p className="text-[9px] text-gray-500 truncate">
                          Disponible: <span className="font-medium text-gray-700">{formatCurrency(account.balance, account.currency as Currency)}</span>
                        </p>
                      </div>
                    ) : (
                      // DEBIT/OTHER ACCOUNTS LAYOUT - Ultra Compact
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: account.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs text-gray-900 truncate">{account.name}</p>
                          </div>
                        </div>
                        <div className="text-left mt-0.5">
                          <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">Balance</p>
                          <p className="font-semibold text-base text-gray-900 tabular-nums">
                            {formatCurrency(account.balance, account.currency as Currency)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add Account Card */}
              <button
                onClick={() => router.push('/dashboard/accounts')}
                className="min-w-[230px] flex-shrink-0 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-all snap-start flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-600">Agregar Cuenta</span>
              </button>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full px-4">
            <p className="text-gray-500 text-center text-xs mb-4">
              No cuentas aún. ¡Agrega tu primera cuenta!
            </p>
            <button
              onClick={() => router.push('/dashboard/accounts')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Agregar Cuenta
            </button>
          </div>
        )}

        {/* Custom CSS to hide scrollbar */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </CardContent>
    </Card>
  )
}
