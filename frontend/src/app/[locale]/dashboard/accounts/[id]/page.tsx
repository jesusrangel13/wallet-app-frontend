'use client'

import { use, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { accountAPI, transactionAPI } from '@/lib/api'
import type { Account, Transaction } from '@/types'
import { formatCurrency, type Currency } from '@/types/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingPage, LoadingSpinner } from '@/components/ui/Loading'
import { Skeleton } from '@/components/ui/Skeleton'
import { ArrowLeft, Edit, Trash2, Wallet, CreditCard, TrendingUp, MoreHorizontal } from 'lucide-react'
import { getAccountIcon } from '@/utils/accountIcons'
import { toast } from 'sonner'
import DeleteAccountModal from '@/components/DeleteAccountModal'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DateGroupHeader } from '@/components/DateGroupHeader'
import { TransactionCard } from '@/components/transactions/TransactionCard'
import { TimelineConnector } from '@/components/transactions/TimelineConnector'
import TransactionFormModal from '@/components/TransactionFormModal'
import { exportToCSV, exportToJSON, exportToExcel } from '@/lib/exportTransactions'
import { SharedExpenseIndicator } from '@/components/SharedExpenseIndicator'
import { AccountHeroCard } from '@/components/accounts/AccountHeroCard'
import dynamic from 'next/dynamic'

const LazyDailySpendingChart = dynamic(
  () => import('@/components/charts/DailySpendingChart').then(mod => ({ default: mod.DailySpendingChart })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ),
    ssr: false,
  }
)

const LazyBalanceHistoryChart = dynamic(
  () => import('@/components/charts/BalanceHistoryChart').then(mod => ({ default: mod.BalanceHistoryChart })),
  {
    loading: () => <Skeleton className="h-[300px] w-full rounded-xl" />,
    ssr: false,
  }
)

// Account schema for editing
const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CASH', 'DEBIT', 'CREDIT', 'SAVINGS', 'INVESTMENT']),
  balance: z.coerce.number(),
  currency: z.enum(['CLP', 'USD', 'EUR']).default('CLP'),
  isDefault: z.boolean().default(false),
  includeInTotalBalance: z.boolean().default(true),
  accountNumber: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().regex(/^\d+$/, 'Only numbers allowed').optional()
  ),
  color: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional()
  ),
  creditLimit: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.coerce.number().positive().optional()),
  billingDay: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.coerce.number().min(1).max(31).optional()),
})

type AccountFormData = z.infer<typeof accountSchema>

type TabType = 'balance' | 'transactions'

