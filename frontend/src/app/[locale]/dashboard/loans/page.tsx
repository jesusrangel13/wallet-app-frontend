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
import { useLoans, useCreateLoan, useCancelLoan, useDeleteLoan } from '@/hooks/useLoans'

export default function LoansPage() {
  const router = useRouter()
  const t = useTranslations('loans')
  const tCommon = useTranslations('common')
  const { data: loans = [], isLoading } = useLoans()
  const createLoan = useCreateLoan()
  const cancelLoan = useCancelLoan()
  const deleteLoan = useDeleteLoan()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
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
    totalLent: loans.reduce((sum, l) => sum + Number(l.originalAmount), 0),
    totalPending: loans
      .filter((l) => l.status === 'ACTIVE')
      .reduce((sum, l) => sum + (Number(l.originalAmount) - Number(l.paidAmount)), 0),
    totalRecovered: loans.reduce((sum, l) => sum + Number(l.paidAmount), 0),
  }

  if (isLoading) {
    return <LoansPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <HandCoins className="h-8 w-8 text-orange-600" />
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('new')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Total Prestado</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalLent, (loans[0]?.currency as Currency) || 'CLP')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Pendiente</div>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats.totalPending, (loans[0]?.currency as Currency) || 'CLP')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Recuperado</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRecovered, (loans[0]?.currency as Currency) || 'CLP')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Préstamos Activos</div>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtrar por estado
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Todos ({stats.total})
                </button>
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === 'ACTIVE'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Activos ({stats.active})
                </button>
                <button
                  onClick={() => setStatusFilter('PAID')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === 'PAID'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Pagados ({stats.paid})
                </button>
                <button
                  onClick={() => setStatusFilter('CANCELLED')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${statusFilter === 'CANCELLED'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Cancelados ({stats.cancelled})
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por nombre
              </label>
              <input
                id="search"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar deudor..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loans List */}
      {filteredLoans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <HandCoins className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No se encontraron préstamos' : 'No tienes préstamos'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Intenta ajustar los filtros'
                : 'Comienza registrando un préstamo que hayas dado'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>Crear Préstamo</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan) => {
            const pendingAmount = Number(loan.originalAmount) - Number(loan.paidAmount)
            const progress = (Number(loan.paidAmount) / Number(loan.originalAmount)) * 100

            return (
              <Card
                key={loan.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/loans/${loan.id}`)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {loan.borrowerName}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${loan.status === 'ACTIVE'
                            ? 'bg-orange-100 text-orange-700'
                            : loan.status === 'PAID'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {loan.status === 'ACTIVE'
                            ? 'Activo'
                            : loan.status === 'PAID'
                              ? 'Pagado'
                              : 'Cancelado'}
                        </span>
                      </div>

                      {/* Amounts */}
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-gray-500">Original</div>
                          <div className="text-sm font-medium">
                            {formatCurrency(loan.originalAmount, loan.currency as Currency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Pagado</div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(loan.paidAmount, loan.currency as Currency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Pendiente</div>
                          <div className="text-sm font-bold text-orange-600">
                            {formatCurrency(pendingAmount, loan.currency as Currency)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {loan.status !== 'CANCELLED' && (
                        <div className="mb-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progreso</span>
                            <span>{progress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${loan.status === 'PAID' ? 'bg-green-500' : 'bg-orange-500'
                                }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Date and Payments */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Fecha: {new Date(loan.loanDate).toLocaleDateString('es-ES')}
                        </span>
                        <span>Pagos: {loan.payments.length}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/loans/${loan.id}`)
                        }}
                      >
                        Ver Detalles
                      </Button>
                      {loan.status === 'ACTIVE' && loan.payments.length === 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteLoan(loan.id)
                          }}
                        >
                          Eliminar
                        </Button>
                      )}
                      {loan.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCancelLoan(loan.id)
                          }}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
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
    </div>
  )
}
