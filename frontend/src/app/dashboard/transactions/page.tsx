'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Transaction, Account, TransactionType, CreateTransactionForm, MergedCategory } from '@/types'
import { transactionAPI, accountAPI, categoryAPI, sharedExpenseAPI } from '@/lib/api'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import CategorySelector from '@/components/CategorySelector'
import TagSelector from '@/components/TagSelector'
import SharedExpenseForm, { SharedExpenseData } from '@/components/SharedExpenseForm'
import PayeeAutocomplete from '@/components/PayeeAutocomplete'
import TransactionFiltersComponent, { TransactionFilters } from '@/components/TransactionFilters'
import { formatCurrency } from '@/lib/utils'
import { exportToCSV, exportToJSON, exportToExcel } from '@/lib/exportTransactions'
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge'
import { LoadingPage, LoadingOverlay, LoadingSpinner, LoadingMessages } from '@/components/ui/Loading'
import { SharedExpenseIndicator } from '@/components/SharedExpenseIndicator'
import { DateGroupHeader } from '@/components/DateGroupHeader'
import { useAuthStore } from '@/store/authStore'
import { GroupedVirtuoso } from 'react-virtuoso'

const transactionSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']),
  amount: z.coerce.number().positive('Amount must be positive'),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  payee: z.string().optional(),
  payer: z.string().optional(),
  toAccountId: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // If type is TRANSFER, toAccountId is required
    if (data.type === 'TRANSFER') {
      return data.toAccountId && data.toAccountId.length > 0
    }
    return true
  },
  {
    message: 'Destination account is required for transfers',
    path: ['toAccountId'],
  }
)

type TransactionFormData = z.infer<typeof transactionSchema>

// Helper function to group transactions by date
const groupTransactionsByDate = (transactions: Transaction[]) => {
  const groups = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(transaction)
    return acc
  }, {} as Record<string, Transaction[]>)

  return Object.entries(groups).map(([date, txs]) => {
    const totalIncome = txs
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpense = txs
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      date,
      transactions: txs,
      totalIncome,
      totalExpense,
      currency: txs[0]?.account?.currency || 'CLP'
    }
  })
}