interface BalanceHistoryData {
  history: Array<{ date: string; balance: number }>
  currentBalance: number
  previousMonthBalance: number
  percentageChange: number
  month: number
  year: number
}

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  // State
  const [account, setAccount] = useState<Account | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Removed activeTab - using continuous scroll layout
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [transactionCount, setTransactionCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set())
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [hasLoadedBalance, setHasLoadedBalance] = useState(false)
  const [hasLoadedTransactions, setHasLoadedTransactions] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  })

  const selectedType = watch('type')

  /* Metrics and Grouping */
  const currentMonthMetrics = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return transactions.reduce((acc: any, t: any) => {
      const d = new Date(t.date)
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (t.type === 'INCOME') acc.income += Number(t.amount)
        if (t.type === 'EXPENSE') acc.expense += Number(t.amount)
      }
      return acc
    }, { income: 0, expense: 0 })
  }, [transactions])

  // Load data once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Load account data and all accounts
      try {
        setIsLoading(true)
        const [accountResponse, accountsResponse] = await Promise.all([
          accountAPI.getById(id),
          accountAPI.getAll()
        ])
        setAccount(accountResponse.data.data)
        const accountsData = accountsResponse.data as any
        setAccounts(Array.isArray(accountsData) ? accountsData : accountsData.data)
      } catch (error: any) {
        console.error('Error loading account:', error)
        toast.error('Failed to load account')
        router.push('/dashboard/accounts')
        return
      } finally {
        setIsLoading(false)
      }

      // Load transactions only
      loadTransactions()
    }

    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadAccountData = async () => {
    try {
      const response = await accountAPI.getById(id)
      setAccount(response.data.data)
    } catch (error: any) {
      console.error('Error loading account:', error)
      toast.error('Failed to load account')
    }
  }

  const loadBalanceHistory = async (force = false) => {
    if (hasLoadedBalance && !force) return // Skip if already loaded

    try {
      setIsLoadingChart(true)
      const now = new Date()
      const response = await accountAPI.getBalanceHistory(id, now.getMonth() + 1, now.getFullYear())
      setBalanceHistory(response.data.data)
      setHasLoadedBalance(true)
    } catch (error: any) {
      console.error('Error loading balance history:', error)
      toast.error('Failed to load balance history')
    } finally {
      setIsLoadingChart(false)
    }
  }

  const loadTransactions = async (force = false) => {
    if (hasLoadedTransactions && !force) return // Skip if already loaded

    try {
      setIsLoadingTransactions(true)
      const response = await transactionAPI.getAll({ accountId: id, limit: 100 })
      console.log('Transactions response:', response.data)
      setTransactions(response.data.data.data || [])
      setTransactionCount(response.data.data.total || 0)
      setHasLoadedTransactions(true)
    } catch (error: any) {
      console.error('Error loading transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const refreshData = async () => {
    await Promise.all([
      loadAccountData(),
      loadTransactions(true)
    ])
  }


  const handleEdit = () => {
    if (!account) return
    reset({
      name: account.name,
      type: account.type,
      balance: Number(account.balance),
      currency: account.currency as Currency,
      isDefault: account.isDefault,
      includeInTotalBalance: account.includeInTotalBalance,
      accountNumber: account.accountNumber || '',
      color: account.color || '',
      creditLimit: account.creditLimit ? Number(account.creditLimit) : undefined,
      billingDay: account.billingDay || undefined,
    })
    setIsEditModalOpen(true)
  }

  const handleSelectTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactionIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTransactionIds(newSelected)
    setSelectAll(newSelected.size === transactions.length && transactions.length > 0)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTransactionIds(new Set())
      setSelectAll(false)
    } else {
      const allIds = new Set(transactions.map(t => t.id))
      setSelectedTransactionIds(allIds)
      setSelectAll(true)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedTransactionIds.size === 0) return

    try {
      setIsBulkDeleting(true)
      const transactionIds = Array.from(selectedTransactionIds)
      const result = await transactionAPI.bulkDelete(transactionIds) // Assumes API supports this, derived from transactions page usage
      toast.success('Transactions deleted successfully')
      await loadTransactions(true)
      setSelectedTransactionIds(new Set())
      setSelectAll(false)
      setShowBulkDeleteConfirm(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete transactions')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const onSubmitEdit = async (data: AccountFormData) => {
    try {
      setIsSubmitting(true)
      await accountAPI.update(id, data)
      toast.success('Account updated successfully')
      setIsEditModalOpen(false)
      await loadAccountData()
    } catch (error: any) {
      console.error('Error updating account:', error)
      toast.error(error.response?.data?.message || 'Failed to update account')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = async () => {
    try {
      const result = await accountAPI.delete(id)

      if (result.data.data.hasTransactions) {
        setTransactionCount(result.data.data.transactionCount || 0)
        setIsDeleteModalOpen(true)
      } else {
        toast.success('Account deleted successfully')
        router.push('/dashboard/accounts')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
    }
  }

  const handleDeleteConfirm = async (transferToAccountId?: string) => {
    try {
      await accountAPI.delete(id, transferToAccountId)
      toast.success('Account deleted successfully')
      setIsDeleteModalOpen(false)
      router.push('/dashboard/accounts')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
      throw error
    }
  }



  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `account_${account?.name}_transactions_${timestamp}`

    switch (format) {
      case 'csv':
        exportToCSV(transactions, `${filename}.csv`)
        break
      case 'json':
        exportToJSON(transactions, `${filename}.json`)
        break
      case 'excel':
        exportToExcel(transactions, `${filename}.xlsx`)
        break
    }

    toast.success(`Exported ${transactions.length} transactions`)
    setShowExportMenu(false)
  }

  const handleTransactionSubmit = async (data: any, sharedExpenseData?: any) => {
    try {
      if (editingTransaction) {
        await transactionAPI.update(editingTransaction.id, data)
        toast.success('Transaction updated successfully')
      } else {
        await transactionAPI.create(data)
        toast.success('Transaction created successfully')
      }

      setIsTransactionModalOpen(false)
      setEditingTransaction(null)
      await refreshData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save transaction')
      throw error
    }
  }

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const grouped = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
          currency: transaction.account?.currency || account?.currency || 'CLP',
        }
      }
      acc[date].transactions.push(transaction)

      if (transaction.type === 'INCOME') {
        acc[date].totalIncome += Number(transaction.amount)
      } else if (transaction.type === 'EXPENSE') {
        acc[date].totalExpense += Number(transaction.amount)
      }

      return acc
    }, {} as Record<string, { date: string; transactions: Transaction[]; totalIncome: number; totalExpense: number; currency: string }>)

    return Object.values(grouped).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  // Transform balance history to show full month, but only populate data up to today
  const filteredBalanceData = useMemo(() => {
    if (!balanceHistory || balanceHistory.history.length === 0) return []

    const today = new Date()
    const currentMonth = today.getMonth() + 1
    const currentYear = today.getFullYear()

    // Create today's date string in YYYY-MM-DD format
    const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const isCurrentMonth = balanceHistory.month === currentMonth && balanceHistory.year === currentYear

    if (isCurrentMonth) {
      return balanceHistory.history.map((item) => {
        // Simple string comparison: "2025-12-01" <= "2025-12-05"
        const shouldShow = item.date <= todayStr

        console.log('Date:', item.date, 'Today:', todayStr, 'Show:', shouldShow, 'Balance:', item.balance)

        return {
          date: item.date,
          balance: shouldShow ? Number(item.balance) : null
        }
      })
    }

    return balanceHistory.history.map(item => ({
      date: item.date,
      balance: Number(item.balance)
    }))
  }, [balanceHistory])

  if (isLoading || !account) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-9 w-20" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </div>

        {/* Balance Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          {/* Select All Button - Floating Bar */}
          {selectedTransactionIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-full px-6 py-3 z-50 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    id="floating-select-all"
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label htmlFor="floating-select-all" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer whitespace-nowrap">
                    {selectedTransactionIds.size} seleccionadas
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTransactionIds(new Set())
                    setSelectAll(false)
                  }}
                  disabled={isBulkDeleting}
                  className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={isBulkDeleting}
                  className="rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm"
                >
                  {isBulkDeleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          )}

          {/* Bulk Delete Confirmation Modal */}
          <Modal
            isOpen={showBulkDeleteConfirm}
            onClose={() => setShowBulkDeleteConfirm(false)}
            title="Eliminar transacciones"
          >
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-900 dark:text-red-200">
                  ¿Estás seguro de que deseas eliminar {selectedTransactionIds.size} transacción{selectedTransactionIds.size !== 1 ? 'es' : ''}?
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isBulkDeleting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isBulkDeleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </Modal>

        </div>
      </div>
    )
  }



  const groupedTransactions = groupTransactionsByDate(transactions)

  return (
    <div className="space-y-8">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/accounts')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Accounts
        </Button>

        {/* Account Actions Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700 py-1">
              <button
                onClick={() => {
                  handleEdit()
                  setShowExportMenu(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
              >
                <Edit className="h-4 w-4" />
                <span>Edit Account</span>
              </button>
              <button
                onClick={() => {
                  handleExport('csv')
                  setShowExportMenu(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Export Transactions</span>
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <button
                onClick={() => {
                  handleDeleteClick()
                  setShowExportMenu(false)
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Account</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Card Section */}
      <AccountHeroCard account={account} monthlyMetrics={currentMonthMetrics} />

      {/* Balance History Chart Section */}
      {filteredBalanceData.length > 0 && (
        <Card>
          <CardContent className="!p-6">
            <LazyBalanceHistoryChart
              data={filteredBalanceData.filter(d => d.balance !== null) as { date: string; balance: number }[]}
              currency={account.currency as Currency}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Daily Activity Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Actividad Diaria</CardTitle>
        </CardHeader>
        <CardContent className="!p-6">
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center h-[300px]">
              <LoadingSpinner />
            </div>
          ) : groupedTransactions.length > 0 ? (
            <LazyDailySpendingChart
              data={[...groupedTransactions].reverse().map(g => ({
                date: g.date,
                income: g.totalIncome,
                expense: g.totalExpense
              }))}
              currency={account.currency as Currency}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No activity for this month
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Section */}
      <div className="space-y-4">
        {/* Transaction Header */}
        <h2 className="text-lg font-semibold">Transacciones Recientes</h2>

        {/* Transactions List */}
        {isLoadingTransactions ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <LoadingSpinner />
              </div>
            </CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                No transactions for this account yet
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedTransactions.map((group) => (
              <div key={group.date}>
                <DateGroupHeader
                  date={group.date}
                  totalIncome={group.totalIncome}
                  totalExpense={group.totalExpense}
                  currency={group.currency}
                />
                <div className="space-y-0 mt-2">
                  {group.transactions.map((transaction, index, array) => {
                    // Timeline logic
                    const isFirst = index === 0
                    const isLast = index === array.length - 1

                    return (
                      <div
                        key={transaction.id}
                        className={`flex items-stretch transition-colors group ${selectedTransactionIds.has(transaction.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        {/* Selection Checkbox */}
                        <div className={`flex items-center pl-4 pr-2 transition-opacity duration-200 ${selectedTransactionIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <input
                            type="checkbox"
                            checked={selectedTransactionIds.has(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer bg-white dark:bg-gray-800"
                          />
                        </div>

                        {/* Timeline Line & Dot */}
                        <TimelineConnector
                          type={transaction.type}
                          isFirst={false} // Force continuous line like in transactions page
                          isLast={false}  // Force continuous line like in transactions page
                        />

                        {/* Transaction Content */}
                        <div className="flex-1 min-w-0 py-1 pr-4">
                          <TransactionCard
                            id={transaction.id}
                            type={transaction.type}
                            amount={Number(transaction.amount)}
                            currency={(transaction.account?.currency as Currency) || 'CLP'}
                            category={transaction.category?.name || 'Uncategorized'}
                            categoryIcon={transaction.category?.icon || undefined}
                            categoryColor={transaction.category?.color || undefined}
                            description={transaction.description}
                            payee={transaction.payee}
                            date={new Date(transaction.date)} // Fix: Wrap in new Date() to ensure valid object
                            isShared={!!transaction.sharedExpenseId}
                            onEdit={() => {
                              setEditingTransaction(transaction)
                              setIsTransactionModalOpen(true)
                            }}
                          />

                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Account Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Account"
      >
        <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
          <Input
            label="Account Name"
            error={errors.name?.message}
            {...register('name')}
          />

          <div>
            <Select
              {...register('type')}
              label="Account Type"
            >
              <option value="CASH">Cash</option>
              <option value="DEBIT">Debit Card</option>
              <option value="CREDIT">Credit Card</option>
              <option value="SAVINGS">Savings</option>
              <option value="INVESTMENT">Investment</option>
            </Select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          <Input
            label="Current Balance"
            type="number"
            step="0.01"
            error={errors.balance?.message}
            {...register('balance')}
          />

          <div>
            <Select
              {...register('currency')}
              label="Currency"
            >
              <option value="CLP">CLP - Chilean Peso</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </Select>
            {errors.currency && (
              <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>
            )}
          </div>

          <Input
            label="Account Number (optional)"
            placeholder="e.g., 1234567890"
            error={errors.accountNumber?.message}
            {...register('accountNumber')}
          />

          <ColorPicker
            label="Color (optional)"
            value={watch('color')}
            onChange={(color) => setValue('color', color)}
            error={errors.color?.message}
          />

          {selectedType === 'CREDIT' && (
            <>
              <Input
                label="Credit Limit"
                type="number"
                step="0.01"
                error={errors.creditLimit?.message}
                {...register('creditLimit')}
              />
              <Input
                label="Billing Day (1-31)"
                type="number"
                min="1"
                max="31"
                error={errors.billingDay?.message}
                {...register('billingDay')}
              />
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              {...register('isDefault')}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-card"
            />
            <label htmlFor="isDefault" className="text-sm font-medium text-foreground">
              Set as default account
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeInTotalBalance"
              {...register('includeInTotalBalance')}
              className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 bg-white dark:bg-card"
            />
            <label htmlFor="includeInTotalBalance" className="text-sm font-medium text-foreground">
              Include in total balance
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      {
        account && (
          <DeleteAccountModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            account={account}
            transactionCount={transactionCount}
            accounts={accounts}
          />
        )
      }

      {/* Transaction Form Modal */}
      {
        isTransactionModalOpen && (
          <TransactionFormModal
            isOpen={isTransactionModalOpen}
            onClose={() => {
              setIsTransactionModalOpen(false)
              setEditingTransaction(null)
            }}
            onSubmit={handleTransactionSubmit}
            accounts={accounts}
            editingTransaction={editingTransaction}
          />
        )
      }
      {/* Select All Button - Floating Bar */}
      {
        selectedTransactionIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-full px-6 py-3 z-50 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 border-r border-gray-200 dark:border-gray-700 pr-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  id="floating-select-all"
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="floating-select-all" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer whitespace-nowrap">
                  {selectedTransactionIds.size} seleccionadas
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTransactionIds(new Set())
                  setSelectAll(false)
                }}
                disabled={isBulkDeleting}
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isBulkDeleting}
                className="rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                {isBulkDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        )
      }

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        title="Eliminar transacciones"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-900 dark:text-red-200">
              ¿Estás seguro de que deseas eliminar {selectedTransactionIds.size} transacción{selectedTransactionIds.size !== 1 ? 'es' : ''}?
            </p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-2">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
              disabled={isBulkDeleting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isBulkDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>

    </div >
  )
}
