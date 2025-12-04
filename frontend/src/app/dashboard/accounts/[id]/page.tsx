'use client'

import { use, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { accountAPI, transactionAPI } from '@/lib/api'
import type { Account, Transaction } from '@/types'
import { formatCurrency, type Currency } from '@/types/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingPage, LoadingMessages, LoadingSpinner } from '@/components/ui/Loading'
import { ArrowLeft, Edit, Trash2, Wallet, CreditCard, TrendingUp } from 'lucide-react'
import { getAccountIcon } from '@/utils/accountIcons'
import { toast } from 'sonner'
import DeleteAccountModal from '@/components/DeleteAccountModal'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DateGroupHeader } from '@/components/DateGroupHeader'
import TransactionFormModal from '@/components/TransactionFormModal'
import { exportToCSV, exportToJSON, exportToExcel } from '@/lib/exportTransactions'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { SharedExpenseIndicator } from '@/components/SharedExpenseIndicator'

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
  const [activeTab, setActiveTab] = useState<TabType>('balance')
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
        setAccounts(accountsResponse.data.data.data)
      } catch (error: any) {
        console.error('Error loading account:', error)
        toast.error('Failed to load account')
        router.push('/dashboard/accounts')
        return
      } finally {
        setIsLoading(false)
      }

      // Load both balance history and transactions in parallel
      Promise.all([
        loadBalanceHistory(),
        loadTransactions()
      ])
    }

    loadInitialData()
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
      loadBalanceHistory(true),
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

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsTransactionModalOpen(true)
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      await transactionAPI.delete(transactionId)
      toast.success('Transaction deleted successfully')
      await refreshData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete transaction')
    }
  }

  const handleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactionIds)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedTransactionIds(newSelected)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTransactionIds.size} transactions?`)) return

    try {
      await transactionAPI.bulkDelete(Array.from(selectedTransactionIds))
      toast.success('Transactions deleted successfully')
      setSelectedTransactionIds(new Set())
      await refreshData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete transactions')
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
    return <LoadingPage message={LoadingMessages.accounts} />
  }

  const groupedTransactions = groupTransactionsByDate(transactions)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/accounts')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: account.color }}
            >
              {(() => {
                const IconComponent = getAccountIcon(account.type)
                return <IconComponent className="w-6 h-6 text-white" />
              })()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600 capitalize">{account.type.toLowerCase()} Account</p>
                {account.accountNumber && (
                  <>
                    <span className="text-gray-400">•</span>
                    <p className="text-sm text-gray-500">#{account.accountNumber}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteClick}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Card Grid with Color Accents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Balance Card */}
          <div
            className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-white p-2.5 shadow-sm border-l-4"
            style={{ borderLeftColor: account.color }}
          >
            <div className="flex items-start justify-between mb-1">
              <Wallet className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
              Current Balance
            </p>
            <p className="text-xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(Number(account.balance), account.currency as Currency)}
            </p>
          </div>

          {/* Credit Limit & Used cards (if CREDIT type) */}
          {account.type === 'CREDIT' && account.creditLimit && (
            <>
              <div
                className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-white p-2.5 shadow-sm border-l-4 border-blue-400"
              >
                <div className="flex items-start justify-between mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Credit Limit
                </p>
                <p className="text-xl font-bold text-gray-900 tabular-nums">
                  {formatCurrency(Number(account.creditLimit), account.currency as Currency)}
                </p>
              </div>

              <div
                className="relative overflow-hidden rounded-lg bg-gradient-to-br from-red-50 to-white p-2.5 shadow-sm border-l-4 border-red-400"
              >
                <div className="flex items-start justify-between mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                </div>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Used
                </p>
                <p className="text-xl font-bold text-red-600 tabular-nums">
                  {formatCurrency(Number(account.creditLimit) - Number(account.balance), account.currency as Currency)}
                </p>
                {/* Progress bar */}
                <div className="mt-1 w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(((Number(account.creditLimit) - Number(account.balance)) / Number(account.creditLimit) * 100), 100)}%`
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {((Number(account.creditLimit) - Number(account.balance)) / Number(account.creditLimit) * 100).toFixed(1)}% utilization
                </p>
              </div>
            </>
          )}

          {/* Currency */}
          {!(account.type === 'CREDIT' && account.creditLimit) && (
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-white p-2.5 shadow-sm border-l-4 border-gray-300">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                Currency
              </p>
              <p className="text-lg font-bold text-gray-900">{account.currency}</p>
            </div>
          )}
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('balance')}
            className={`${
              activeTab === 'balance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Saldo
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Registros
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'balance' && (
        <Card>
          <CardContent className="!p-6">
            {isLoadingChart ? (
              <div className="flex items-center justify-center h-[400px]">
                <LoadingSpinner />
              </div>
            ) : balanceHistory && balanceHistory.history.length > 0 ? (
              <div className="relative">
                {/* Comparison Badge - Top Right */}
                <div className="absolute top-0 right-8 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-gray-500">vs periodo anterior</p>
                      <p className="text-sm font-medium text-gray-700">
                        {formatCurrency(balanceHistory.previousMonthBalance, account.currency as Currency)}
                      </p>
                    </div>
                    <div className={`flex items-center gap-1 ${balanceHistory.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {balanceHistory.percentageChange >= 0 ? '↗' : '↘'}
                      <span className="text-lg font-semibold">
                        {balanceHistory.percentageChange >= 0 ? '+' : ''}{balanceHistory.percentageChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={filteredBalanceData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getDate()}/${date.getMonth() + 1}`
                    }}
                  />
                  <YAxis
                    width={80}
                    tickFormatter={(value) => {
                      // Format to shorter display (K for thousands, M for millions)
                      const absValue = Math.abs(value)
                      if (absValue >= 1000000) {
                        return `${account.currency === 'CLP' ? '$' : ''}${(value / 1000000).toFixed(1)}M`
                      } else if (absValue >= 1000) {
                        return `${account.currency === 'CLP' ? '$' : ''}${(value / 1000).toFixed(0)}K`
                      }
                      return formatCurrency(value, account.currency as Currency)
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value, account.currency as Currency)}
                    labelFormatter={(label) => {
                      const date = new Date(label)
                      return date.toLocaleDateString()
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                No data available for this month
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          {/* Transaction Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedTransactionIds.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete Selected ({selectedTransactionIds.size})
                </Button>
              )}
            </div>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={() => handleExport('csv')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Export as Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

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
                <div className="text-center text-gray-500">
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
                  <div className="space-y-2 mt-2">
                    {group.transactions.map((transaction) => (
                      <Card
                        key={transaction.id}
                        className={`transition-colors ${selectedTransactionIds.has(transaction.id) ? 'bg-blue-50 border-blue-300' : ''}`}
                      >
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between">
                            {/* Left Section: Checkbox + Category Icon + Details */}
                            <div className="flex items-start gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedTransactionIds.has(transaction.id)}
                                onChange={() => handleSelectTransaction(transaction.id)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1"
                              />

                              {/* Category Circle Icon */}
                              <div
                                className="flex items-center justify-center w-10 h-10 rounded-full text-lg flex-shrink-0"
                                style={{
                                  backgroundColor: transaction.category?.color || '#E5E7EB',
                                  color: transaction.category?.icon ? 'inherit' : 'transparent'
                                }}
                              >
                                {transaction.category?.icon || '📌'}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <p className="font-semibold text-gray-900">
                                    {transaction.category?.name || 'Uncategorized'}
                                  </p>
                                </div>

                                {transaction.description && (
                                  <p className="text-sm text-gray-600 truncate">{transaction.description}</p>
                                )}

                                {/* Shared Expense Indicator - unified display */}
                                <SharedExpenseIndicator transaction={transaction} variant="compact" className="mt-2" />

                                {/* Show payee only for non-shared transactions (shared ones show it in the indicator) */}
                                {!transaction.sharedExpenseId && transaction.payee && (
                                  <p className="text-xs text-gray-500 mt-1">→ {transaction.payee}</p>
                                )}

                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <span>{transaction.account?.name}</span>
                                  {transaction.toAccount && (
                                    <>
                                      <span>→</span>
                                      <span>{transaction.toAccount.name}</span>
                                    </>
                                  )}
                                </div>

                                {transaction.tags && transaction.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {transaction.tags.map((t) => (
                                      <span
                                        key={t.id}
                                        className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                                      >
                                        {t.tag.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right Section: Amount + Actions */}
                            <div className="flex flex-col items-end gap-3 ml-4">
                              <div className="text-right">
                                <p
                                  className={`text-lg font-bold ${
                                    transaction.type === 'INCOME' ? 'text-green-600' :
                                    transaction.type === 'EXPENSE' ? 'text-red-600' :
                                    'text-blue-600'
                                  }`}
                                >
                                  {transaction.type === 'EXPENSE' && '-'}
                                  {transaction.type === 'INCOME' && '+'}
                                  {formatCurrency(
                                    Number(transaction.amount),
                                    transaction.account?.currency as Currency || account.currency as Currency
                                  )}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEditTransaction(transaction)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CASH">Cash</option>
              <option value="DEBIT">Debit Card</option>
              <option value="CREDIT">Credit Card</option>
              <option value="SAVINGS">Savings</option>
              <option value="INVESTMENT">Investment</option>
            </select>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              {...register('currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CLP">CLP - Chilean Peso</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
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
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
              Set as default account
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeInTotalBalance"
              {...register('includeInTotalBalance')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeInTotalBalance" className="text-sm font-medium text-gray-700">
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
      {account && (
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          account={account}
          transactionCount={transactionCount}
          accounts={accounts}
        />
      )}

      {/* Transaction Form Modal */}
      {isTransactionModalOpen && (
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
      )}
    </div>
  )
}
