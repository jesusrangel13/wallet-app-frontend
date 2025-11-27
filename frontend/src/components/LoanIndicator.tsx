'use client'

import { cn } from '@/lib/utils'
import { formatCurrency, type Currency } from '@/types/currency'
import { Loan } from '@/types'

interface LoanIndicatorProps {
  transaction: {
    loanId?: string
    loan?: Loan
  }
  variant?: 'compact' | 'expanded'
  className?: string
}

export function LoanIndicator({
  transaction,
  variant = 'compact',
  className,
}: LoanIndicatorProps) {
  if (!transaction.loanId || !transaction.loan) {
    return null
  }

  const { loan } = transaction
  const progress = loan.originalAmount > 0 ? (loan.paidAmount / loan.originalAmount) * 100 : 0
  const pendingAmount = loan.originalAmount - loan.paidAmount

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {/* Loan Badge */}
        <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200">
          🤝 Préstamo
        </span>

        {/* Payment Status */}
        <span className="text-xs text-gray-600 flex items-center gap-1">
          {loan.status === 'PAID' ? (
            <span className="text-green-600">✓ Pagado</span>
          ) : loan.status === 'CANCELLED' ? (
            <span className="text-gray-500">✕ Cancelado</span>
          ) : (
            <span className="text-amber-600">{progress.toFixed(0)}% cobrado</span>
          )}
        </span>
      </div>
    )
  }

  // Expanded variant
  return (
    <div className={cn('space-y-2 p-3 bg-orange-50 border border-orange-200 rounded-lg', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-700">
          🤝 Préstamo
        </span>
        {loan.status === 'CANCELLED' && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            Cancelado
          </span>
        )}
      </div>

      {/* Borrower */}
      <div className="flex items-center gap-1.5 text-sm text-gray-700">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="text-gray-500">Prestado a:</span>
        <span className="font-medium">{loan.borrowerName}</span>
      </div>

      {/* Loan Amounts */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Monto original:</span>
          <span className="font-medium">{formatCurrency(loan.originalAmount, loan.currency as Currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Ya pagado:</span>
          <span className="font-medium text-green-600">{formatCurrency(loan.paidAmount, loan.currency as Currency)}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-orange-200">
          <span className="text-gray-900 font-semibold">Pendiente:</span>
          <span className="font-bold text-orange-700">{formatCurrency(pendingAmount, loan.currency as Currency)}</span>
        </div>
      </div>

      {/* Payment Progress */}
      {loan.status !== 'CANCELLED' && (
        <div className="flex items-center gap-2 pt-2 border-t border-orange-200">
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progreso de pago</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  loan.status === 'PAID' ? 'bg-green-500' : 'bg-orange-500'
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
          {loan.status === 'PAID' ? (
            <span className="text-green-600 text-lg">✓</span>
          ) : (
            <span className="text-orange-600 text-lg">⏳</span>
          )}
        </div>
      )}

      {/* Payments List (optional) */}
      {loan.payments && loan.payments.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
            Ver pagos ({loan.payments.length})
          </summary>
          <div className="mt-2 space-y-1 pl-2">
            {loan.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between text-gray-700 py-1">
                <span className="text-xs text-gray-500">
                  {new Date(payment.paymentDate).toLocaleDateString('es-ES')}
                </span>
                <span className="font-medium text-green-600">
                  {formatCurrency(payment.amount, loan.currency as Currency)}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Notes */}
      {loan.notes && (
        <div className="pt-2 border-t border-orange-200 text-xs text-gray-600">
          <span className="font-medium">Notas:</span> {loan.notes}
        </div>
      )}
    </div>
  )
}
