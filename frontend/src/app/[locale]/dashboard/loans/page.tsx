'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Loan, LoanStatus, Account } from '@/types'
import { accountAPI } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingPage } from '@/components/ui/Loading'
import CreateLoanModal from '@/components/CreateLoanModal'
import { LoansPageSkeleton } from '@/components/ui/PageSkeletons'
import { formatCurrency, type Currency } from '@/types/currency'
import { HandCoins, Plus, Filter } from 'lucide-react'
import { useLoans, useCreateLoan, useCancelLoan, useDeleteLoan, useRecordLoanPayment } from '@/hooks/useLoans'
import { PageTransition, AnimatedCurrency, AnimatedCounter } from '@/components/ui/animations'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import RecordLoanPaymentModal from '@/components/RecordLoanPaymentModal'
import { LoansSummary } from '@/components/LoansSummary'
import { motion } from 'framer-motion'
import { Search, Eye, XCircle, Trash2, MessageCircle, DollarSign } from 'lucide-react'

export default function LoansPage() {
  const router = useRouter()
  const t = useTranslations('loans')
  const tCommon = useTranslations('common')
  const { data: loans = [], isLoading } = useLoans()
  const createLoan = useCreateLoan()
  const recordPayment = useRecordLoanPayment()
  const cancelLoan = useCancelLoan()
  const deleteLoan = useDeleteLoan()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | LoanStatus>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Debounce search input - only trigger filtering after 300ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const accountsResponse = await accountAPI.getAll()
      const accountsData = accountsResponse.data as any
      setAccounts(Array.isArray(accountsData) ? accountsData : accountsData.data)
    } catch (error: any) {
      console.error('Error loading accounts:', error)
      toast.error(error.response?.data?.message || 'Failed to load accounts')
    }
  }

  const handleRecordPayment = (data: any) => {
    if (!selectedLoan) return

    recordPayment.mutate(
      { id: selectedLoan.id, data },
      {
        onSuccess: () => {
          toast.success('Pago registrado exitosamente')
          setIsPaymentModalOpen(false)
          setSelectedLoan(null)
        },
        onError: (error: any) => {
          console.error('Error recording payment:', error)
          toast.error(error.response?.data?.message || 'Failed to record payment')
        },
      }
    )
  }

  const handleCreateLoan = (data: any) => {
    return new Promise<void>((resolve, reject) => {
      createLoan.mutate(data, {
        onSuccess: () => {
          toast.success('Préstamo creado exitosamente')
          setIsCreateModalOpen(false)
          resolve()
        },
        onError: (error: any) => {
          console.error('Error creating loan:', error)
          toast.error(error.response?.data?.message || 'Failed to create loan')
          reject(error)
        },
      })
    })
  }

  const handleCancelLoan = (loanId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar/perdonar este préstamo?')) {
      return
    }

    cancelLoan.mutate(loanId, {
      onSuccess: () => {
        toast.success('Préstamo cancelado')
      },
      onError: (error: any) => {
        console.error('Error canceling loan:', error)
        toast.error(error.response?.data?.message || 'Failed to cancel loan')
      },
    })
  }

  const handleDeleteLoan = (loanId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este préstamo? Esta acción no se puede deshacer.')) {
      return
    }

    deleteLoan.mutate(loanId, {
      onSuccess: () => {
        toast.success('Préstamo eliminado')
      },
      onError: (error: any) => {
        console.error('Error deleting loan:', error)
        toast.error(error.response?.data?.message || 'Failed to delete loan')
      },
    })
  }

  const filteredLoans = loans.filter((loan) => {
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter
    const matchesSearch = loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: loans.length,
    active: loans.filter((l) => l.status === 'ACTIVE').length,
    paid: loans.filter((l) => l.status === 'PAID').length,
    cancelled: loans.filter((l) => l.status === 'CANCELLED').length,
    activeCount: loans.filter((l) => l.status === 'ACTIVE').length,
    totalLent: loans.reduce((sum, l) => sum + Number(l.originalAmount), 0),
    totalPending: loans
      .filter((l) => l.status === 'ACTIVE')
      .reduce((sum, l) => sum + (Number(l.originalAmount) - Number(l.paidAmount)), 0),
    totalRecovered: loans.reduce((sum, l) => sum + Number(l.paidAmount), 0),
  }



  const tabs = [
    { id: 'all', label: `${tCommon('status.all')} (${stats.total})` },
    { id: 'ACTIVE', label: `${tCommon('status.active')} (${stats.active})` },
    { id: 'PAID', label: `${tCommon('status.completed')} (${stats.paid})` },
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HandCoins className="h-8 w-8 text-orange-600" />
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            {t('new')}
          </Button>


        </div>

        {/* Financial Summary */}
        <LoansSummary stats={stats} />

        {/* Toolbar: Tabs & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <Tabs
            tabs={tabs}
            activeTab={statusFilter}
            onChange={(id) => setStatusFilter(id as 'all' | LoanStatus)}
            className="w-full md:w-auto"
          />

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={tCommon('actions.search')}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Loans List */}
        {filteredLoans.length === 0 ? (
          <EmptyState
            type="loans"
            title={searchTerm || statusFilter !== 'all' ? tCommon('empty.noResults') : tCommon('empty.loans.title')}
            description={searchTerm || statusFilter !== 'all' ? tCommon('empty.noResults') : tCommon('empty.loans.description')}
            actionLabel={searchTerm || statusFilter !== 'all' ? undefined : t('new')}
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="space-y-3">
            {filteredLoans.map((loan) => {
              const pendingAmount = Number(loan.originalAmount) - Number(loan.paidAmount)
              const progress = (Number(loan.paidAmount) / Number(loan.originalAmount)) * 100
              const isPaid = loan.status === 'PAID'

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  key={loan.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
                >
                  <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">

                    {/* Main Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {loan.borrowerName}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isPaid
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : loan.status === 'CANCELLED'
                            ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                          {tCommon(`status.${loan.status.toLowerCase()}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>{new Date(loan.loanDate).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{loan.payments.length} {tCommon('payments')}</span>
                      </div>
                    </div>

                    {/* Financial Progress */}
                    <div className="flex-1 w-full md:w-auto">
                      <div className="flex justify-between items-end mb-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-gray-900 dark:text-white">
                            <AnimatedCurrency amount={loan.paidAmount} currency={loan.currency as Currency} />
                          </span>
                          {' / '}
                          <AnimatedCurrency amount={loan.originalAmount} currency={loan.currency as Currency} />
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-0.5">Pendiente</div>
                          <div className={`text-lg font-bold ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                            <AnimatedCurrency amount={pendingAmount} currency={loan.currency as Currency} />
                          </div>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${isPaid ? 'bg-green-500' : 'bg-orange-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress, 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end mt-4 md:mt-0">

                      {/* Register Payment */}
                      {!isPaid && loan.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 dark:border-blue-900/30 dark:hover:bg-blue-900/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLoan(loan)
                            setIsPaymentModalOpen(true)
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          <span className="hidden lg:inline">{t('recordPaymentBtn') || 'Registrar Pago'}</span>
                        </Button>
                      )}

                      {/* WhatsApp Reminder */}
                      {!isPaid && loan.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            const message = `Hola ${loan.borrowerName}, te recuerdo el préstamo pendiente de ${formatCurrency(pendingAmount, loan.currency as Currency)}.`
                            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
                          }}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          <span className="hidden lg:inline">Recordar</span>
                        </Button>
                      )}

                      {/* Dropdown Menu */}
                      <DropdownMenu
                        align="right"
                        items={[
                          {
                            label: tCommon('actions.viewDetails'),
                            onClick: () => router.push(`/dashboard/loans/${loan.id}`),
                            icon: <Eye className="w-4 h-4" />
                          },
                          ...(loan.status === 'ACTIVE' ? [
                            {
                              label: tCommon('actions.cancel'),
                              onClick: () => handleCancelLoan(loan.id),
                              icon: <XCircle className="w-4 h-4" />
                            },
                            {
                              label: tCommon('actions.delete'),
                              onClick: () => handleDeleteLoan(loan.id),
                              variant: 'danger' as const,
                              icon: <Trash2 className="w-4 h-4" />
                            }
                          ] : [])
                        ]}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Create Loan Modal */}
        <CreateLoanModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateLoan}
          accounts={accounts}
        />

        {/* Record Payment Modal */}
        {selectedLoan && (
          <RecordLoanPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false)
              setSelectedLoan(null)
            }}
            onSubmit={handleRecordPayment}
            loan={selectedLoan}
            accounts={accounts}
          />
        )}
      </div>
    </PageTransition >
  )
}
