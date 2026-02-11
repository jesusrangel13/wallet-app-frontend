'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { Transaction, Account, TransactionType, CreateTransactionForm, MergedCategory } from '@/types'
import { transactionAPI, accountAPI, categoryAPI, sharedExpenseAPI } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import TransactionFormModal, { TransactionFormData } from '@/components/TransactionFormModal'
import { SharedExpenseData } from '@/components/SharedExpenseForm'
import TransactionFiltersComponent, { TransactionFilters } from '@/components/TransactionFilters'
import { exportToCSV, exportToJSON, exportToExcel } from '@/lib/exportTransactions'
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge'
import { LoadingSpinner } from '@/components/ui/Loading'
import { SharedExpenseIndicator } from '@/components/SharedExpenseIndicator'
import { DateGroupHeader } from '@/components/DateGroupHeader'
import { useAuthStore } from '@/store/authStore'
import { GroupedVirtuoso } from 'react-virtuoso'
import { TransactionsPageSkeleton } from '@/components/ui/PageSkeletons'
import { LoadingBar } from '@/components/ui/LoadingBar'
import { TransactionListSkeleton } from '@/components/ui/TransactionListSkeleton'
import { PageTransition } from '@/components/ui/animations'
import { TrendingUp } from 'lucide-react'
import { TransactionCard } from '@/components/transactions/TransactionCard'
import { TimelineConnector, TimelineVariant } from '@/components/transactions/TimelineConnector'
import { TimelineStyleSelector } from '@/components/transactions/TimelineStyleSelector'
import { MonthSelectorVariants, SelectorVariant } from '@/components/transactions/MonthSelectorVariants'
import { EmptyState } from '@/components/ui/EmptyState'
import { PullToRefresh } from '@/components/PullToRefresh'

// Chart removed by user request