export default function TransactionsPage() {
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<MergedCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshingList, setIsRefreshingList] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isSharedExpense, setIsSharedExpense] = useState(false)
  const [sharedExpenseData, setSharedExpenseData] = useState<SharedExpenseData | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formattedAmount, setFormattedAmount] = useState('')
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [totalPages, setTotalPages] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)


  // Month/Year selector
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Filters
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: 'ALL',
    accountId: '',
    categoryId: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc',
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      tags: [],
    },
  })

  const selectedType = watch('type')
  const selectedAccountId = watch('accountId')
  const selectedTags = watch('tags') || []
  const selectedAmount = watch('amount') || 0
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        await Promise.all([loadTransactions(), loadAccounts(), loadCategories()])
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
    // Set initial date filters to current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    setFilters((prev) => ({
      ...prev,
      startDate: firstDay,
      endDate: lastDay,
    }))
  }, [])

  useEffect(() => {
    loadTransactions(1) // Reset to page 1 when filters change
  }, [filters])

  useEffect(() => {
    if (currentPage > 0) {
      loadTransactions(currentPage) // Reload current page when items per page changes
    }
  }, [itemsPerPage])

  // Grouped data memoization needed for Virtuoso
  const { groupedTransactions, groupCounts, flatTransactions } = useMemo(() => {
    const groups = groupTransactionsByDate(transactions)
    const counts = groups.map(g => g.transactions.length)
    const flat = groups.flatMap(g => g.transactions)
    return { groupedTransactions: groups, groupCounts: counts, flatTransactions: flat }
  }, [transactions])

  const loadTransactions = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsRefreshingList(true)
      }

      const response = await transactionAPI.getAll({
        page,
        limit: itemsPerPage,
        search: filters.search || undefined,
        type: filters.type !== 'ALL' ? filters.type : undefined,
        accountId: filters.accountId || undefined,
        categoryId: filters.categoryId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
        sortBy: (filters.sortBy as any) || undefined,
        sortOrder: (filters.sortOrder as any) || undefined,
      })

      const newTransactions = response.data.data.data || []

      if (append) {
        setTransactions(prev => [...prev, ...newTransactions])
      } else {
        setTransactions(newTransactions)
      }

      setTotalPages(response.data.data.totalPages || 0)
      setTotalRecords(response.data.data.total || 0)
      setHasMore(response.data.data.hasMore || false)
      setCurrentPage(page)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load transactions')
      if (!append) {
        setTransactions([])
        setTotalPages(0)
        setTotalRecords(0)
        setHasMore(false)
      }
    } finally {
      setIsRefreshingList(false)
      setIsLoadingMore(false)
    }
  }

  const loadAccounts = async () => {
    try {
      const response = await accountAPI.getAll()
      // Handle flexible response format (array or paginated structure)
      const accountsData = response.data as any
      setAccounts(Array.isArray(accountsData) ? accountsData : accountsData.data)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await categoryAPI.getAll()
      setCategories(response.data.data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const onSubmit = async (data: TransactionFormData) => {
    if (isSaving) return // Prevent multiple submissions

    try {
      setIsSaving(true)

      let sharedExpenseId: string | undefined = undefined

      // If this is a shared expense for a NEW transaction, create the shared expense first
      if (isSharedExpense && sharedExpenseData && !editingTransaction) {
        const sharedExpensePayload = {
          transactionId: '', // Will be updated after transaction creation
          groupId: sharedExpenseData.groupId,
          paidByUserId: sharedExpenseData.paidByUserId, // Include who paid
          amount: data.amount,
          description: data.description || 'Shared expense',
          splitType: sharedExpenseData.splitType,
          participants: sharedExpenseData.participants.map(p => ({
            userId: p.userId,
            amountOwed: p.amountOwed,
            percentage: sharedExpenseData.splitType === 'PERCENTAGE' ? p.percentage : undefined,
            shares: sharedExpenseData.splitType === 'SHARES' ? p.shares : undefined,
          })),
        }

        const sharedExpenseResponse = await sharedExpenseAPI.create(sharedExpensePayload)
        sharedExpenseId = sharedExpenseResponse.data.data.id

        // Only create a Transaction if the current user is the one who paid
        // If someone else paid, the Transaction should only be created when marking as "paid"
        const currentUserId = user?.id
        if (sharedExpenseData.paidByUserId === currentUserId) {
          // Current user paid - create the transaction to affect their balance
          const payload: CreateTransactionForm = {
            ...data,
            date: data.date || new Date().toISOString(),
            sharedExpenseId: sharedExpenseId
          }
          await transactionAPI.create(payload)
          toast.success('Shared expense created successfully')
        } else {
          // Someone else paid - don't create transaction yet
          // Balance will be affected when marking as "paid"
          toast.success('Shared expense created successfully. Mark as paid when you settle your portion.')
        }

        loadTransactions()
        setIsModalOpen(false)
        reset()
        setEditingTransaction(null)
        setIsSharedExpense(false)
        setSharedExpenseData(null)
        return // Exit early to avoid creating duplicate transaction
      }

      // Build payload with explicit sharedExpenseId handling
      const payload: CreateTransactionForm = {
        ...data,
        date: data.date || new Date().toISOString(),
      }

      // Handle sharedExpenseId explicitly
      if (isSharedExpense && sharedExpenseId) {
        // New shared expense created
        payload.sharedExpenseId = sharedExpenseId
      } else if (isSharedExpense && editingTransaction?.sharedExpenseId) {
        // Existing shared expense being kept
        payload.sharedExpenseId = editingTransaction.sharedExpenseId
      } else if (!isSharedExpense && editingTransaction?.sharedExpenseId) {
        // User is removing shared expense from transaction
        payload.sharedExpenseId = null as any
      }
      // If not shared expense and no previous shared expense, don't include field

      if (editingTransaction) {
        // If editing a shared expense, update the shared expense as well
        if (isSharedExpense && sharedExpenseData && editingTransaction.sharedExpenseId) {
          const sharedExpensePayload = {
            amount: data.amount,
            description: data.description || 'Shared expense',
            splitType: sharedExpenseData.splitType,
            participants: sharedExpenseData.participants.map(p => ({
              userId: p.userId,
              amountOwed: p.amountOwed,
              percentage: sharedExpenseData.splitType === 'PERCENTAGE' ? p.percentage : undefined,
              shares: sharedExpenseData.splitType === 'SHARES' ? p.shares : undefined,
            })),
            paidByUserId: sharedExpenseData.paidByUserId,
          }

          await sharedExpenseAPI.update(editingTransaction.sharedExpenseId, sharedExpensePayload)
        } else if (isSharedExpense && sharedExpenseData && !editingTransaction.sharedExpenseId) {
          // Converting normal transaction to shared expense
          const sharedExpensePayload = {
            transactionId: editingTransaction.id,
            groupId: sharedExpenseData.groupId,
            paidByUserId: sharedExpenseData.paidByUserId,
            amount: data.amount,
            description: data.description || 'Shared expense',
            splitType: sharedExpenseData.splitType,
            participants: sharedExpenseData.participants.map(p => ({
              userId: p.userId,
              amountOwed: p.amountOwed,
              percentage: sharedExpenseData.splitType === 'PERCENTAGE' ? p.percentage : undefined,
              shares: sharedExpenseData.splitType === 'SHARES' ? p.shares : undefined,
            })),
          }

          const sharedExpenseResponse = await sharedExpenseAPI.create(sharedExpensePayload)
          payload.sharedExpenseId = sharedExpenseResponse.data.data.id
        }

        await transactionAPI.update(editingTransaction.id, payload)
        toast.success('Transaction updated successfully')
      } else {
        await transactionAPI.create(payload)
        toast.success('Transaction created successfully')
      }

      loadTransactions()
      setIsModalOpen(false)
      reset()
      setEditingTransaction(null)
      setIsSharedExpense(false)
      setSharedExpenseData(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save transaction')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      await transactionAPI.delete(id)
      toast.success('Transaction deleted successfully')
      loadTransactions()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete transaction')
    }
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
      const result = await transactionAPI.bulkDelete(transactionIds)
      toast.success(result.data.data.message)
      loadTransactions()
      setSelectedTransactionIds(new Set())
      setSelectAll(false)
      setShowBulkDeleteConfirm(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete transactions')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleEdit = async (transaction: Transaction) => {
    setEditingTransaction(transaction)
    const amount = Number(transaction.amount)
    reset({
      accountId: transaction.accountId,
      type: transaction.type,
      amount: amount,
      categoryId: transaction.categoryId || undefined,
      description: transaction.description || '',
      date: transaction.date ? new Date(transaction.date).toISOString().slice(0, 16) : '',
      payee: transaction.payee || '',
      payer: transaction.payer || '',
      toAccountId: transaction.toAccountId || undefined,
      tags: transaction.tags?.map((t) => t.tagId) || [],
    })
    setFormattedAmount(formatAmountDisplay(amount, transaction.account?.currency || 'CLP'))

    // If this is a shared expense, load the shared expense data BEFORE opening modal
    if (transaction.sharedExpenseId) {
      try {
        const response = await sharedExpenseAPI.getById(transaction.sharedExpenseId)
        const sharedExpense = response.data.data
        setSharedExpenseData({
          groupId: sharedExpense.groupId,
          paidByUserId: sharedExpense.paidByUserId,
          splitType: sharedExpense.splitType,
          participants: sharedExpense.participants.map(p => ({
            userId: p.userId,
            userName: p.user.name,
            amountOwed: p.amountOwed,
            percentage: p.percentage,
            shares: p.shares,
          })),
        })
        setIsSharedExpense(true)
        setIsModalOpen(true)
      } catch (error: any) {
        toast.error('Failed to load shared expense details')
        setIsSharedExpense(false)
        setSharedExpenseData(null)
        setIsModalOpen(true)
      }
    } else {
      setIsSharedExpense(false)
      setSharedExpenseData(null)
      setIsModalOpen(true)
    }
  }

  const handleAddNew = () => {
    setEditingTransaction(null)
    setIsSharedExpense(false)
    setSharedExpenseData(null)
    setFormattedAmount('')
    reset({
      type: 'EXPENSE',
      tags: [],
    })
    setIsModalOpen(true)
  }

  const getAvailableToAccounts = () => {
    if (!selectedAccountId) return []
    const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
    if (!selectedAccount) return []

    // Only show accounts with the same currency
    return accounts.filter(
      (a) => a.id !== selectedAccountId && a.currency === selectedAccount.currency
    )
  }

  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'EXPENSE':
        return 'text-red-600'
      case 'INCOME':
        return 'text-green-600'
      case 'TRANSFER':
        return 'text-blue-600'
    }
  }

  const formatAmountDisplay = (value: string | number, currency: string): string => {
    if (!value) return ''
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
    if (isNaN(numValue)) return ''

    // Format based on currency
    if (currency === 'CLP') {
      // CLP doesn't use decimals typically
      return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue)
    } else {
      // USD and EUR use decimals
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '') // Remove commas for parsing

    // Allow empty or just a dot
    if (rawValue === '' || rawValue === '.') {
      setFormattedAmount(rawValue)
      setValue('amount', 0)
      return
    }

    // Allow valid numbers with optional decimal
    const numValue = parseFloat(rawValue)
    if (!isNaN(numValue) && numValue >= 0) {
      setFormattedAmount(rawValue) // Keep raw input while typing
      setValue('amount', numValue)
    }
  }

  const handleAmountBlur = () => {
    const amount = watch('amount')
    if (amount && amount > 0 && selectedAccount) {
      setFormattedAmount(formatAmountDisplay(amount, selectedAccount.currency))
    } else if (!amount || amount === 0) {
      setFormattedAmount('')
    }
  }

  const handleAmountFocus = () => {
    const amount = watch('amount')
    if (amount && amount > 0) {
      setFormattedAmount(amount.toString())
    } else {
      setFormattedAmount('')
    }
  }

  const getTransactionTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'EXPENSE':
        return '↓'
      case 'INCOME':
        return '↑'
      case 'TRANSFER':
        return '→'
    }
  }


  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `transactions_${timestamp}`

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

  const updateMonthFilter = (month: number, year: number) => {
    setSelectedMonth(month)
    setSelectedYear(year)
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0]
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0]
    setFilters((prev) => ({
      ...prev,
      startDate: firstDay,
      endDate: lastDay,
    }))
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  if (isLoading) {
    return <LoadingPage message={LoadingMessages.transactions} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">
            {totalRecords} transactions
          </p>
        </div>
        <div className="flex gap-3">
          {/* Export Menu */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={transactions.length === 0}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>📄</span> Export as CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>📋</span> Export as JSON
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>📊</span> Export as Excel
                </button>
              </div>
            )}
          </div>
          <Button onClick={handleAddNew}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Transaction
          </Button>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="flex items-center justify-center gap-4 bg-white rounded-lg border border-gray-200 p-4">
        <button
          onClick={() => {
            const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
            const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear
            updateMonthFilter(newMonth, newYear)
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => {
              const month = parseInt(e.target.value)
              updateMonthFilter(month, selectedYear)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
          >
            {monthNames.map((month, index) => (
              <option key={index} value={index}>
                {month}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => {
              const year = parseInt(e.target.value)
              updateMonthFilter(selectedMonth, year)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
          >
            {[...Array(10)].map((_, i) => {
              const year = new Date().getFullYear() - 5 + i
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              )
            })}
          </select>
        </div>

        <button
          onClick={() => {
            const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1
            const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear
            updateMonthFilter(newMonth, newYear)
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Filters */}
      <TransactionFiltersComponent
        filters={filters}
        onFilterChange={setFilters}
        accounts={accounts}
        categories={categories}
      />

      {/* Select All Button */}
      {transactions.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <button
              onClick={handleSelectAll}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {selectAll ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </button>
            {selectedTransactionIds.size > 0 && (
              <span className="text-sm text-gray-500">
                ({selectedTransactionIds.size} de {transactions.length} seleccionadas)
              </span>
            )}
          </div>
          {selectedTransactionIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTransactionIds(new Set())
                  setSelectAll(false)
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isBulkDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isBulkDeleting ? LoadingMessages.deleting : 'Eliminar'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Bulk Delete Action Bar */}
      {selectedTransactionIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900">
                {selectedTransactionIds.size} transaction{selectedTransactionIds.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTransactionIds(new Set())
                  setSelectAll(false)
                }}
                disabled={isBulkDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={isBulkDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isBulkDeleting ? LoadingMessages.deleting : 'Delete Selected'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List - Grouped by Date */}
      <div className={`space-y-6 ${selectedTransactionIds.size > 0 ? 'pb-32' : ''} h-[calc(100vh-200px)]`}>
        {isRefreshingList && (
          <LoadingOverlay message={LoadingMessages.transactions} />
        )}
        {transactions.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                No transactions found.
              </p>
            </CardContent>
          </Card>
        ) : (
          <GroupedVirtuoso
            useWindowScroll
            groupCounts={groupCounts}
            groupContent={(index) => {
              const group = groupedTransactions[index]
              return (
                <div className="pt-6 pb-2 bg-gray-50/95 backdrop-blur z-10 sticky top-0">
                  <DateGroupHeader
                    date={group.date}
                    totalIncome={group.totalIncome}
                    totalExpense={group.totalExpense}
                    currency={group.currency}
                  />
                </div>
              )
            }}
            itemContent={(index) => {
              const transaction = flatTransactions[index];
              if (!transaction) return null;

              return (
                <div className="pb-2">
                  <Card className={`transition-colors ${selectedTransactionIds.has(transaction.id) ? 'bg-blue-50 border-blue-300' : ''}`}>
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

                        {/* Right Section: Amount + Date + Actions */}
                        <div className="flex flex-col items-end gap-3 ml-4">
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${getTransactionTypeColor(
                                transaction.type
                              )}`}
                            >
                              {transaction.type === 'EXPENSE' && '-'}
                              {transaction.type === 'INCOME' && '+'}
                              {formatCurrency(
                                Number(transaction.amount),
                                transaction.account?.currency || 'CLP'
                              )}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(transaction)}>
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(transaction.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            }}
            endReached={() => {
              if (hasMore && !isLoadingMore && !isRefreshingList) {
                loadTransactions(currentPage + 1, true)
              }
            }}
            components={{
              Footer: () => (
                isLoadingMore ? (
                  <div className="flex justify-center py-8">
                    <div className="flex items-center gap-2 text-gray-500">
                      <LoadingSpinner size="sm" />
                      <span className="text-sm">Cargando más transacciones...</span>
                    </div>
                  </div>
                ) : null
              )
            }}
          />
        )}
      </div>


      {/* End of list indicator */}
      {!hasMore && transactions.length > 0 && (
        <div className="text-center py-6 text-sm text-gray-500">
          Has llegado al final de la lista
        </div>
      )}

      {/* Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTransaction(null)
          setIsSharedExpense(false)
          setSharedExpenseData(null)
          reset()
        }}
        title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Transaction Type - Tabs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setValue('type', 'EXPENSE')}
                className={`py-3 px-4 rounded-md text-sm font-medium transition-all ${selectedType === 'EXPENSE'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>Expense</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'INCOME')}
                className={`py-3 px-4 rounded-md text-sm font-medium transition-all ${selectedType === 'INCOME'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span>Income</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'TRANSFER')}
                className={`py-3 px-4 rounded-md text-sm font-medium transition-all ${selectedType === 'TRANSFER'
                  ? 'bg-blue-400 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Transfer</span>
                </div>
              </button>
            </div>
            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account <span className="text-red-500">*</span>
            </label>
            <select
              {...register('accountId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>
            )}
          </div>

          {/* To Account (for transfers) */}
          {selectedType === 'TRANSFER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Account <span className="text-red-500">*</span>
              </label>
              <select
                {...register('toAccountId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select destination account...</option>
                {getAvailableToAccounts().map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
              {errors.toAccountId && (
                <p className="text-red-500 text-sm mt-1">{errors.toAccountId.message}</p>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                {selectedAccount
                  ? selectedAccount.currency === 'CLP'
                    ? '$'
                    : selectedAccount.currency === 'USD'
                      ? 'US$'
                      : '€'
                  : '$'}
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                value={formattedAmount}
                onChange={handleAmountChange}
                onFocus={handleAmountFocus}
                onBlur={handleAmountBlur}
                required
              />
            </div>
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
          </div>

          {/* Category */}
          <CategorySelector
            value={watch('categoryId')}
            onChange={(categoryId) => setValue('categoryId', categoryId)}
            type={selectedType}
            error={errors.categoryId?.message}
          />

          {/* Payee (quien recibe el pago) */}
          {selectedType !== 'TRANSFER' && (
            <PayeeAutocomplete
              label="Payee (Who received the payment)"
              value={watch('payee') || ''}
              onChange={(value) => setValue('payee', value)}
              error={errors.payee?.message}
              placeholder="e.g., McDonald's, Uber, Enel"
            />
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add details about this transaction..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Date */}
          <Input
            label="Date & Time"
            type="datetime-local"
            error={errors.date?.message}
            {...register('date')}
          />

          {/* Tags */}
          <TagSelector
            value={selectedTags}
            onChange={(tags) => setValue('tags', tags)}
            error={errors.tags?.message}
          />

          {/* Shared Expense */}
          {selectedType === 'EXPENSE' && (
            <SharedExpenseForm
              enabled={isSharedExpense}
              onToggle={setIsSharedExpense}
              totalAmount={selectedAmount}
              currency={selectedAccount?.currency || 'CLP'}
              onChange={setSharedExpenseData}
              initialData={sharedExpenseData || undefined}
            />
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner size="sm" className="text-current" />
                  {LoadingMessages.saving}
                </span>
              ) : (
                <span>{editingTransaction ? 'Update Transaction' : 'Create Transaction'}</span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                setEditingTransaction(null)
                setIsSharedExpense(false)
                setSharedExpenseData(null)
                reset()
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        title="Delete Transactions"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900">
              Are you sure you want to delete {selectedTransactionIds.size} transaction{selectedTransactionIds.size !== 1 ? 's' : ''}?
            </p>
            <p className="text-xs text-red-700 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
              disabled={isBulkDeleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isBulkDeleting ? LoadingMessages.deleting : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
