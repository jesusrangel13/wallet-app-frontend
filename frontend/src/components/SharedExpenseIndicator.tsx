'use client'

import { cn } from '@/lib/utils'

interface SharedExpenseIndicatorProps {
  transaction: {
    sharedExpenseId?: string
    payee?: string
    payer?: string
    sharedExpense?: {
      id: string
      group?: {
        name: string
      }
      paidBy?: {
        name: string
      }
      participants?: Array<{
        id: string
        userId: string
        amountOwed: number
        isPaid?: boolean
        user: {
          id: string
          name: string
        }
      }>
    }
  }
  variant?: 'compact' | 'expanded'
  className?: string
}

export function SharedExpenseIndicator({
  transaction,
  variant = 'compact',
  className,
}: SharedExpenseIndicatorProps) {
  if (!transaction.sharedExpenseId || !transaction.sharedExpense) {
    return null
  }

  const { sharedExpense, payee, payer } = transaction
  const participants = sharedExpense.participants || []
  const paidCount = participants.filter(p => p.isPaid).length
  const totalCount = participants.length

  // Determine who paid
  const payerName = payer || sharedExpense.paidBy?.name || 'Unknown'
  const groupName = sharedExpense.group?.name

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2', className)}>
        {/* Shared Badge */}
        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
          👥 Compartido
        </span>

        {/* Payment Status */}
        <span className="text-xs text-gray-600 flex items-center gap-1">
          {paidCount === totalCount ? (
            <span className="text-green-600">✓ {paidCount}/{totalCount} pagado</span>
          ) : (
            <span className="text-amber-600">⏳ {paidCount}/{totalCount} pagado</span>
          )}
        </span>
      </div>
    )
  }

  // Expanded variant
  return (
    <div className={cn('space-y-2 p-3 bg-purple-50 border border-purple-200 rounded-lg', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-700">
          👥 Gasto Compartido
        </span>
        {groupName && (
          <span className="text-xs text-gray-600">
            en: <span className="font-medium">{groupName}</span>
          </span>
        )}
      </div>

      {/* Payee (merchant/recipient) */}
      {payee && (
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="text-gray-500">→</span>
          <span className="font-medium">{payee}</span>
        </div>
      )}

      {/* Payer (who paid in the group) */}
      <div className="flex items-center gap-1.5 text-sm text-gray-700">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span className="text-gray-500">Pagado por:</span>
        <span className="font-medium">{payerName}</span>
      </div>

      {/* Payment Progress */}
      <div className="flex items-center gap-2 pt-2 border-t border-purple-200">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Estado de pagos</span>
            <span className="font-medium">
              {paidCount}/{totalCount} personas
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                paidCount === totalCount ? 'bg-green-500' : 'bg-amber-500'
              )}
              style={{ width: `${(paidCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
        {paidCount === totalCount ? (
          <span className="text-green-600 text-lg">✓</span>
        ) : (
          <span className="text-amber-600 text-lg">⏳</span>
        )}
      </div>

      {/* Participants List (optional) */}
      {participants.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
            Ver participantes ({totalCount})
          </summary>
          <div className="mt-2 space-y-1 pl-2">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-2 text-gray-700">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    participant.isPaid ? 'bg-green-500' : 'bg-gray-300'
                  )}
                />
                <span>{participant.user.name}</span>
                {participant.isPaid && <span className="text-green-600 text-xs">✓ Pagado</span>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
