'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Account } from '@/types'
import { accountAPI } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingPage } from '@/components/ui/Loading'
import RecordLoanPaymentModal from '@/components/RecordLoanPaymentModal'
import { formatCurrency, type Currency } from '@/types/currency'
import { ArrowLeft, HandCoins, Calendar, DollarSign, User, FileText } from 'lucide-react'
import { useLoan, useRecordLoanPayment, useCancelLoan, useDeleteLoan } from '@/hooks/useLoans'
import { PageTransition, AnimatedCurrency, AnimatedCounter } from '@/components/ui/animations'

export default function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('loans')
  const tCommon = useTranslations('common')
  const { data: loan, isLoading } = useLoan(id)
  const recordPayment = useRecordLoanPayment()
  const cancelLoan = useCancelLoan()
  const deleteLoan = useDeleteLoan()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  useEffect(() => {
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
    loadAccounts()
  }, [])

  const handleRecordPayment = (data: any) => {
    if (!loan) return

    recordPayment.mutate(
      { id: loan.id, data },
      {
        onSuccess: () => {
          toast.success('Pago registrado exitosamente')
          setIsPaymentModalOpen(false)
        },
        onError: (error: any) => {
          console.error('Error recording payment:', error)
          toast.error(error.response?.data?.message || 'Failed to record payment')
          throw error
        },
      }
    )
  }

  const handleCancelLoan = () => {
    if (!loan) return
    if (!confirm('¿Estás seguro de que deseas cancelar/perdonar este préstamo?')) {
      return
    }

    cancelLoan.mutate(loan.id, {
      onSuccess: () => {
        toast.success('Préstamo cancelado')
      },
      onError: (error: any) => {
        console.error('Error canceling loan:', error)
        toast.error(error.response?.data?.message || 'Failed to cancel loan')
      },
    })
  }

  const handleDeleteLoan = () => {
    if (!loan) return
    if (!confirm('¿Estás seguro de que deseas eliminar este préstamo? Esta acción no se puede deshacer.')) {
      return
    }

    deleteLoan.mutate(loan.id, {
      onSuccess: () => {
        toast.success('Préstamo eliminado')
        router.push('/dashboard/loans')
      },
      onError: (error: any) => {
        console.error('Error deleting loan:', error)
        toast.error(error.response?.data?.message || 'Failed to delete loan')
      },
    })
  }

  if (isLoading) {
    return <LoadingPage message="Cargando préstamo..." />
  }

  if (!loan) {
    return null
  }

  const pendingAmount = loan.originalAmount - loan.paidAmount
  const progress = (loan.paidAmount / loan.originalAmount) * 100

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back Button */}
        <button
        onClick={() => router.push('/dashboard/loans')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Préstamos
      </button>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <HandCoins className="h-8 w-8 text-orange-600" />
            {t('title')} - {loan.borrowerName}
          </h1>
          <p className="text-gray-600 mt-1">
            Creado el {new Date(loan.createdAt).toLocaleDateString('es-ES')}
          </p>
        </div>
        <div className="flex gap-2">
          {loan.status === 'ACTIVE' && pendingAmount > 0 && (
            <Button onClick={() => setIsPaymentModalOpen(true)}>
              {t('recordPayment')}
            </Button>
          )}
          {loan.status === 'ACTIVE' && (
            <Button variant="outline" onClick={handleCancelLoan}>
              {tCommon('actions.cancel')}
            </Button>
          )}
          {loan.status === 'ACTIVE' && loan.payments.length === 0 && (
            <Button variant="outline" onClick={handleDeleteLoan}>
              {tCommon('actions.delete')}
            </Button>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div>
        <span
          className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
            loan.status === 'ACTIVE'
              ? 'bg-orange-100 text-orange-700'
              : loan.status === 'PAID'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'PAID' ? 'Pagado Completamente' : 'Cancelado'}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Monto Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(loan.originalAmount, loan.currency as Currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ya Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(loan.paidAmount, loan.currency as Currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(pendingAmount, loan.currency as Currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {loan.status !== 'CANCELLED' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Progreso de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Completado</span>
                <span className="font-medium">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    loan.status === 'PAID' ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loan Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Préstamo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Deudor</div>
                <div className="font-medium">{loan.borrowerName}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-sm text-gray-500">Fecha del préstamo</div>
                <div className="font-medium">
                  {new Date(loan.loanDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
            </div>

            {loan.notes && (
              <div className="col-span-full flex items-start gap-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Notas</div>
                  <div className="font-medium">{loan.notes}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payments History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Historial de Pagos</span>
            <span className="text-sm font-normal text-gray-500">
              {loan.payments.length} {loan.payments.length === 1 ? 'pago' : 'pagos'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loan.payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay pagos registrados aún
            </div>
          ) : (
            <div className="space-y-3">
              {loan.payments.map((payment, index) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-gray-900">
                        Pago #{loan.payments.length - index}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.paymentDate).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    {payment.notes && (
                      <div className="text-sm text-gray-600 mt-1">{payment.notes}</div>
                    )}
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(payment.amount, loan.currency as Currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Original Transaction Link */}
      {loan.loanTransaction && (
        <Card>
          <CardHeader>
            <CardTitle>Transacción Original</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">
              Este préstamo creó una transacción de gasto en tu cuenta:
            </p>
            <button
              onClick={() => router.push(`/dashboard/transactions`)}
              className="text-blue-600 hover:text-blue-700 underline text-sm"
            >
              Ver en transacciones →
            </button>
          </CardContent>
        </Card>
      )}

      {/* Record Payment Modal */}
      {loan.status === 'ACTIVE' && pendingAmount > 0 && (
        <RecordLoanPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSubmit={handleRecordPayment}
          loan={loan}
          accounts={accounts}
        />
      )}
      </div>
    </PageTransition>
  )
}