// transactionSchema and TransactionFormData moved to TransactionFormModal

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
  const queryClient = useQueryClient()
  const t = useTranslations('transactions')
  const tCommon = useTranslations('common')
  const tLoading = useTranslations('loading')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<MergedCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshingList, setIsRefreshingList] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [sharedExpenseData, setSharedExpenseData] = useState<SharedExpenseData | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
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
  const [scrollToTransactionId, setScrollToTransactionId] = useState<string | null>(null)

  // Ref for Virtuoso to control scrolling
  const virtuosoRef = useRef<any>(null)

  // Month/Year selector
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Derived date for the new selector component
  const currentDate = new Date(selectedYear, selectedMonth, 1)

  const handleDateChange = (date: Date) => {
    updateMonthFilter(date.getMonth(), date.getFullYear())
  }

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

  // Use ref to avoid recreating loadTransactions on every filter change
  const filtersRef = useRef(filters)
  const itemsPerPageRef = useRef(itemsPerPage)

  useEffect(() => {
    filtersRef.current = filters
  }, [filters])

  useEffect(() => {
    itemsPerPageRef.current = itemsPerPage
  }, [itemsPerPage])

  const loadTransactions = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsRefreshingList(true)
      }

      const currentFilters = filtersRef.current
      const currentItemsPerPage = itemsPerPageRef.current

      const response = await transactionAPI.getAll({
        page,
        limit: currentItemsPerPage,
        search: currentFilters.search || undefined,
        type: currentFilters.type !== 'ALL' ? currentFilters.type : undefined,
        accountId: currentFilters.accountId || undefined,
        categoryId: currentFilters.categoryId || undefined,
        startDate: currentFilters.startDate || undefined,
        endDate: currentFilters.endDate || undefined,
        minAmount: currentFilters.minAmount ? Number(currentFilters.minAmount) : undefined,
        maxAmount: currentFilters.maxAmount ? Number(currentFilters.maxAmount) : undefined,
        sortBy: (currentFilters.sortBy as any) || undefined,
        sortOrder: (currentFilters.sortOrder as any) || undefined,
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
  }, []) // No dependencies - stable function

  // Reload all pages up to currentPage to refresh data while maintaining scroll position
  const reloadCurrentPages = useCallback(async (scrollToId?: string) => {
    try {
      setIsRefreshingList(true)

      const currentFilters = filtersRef.current
      const currentItemsPerPage = itemsPerPageRef.current
      const pagesToLoad = currentPage

      // Load all pages from 1 to currentPage
      const allTransactions: any[] = []
      let lastHasMore = false
      let lastTotalPages = 0
      let lastTotalRecords = 0

      for (let page = 1; page <= pagesToLoad; page++) {
        const response = await transactionAPI.getAll({
          page,
          limit: currentItemsPerPage,
          search: currentFilters.search || undefined,
          type: currentFilters.type !== 'ALL' ? currentFilters.type : undefined,
          accountId: currentFilters.accountId || undefined,
          categoryId: currentFilters.categoryId || undefined,
          startDate: currentFilters.startDate || undefined,
          endDate: currentFilters.endDate || undefined,
          minAmount: currentFilters.minAmount ? Number(currentFilters.minAmount) : undefined,
          maxAmount: currentFilters.maxAmount ? Number(currentFilters.maxAmount) : undefined,
          sortBy: (currentFilters.sortBy as any) || undefined,
          sortOrder: (currentFilters.sortOrder as any) || undefined,
        })

        const pageTransactions = response.data.data.data || []
        allTransactions.push(...pageTransactions)

        lastHasMore = response.data.data.hasMore || false
        lastTotalPages = response.data.data.totalPages || 0
        lastTotalRecords = response.data.data.total || 0
      }

      setTransactions(allTransactions)
      setTotalPages(lastTotalPages)
      setTotalRecords(lastTotalRecords)
      setHasMore(lastHasMore)

      // Set scroll target if provided
      if (scrollToId) {
        setScrollToTransactionId(scrollToId)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reload transactions')
    } finally {
      setIsRefreshingList(false)
    }
  }, [currentPage])

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    await loadTransactions(1)
    await queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    await queryClient.invalidateQueries({ queryKey: ['account-balances'] })
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true)
        // Set initial date filters to current month FIRST
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
        setFilters((prev) => ({
          ...prev,
          startDate: firstDay,
          endDate: lastDay,
        }))

        await Promise.all([loadAccounts(), loadCategories()])
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run only once on mount

  useEffect(() => {
    // Only load transactions when filters actually change (not on initial mount with empty filters)
    if (filters.startDate && filters.endDate) {
      loadTransactions(1) // Reset to page 1 when filters change
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.type, filters.accountId, filters.categoryId, filters.startDate, filters.endDate, filters.minAmount, filters.maxAmount, filters.sortBy, filters.sortOrder])

  useEffect(() => {
    // Reload when items per page changes
    if (filters.startDate && filters.endDate) {
      loadTransactions(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage])

  // Grouped data memoization needed for Virtuoso
  const { groupedTransactions, groupCounts, flatTransactions } = useMemo(() => {
    const groups = groupTransactionsByDate(transactions)
    const counts = groups.map(g => g.transactions.length)
    const flat = groups.flatMap(g => g.transactions)
    return { groupedTransactions: groups, groupCounts: counts, flatTransactions: flat }
  }, [transactions])

  // Effect to scroll to a specific transaction after data is loaded
  useEffect(() => {
    if (scrollToTransactionId && transactions.length > 0 && virtuosoRef.current) {
      // Find the index of the transaction in the flat list
      const transactionIndex = flatTransactions.findIndex(t => t.id === scrollToTransactionId)

      if (transactionIndex !== -1) {
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          virtuosoRef.current?.scrollToIndex({
            index: transactionIndex,
            align: 'center',
            behavior: 'smooth'
          })

          // Clear the scroll target after scrolling
          setTimeout(() => setScrollToTransactionId(null), 1000)
        }, 100)
      } else {
        // Transaction not found, clear the scroll target
        setScrollToTransactionId(null)
      }
    }
  }, [scrollToTransactionId, transactions, flatTransactions])

  const loadAccounts = useCallback(async () => {
    try {
      const response = await accountAPI.getAll()
      // Handle flexible response format (array or paginated structure)
      const accountsData = response.data as any
      setAccounts(Array.isArray(accountsData) ? accountsData : accountsData.data)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    try {
      const response = await categoryAPI.getAll()
      setCategories(response.data.data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }, [])

  const onSubmit = async (data: TransactionFormData, sharedData?: SharedExpenseData | null) => {
    try {
      let sharedExpenseId: string | undefined = undefined

      // If this is a shared expense for a NEW transaction, create the shared expense first
      if (sharedData && !editingTransaction) {
        const sharedExpensePayload = {
          transactionId: '', // Will be updated after transaction creation
          groupId: sharedData.groupId,
          paidByUserId: sharedData.paidByUserId, // Include who paid
          amount: data.amount,
          description: data.description || 'Shared expense',
          categoryId: data.categoryId, // Fix: Inherit category from transaction
          date: data.date || new Date().toISOString(), // Use transaction date
          splitType: sharedData.splitType,
          participants: sharedData.participants.map((p: any) => ({
            userId: p.userId,
            amountOwed: Number(p.amountOwed),
            percentage: sharedData.splitType === 'PERCENTAGE' && p.percentage != null ? Number(p.percentage) : undefined,
            shares: sharedData.splitType === 'SHARES' && p.shares != null ? Number(p.shares) : undefined,
          })),
        }

        const sharedExpenseResponse = await sharedExpenseAPI.create(sharedExpensePayload)
        sharedExpenseId = sharedExpenseResponse.data.data.id

        // Only create a Transaction if the current user is the one who paid
        // If someone else paid, the Transaction should only be created when marking as "paid"
        const currentUserId = user?.id
        if (sharedData.paidByUserId === currentUserId) {
          // Current user paid - create the transaction to affect their balance
          const payload: CreateTransactionForm = {
            ...data,
            date: data.date || new Date().toISOString(),
            sharedExpenseId: sharedExpenseId
          }
          await transactionAPI.create(payload)
          // Invalidate dashboard and account caches to force refresh
          queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
          queryClient.invalidateQueries({ queryKey: ['account-balances'] })
          // toast.success('Shared expense created successfully') - Modal handles success UI
        } else {
          // Someone else paid - don't create transaction yet
          toast.success('Shared expense created successfully. Mark as paid when you settle your portion.')
        }

        loadTransactions(1) // Reset to page 1 to properly reset pagination state
        return // Exit early
      }

      // Build payload with explicit sharedExpenseId handling
      // Sanitize payload to remove extra fields like sharedGroup or notes
      const payload: CreateTransactionForm = {
        accountId: data.accountId!, // Validated by schema
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        description: data.description,
        payee: data.payee,
        payer: data.payer,
        toAccountId: data.toAccountId,
        tags: data.tags,
        date: data.date || new Date().toISOString(),
        // sharedExpenseId will be handled below
      }

      // Handle sharedExpenseId explicitly
      if (sharedExpenseId) {
        // New shared expense created
        payload.sharedExpenseId = sharedExpenseId
      } else if (sharedData && editingTransaction?.sharedExpenseId) {
        // Existing shared expense being kept
        payload.sharedExpenseId = editingTransaction.sharedExpenseId
      } else if (!sharedData && editingTransaction?.sharedExpenseId) {
        // User is removing shared expense from transaction
        payload.sharedExpenseId = null as any
      }

      if (editingTransaction) {
        // If editing a shared expense, update the shared expense as well
        if (sharedData && editingTransaction.sharedExpenseId) {
          const sharedExpensePayload = {
            amount: data.amount,
            description: data.description || 'Shared expense',
            categoryId: data.categoryId, // Fix: Update category
            date: data.date || new Date().toISOString(), // Use transaction date
            splitType: sharedData.splitType,
            participants: sharedData.participants.map((p: any) => ({
              userId: p.userId,
              amountOwed: Number(p.amountOwed),
              percentage: sharedData.splitType === 'PERCENTAGE' && p.percentage != null ? Number(p.percentage) : undefined,
              shares: sharedData.splitType === 'SHARES' && p.shares != null ? Number(p.shares) : undefined,
            })),
            paidByUserId: sharedData.paidByUserId,
          }

          await sharedExpenseAPI.update(editingTransaction.sharedExpenseId, sharedExpensePayload)
        } else if (sharedData && !editingTransaction.sharedExpenseId) {
          // Converting normal transaction to shared expense
          const sharedExpensePayload = {
            transactionId: editingTransaction.id,
            groupId: sharedData.groupId,
            paidByUserId: sharedData.paidByUserId,
            amount: data.amount,
            description: data.description || 'Shared expense',
            categoryId: data.categoryId, // Fix: Inherit category
            date: data.date || new Date().toISOString(), // Use transaction date
            splitType: sharedData.splitType,
            participants: sharedData.participants.map((p: any) => ({
              userId: p.userId,
              amountOwed: Number(p.amountOwed),
              percentage: sharedData.splitType === 'PERCENTAGE' && p.percentage != null ? Number(p.percentage) : undefined,
              shares: sharedData.splitType === 'SHARES' && p.shares != null ? Number(p.shares) : undefined,
            })),
          }

          const sharedExpenseResponse = await sharedExpenseAPI.create(sharedExpensePayload)
          payload.sharedExpenseId = sharedExpenseResponse.data.data.id
        }

        const editedId = editingTransaction.id
        await transactionAPI.update(editedId, payload)
        // Invalidate dashboard and account caches to force refresh
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
        queryClient.invalidateQueries({ queryKey: ['account-balances'] })
        // toast.success('Transaction updated successfully') - Modal handles success UI

        // Reload all current pages and scroll to edited transaction
        await reloadCurrentPages(editedId)
      } else {
        await transactionAPI.create(payload)
        // Invalidate dashboard and account caches to force refresh
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
        queryClient.invalidateQueries({ queryKey: ['account-balances'] })
        // toast.success('Transaction created successfully') - Modal handles success UI

        // Reset to page 1 for new transactions
        loadTransactions(1)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save transaction')
      throw error // Re-throw so modal knows it failed
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      await transactionAPI.delete(id)
      toast.success('Transaction deleted successfully')
      // Invalidate dashboard and account caches to force refresh
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['account-balances'] })
      loadTransactions(1) // Reset to page 1 to properly reset pagination state
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
      loadTransactions(1) // Reset to page 1 to properly reset pagination state
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

    // If this is a shared expense, load the shared expense data BEFORE opening modal
    if (transaction.sharedExpenseId) {
      try {
        const response = await sharedExpenseAPI.getById(transaction.sharedExpenseId)
        const sharedExpense = response.data.data
        setSharedExpenseData({
          groupId: sharedExpense.groupId,
          paidByUserId: sharedExpense.paidByUserId,
          splitType: sharedExpense.splitType,
          participants: sharedExpense.participants.map((p: any) => ({
            userId: p.userId,
            userName: p.user.name,
            amountOwed: p.amountOwed,
            percentage: p.percentage,
            shares: p.shares,
          })),
        })
        setIsModalOpen(true)
      } catch (error: any) {
        toast.error('Failed to load shared expense details')
        setSharedExpenseData(null)
        setIsModalOpen(true)
      }
    } else {
      setSharedExpenseData(null)
      setIsModalOpen(true)
    }
  }

  const handleAddNew = () => {
    setEditingTransaction(null)
    setSharedExpenseData(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTransaction(null)
    setSharedExpenseData(null)
  }

  // Helper functions used by modal now removed as they are internal to modal or not needed
  const getTransactionTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'EXPENSE':
        return 'text-expense'
      case 'INCOME':
        return 'text-income'
      case 'TRANSFER':
        return 'text-blue-600'
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

  // Show full page skeleton only on initial load with no data
  if (isLoading || (isRefreshingList && transactions.length === 0)) {
    return <TransactionsPageSkeleton />
  }

  return (
    <>
      {/* Top loading bar - Fintech style progress indicator */}
      <LoadingBar isLoading={isRefreshingList} />

      <PageTransition>
        <div className="max-w-screen-2xl mx-auto">

          <div className="flex flex-col gap-6 mb-6">
            {/* Header Row: Title & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="section-header">
                  {t('title')}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('subtitle')}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto self-end md:self-auto">
                <Button onClick={handleAddNew} className="w-full md:w-auto">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {tCommon('actions.add')}
                </Button>
              </div>
            </div>

            {/* Timeline Selector */}
            <div className="w-full">
              <MonthSelectorVariants
                variant="B"
                currentDate={currentDate}
                onDateChange={handleDateChange}
              />
            </div>
          </div>

          {/* Daily Spending Trend Chart - Removed by user request */}

          {/* Filters */}
          <TransactionFiltersComponent
            filters={filters}
            onFilterChange={setFilters}
            accounts={accounts}
            categories={categories}
            extraActions={
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="h-9 px-3 text-xs" // Smaller size to fit toolbar
                >
                  <TrendingUp className="w-3.5 h-3.5 mr-2" />
                  {tCommon('actions.export')}
                </Button>
                {showExportMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowExportMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        JSON
                      </button>
                      <button
                        onClick={() => handleExport('excel')}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Excel
                      </button>
                    </div>
                  </>
                )}
              </div>
            }
          />

          {/* Select All Button - Removed in favor of contextual bar */}
          {selectedTransactionIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-full px-6 py-3 z-50 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* Selection Info & Select All Toggle */}
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

              {/* Actions */}
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
                  {isBulkDeleting ? tLoading('deleting') : 'Eliminar'}
                </Button>
              </div>
            </div>
          )}

          {/* Transactions List - Grouped by Date */}
          <PullToRefresh onRefresh={handleRefresh}>
            <div className={`space-y-6 ${selectedTransactionIds.size > 0 ? 'pb-32' : ''} h-[calc(100vh-200px)] overflow-auto`}>
              {/* Show partial skeleton when refreshing with existing data */}
              {isRefreshingList && transactions.length > 0 ? (
                <TransactionListSkeleton itemCount={5} />
              ) : transactions.length === 0 ? (
                (() => {
                  const isFiltering =
                    filters.search ||
                    filters.type !== 'ALL' ||
                    filters.accountId ||
                    filters.categoryId ||
                    filters.startDate ||
                    filters.endDate ||
                    filters.minAmount ||
                    filters.maxAmount;

                  return (
                    <EmptyState
                      type={isFiltering ? 'search' : 'transactions'}
                      title={isFiltering ? tCommon('empty.noResults') : tCommon('empty.transactions.title')}
                      description={isFiltering ? tCommon('empty.noResults') : tCommon('empty.transactions.description')}
                      actionLabel={isFiltering ? undefined : t('newTransaction')}
                      onAction={() => setIsModalOpen(true)}
                    />
                  )
                })()
              ) : (
                <GroupedVirtuoso
                  ref={virtuosoRef}
                  groupCounts={groupCounts}
                  groupContent={(index) => {
                    const group = groupedTransactions[index]
                    return (
                      <DateGroupHeader
                        date={group.date}
                        totalIncome={group.totalIncome}
                        totalExpense={group.totalExpense}
                        currency={group.currency}
                      />
                    )
                  }}
                  itemContent={(index) => {
                    const transaction = flatTransactions[index];
                    if (!transaction) return null;

                    // Determine if first/last in group by comparing dates with neighbors
                    const currentDate = new Date(transaction.date).toDateString()
                    const prevDate = index > 0 ? new Date(flatTransactions[index - 1].date).toDateString() : null
                    const nextDate = index < flatTransactions.length - 1 ? new Date(flatTransactions[index + 1].date).toDateString() : null

                    // In a grouped list sorted by date desc, items within a day group share the same date string
                    // But we need to handle the case where "first in group" means first item rendered for that date header
                    const isFirst = currentDate !== prevDate
                    const isLast = currentDate !== nextDate

                    return (
                      <div className={`flex items-stretch transition-colors group ${selectedTransactionIds.has(transaction.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800'}`}>

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
                          isFirst={false} // Force continuous line
                          isLast={false}  // Force continuous line
                        />

                        {/* Transaction Content */}
                        <div className="flex-1 min-w-0 py-1 pr-4">
                          <TransactionCard
                            id={transaction.id}
                            type={transaction.type}
                            amount={Number(transaction.amount)}
                            currency={(transaction.account?.currency as 'CLP' | 'USD' | 'EUR') || 'CLP'}
                            category={transaction.category?.name || 'Uncategorized'}
                            categoryIcon={transaction.category?.icon || undefined}
                            categoryColor={transaction.category?.color || undefined}
                            description={transaction.description || undefined}
                            payee={transaction.payee ? transaction.payee : undefined}
                            date={new Date(transaction.date)}
                            isShared={!!transaction.sharedExpenseId}
                            onEdit={() => handleEdit(transaction)}
                          />
                        </div>
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
                        <div className="pt-2">
                          <TransactionListSkeleton itemCount={3} />
                        </div>
                      ) : null
                    )
                  }}
                />
              )}
            </div>
          </PullToRefresh>


          {/* End of list indicator */}
          {!hasMore && transactions.length > 0 && (
            <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
              Has llegado al final de la lista
            </div>
          )}

          {/* Transaction Modal - Now replaced by Fintech Pro Component */}
          {isModalOpen && (
            <TransactionFormModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSubmit={onSubmit}
              accounts={accounts}
              editingTransaction={editingTransaction}
              initialSharedExpenseData={sharedExpenseData}
              mode={editingTransaction ? 'edit' : 'create'}
            />
          )}

          {/* Bulk Delete Confirmation Modal */}
          <Modal
            isOpen={showBulkDeleteConfirm}
            onClose={() => setShowBulkDeleteConfirm(false)}
            title={t('delete')}
          >
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-900 dark:text-red-200">
                  Are you sure you want to delete {selectedTransactionIds.size} transaction{selectedTransactionIds.size !== 1 ? 's' : ''}?
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isBulkDeleting}
                  className="flex-1"
                >
                  {tCommon('actions.cancel')}
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isBulkDeleting ? tLoading('deleting') : tCommon('actions.delete')}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </PageTransition >
    </>
  )
}
