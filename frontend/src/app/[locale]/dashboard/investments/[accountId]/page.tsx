'use client'

/**
 * Investment Account Detail Page
 *
 * Shows portfolio holdings, transactions, and metrics for a specific investment account
 */

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Plus, Trash2, Calendar } from 'lucide-react'
import { useAccount } from '@/hooks/useAccounts'
import {
  useInvestmentHoldings,
  usePortfolioSummary,
  useInvestmentTransactions,
  useDeleteInvestmentTransaction,
} from '@/hooks/useInvestments'
import { HoldingsTable } from '@/components/investments/HoldingsTable'
import { PortfolioSummaryCard } from '@/components/investments/PortfolioSummaryCard'
import { InvestmentTransactionModal } from '@/components/investments/InvestmentTransactionModal'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function InvestmentAccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.accountId as string

  const t = useTranslations('investments')
  const tCommon = useTranslations('common')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  )

  // Queries
  const { data: account, isLoading: accountLoading } = useAccount(accountId)
  const { data: holdings, isLoading: holdingsLoading } =
    useInvestmentHoldings(accountId)
  const { data: summary, isLoading: summaryLoading } =
    usePortfolioSummary(accountId)
  const { data: transactionsData, isLoading: transactionsLoading } =
    useInvestmentTransactions({ accountId })

  // Mutations
  const deleteTransaction = useDeleteInvestmentTransaction()

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return

    try {
      await deleteTransaction.mutateAsync(transactionToDelete)
      toast.success(t('transactionDeleted'))
      setDeleteDialogOpen(false)
      setTransactionToDelete(null)
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t('transactionDeleteFailed')
      )
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  if (accountLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  if (!account || account.data.type !== 'INVESTMENT') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold mb-2">{t('accountNotFound')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('accountNotFoundDescription')}
        </p>
        <Link href="/dashboard/investments">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToInvestments')}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/investments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {account.data.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('cashBalance')}:{' '}
              {formatCurrency(Number(account.data.balance), account.data.currency)}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('newTransaction')}
        </Button>
      </div>

      {/* Portfolio Summary */}
      {summaryLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        </div>
      ) : summary ? (
        <PortfolioSummaryCard summary={summary} />
      ) : null}

      {/* Tabs */}
      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="portfolio">{t('portfolio')}</TabsTrigger>
          <TabsTrigger value="transactions">{t('transactions')}</TabsTrigger>
        </TabsList>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('holdings')}</CardTitle>
              <CardDescription>{t('holdingsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {holdingsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                </div>
              ) : holdings && holdings.length > 0 ? (
                <HoldingsTable holdings={holdings} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {t('noHoldings')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('transactionHistory')}</CardTitle>
              <CardDescription>
                {t('transactionHistoryDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                </div>
              ) : transactionsData?.data && transactionsData.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('date')}</TableHead>
                      <TableHead>{t('asset')}</TableHead>
                      <TableHead>{t('type')}</TableHead>
                      <TableHead className="text-right">{t('quantity')}</TableHead>
                      <TableHead className="text-right">{t('price')}</TableHead>
                      <TableHead className="text-right">{t('total')}</TableHead>
                      <TableHead className="text-right">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsData.data.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(
                              new Date(transaction.transactionDate),
                              'MMM dd, yyyy'
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.assetSymbol}</p>
                            <Badge variant="outline" className="mt-1">
                              {t(transaction.assetType.toLowerCase())}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.type === 'BUY' ? 'default' : 'secondary'
                            }
                          >
                            {t(transaction.type.toLowerCase())}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.quantity.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            Number(transaction.pricePerUnit),
                            transaction.currency
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(
                            Number(transaction.totalAmount),
                            transaction.currency
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setTransactionToDelete(transaction.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {t('noTransactions')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Modal */}
      <InvestmentTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultAccountId={accountId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTransaction')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteTransactionConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
