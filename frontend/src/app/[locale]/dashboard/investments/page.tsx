'use client'

/**
 * Investments Page
 *
 * Main page showing all investment accounts and overall portfolio summary
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, TrendingUp } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { InvestmentTransactionModal } from '@/components/investments/InvestmentTransactionModal'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'

export default function InvestmentsPage() {
  const t = useTranslations('investments')
  const tCommon = useTranslations('common')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: accountsData, isLoading } = useAccounts({ limit: 100 })
  const allAccounts: any = (accountsData as any)?.data?.data || []
  const investmentAccounts = allAccounts.filter((acc: any) => acc.type === 'INVESTMENT')

  const formatCurrency = (amount: number, currency: string) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('newTransaction')}
        </Button>
      </div>

      {/* Investment Accounts */}
      {investmentAccounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noAccounts')}</h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              {t('noAccountsDescription')}
            </p>
            <Link href="/dashboard/accounts">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('createInvestmentAccount')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {investmentAccounts.map((account: any) => (
            <Link
              key={account.id}
              href={`/dashboard/investments/${account.id}`}
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      {account.accountNumber && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {account.accountNumber}
                        </p>
                      )}
                    </div>
                    {account.color && (
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: account.color }}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('cashBalance')}
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          Number(account.balance),
                          account.currency
                        )}
                      </p>
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      {t('viewPortfolio')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Transaction Modal */}
      <InvestmentTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
