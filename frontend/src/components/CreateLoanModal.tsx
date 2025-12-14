'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Account } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const loanSchema = z.object({
  borrowerName: z.string().min(1, 'Borrower name is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  accountId: z.string().min(1, 'Account is required'),
  loanDate: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateLoanFormData = z.infer<typeof loanSchema>

interface CreateLoanModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateLoanFormData) => Promise<void>
  accounts: Account[]
}

export default function CreateLoanModal({
  isOpen,
  onClose,
  onSubmit,
  accounts,
}: CreateLoanModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formattedAmount, setFormattedAmount] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      loanDate: new Date().toISOString().split('T')[0],
    },
  })

  const selectedAccountId = watch('accountId')
  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId)

  const formatAmountDisplay = (value: string | number, currency: string): string => {
    if (!value) return ''
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
    if (isNaN(numValue)) return ''

    if (currency === 'CLP') {
      return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue)
    } else {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue)
    }
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '')

    if (rawValue === '' || rawValue === '.') {
      setFormattedAmount(rawValue)
      setValue('amount', 0)
      return
    }

    const numValue = parseFloat(rawValue)
    if (!isNaN(numValue) && numValue >= 0) {
      setFormattedAmount(rawValue)
      setValue('amount', numValue)
    }
  }

  const handleAmountBlur = () => {
    const amount = watch('amount')
    if (amount && selectedAccount) {
      setFormattedAmount(formatAmountDisplay(amount, selectedAccount.currency))
    }
  }

  const handleAmountFocus = () => {
    const amount = watch('amount')
    if (amount) {
      setFormattedAmount(amount.toString())
    }
  }

  const handleFormSubmit = async (data: CreateLoanFormData) => {
    setIsSaving(true)
    try {
      await onSubmit(data)
      handleClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    reset()
    setFormattedAmount('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Crear Préstamo">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Borrower Name */}
        <div>
          <label htmlFor="borrowerName" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del deudor *
          </label>
          <Input
            id="borrowerName"
            {...register('borrowerName')}
            placeholder="Juan Pérez"
            className={errors.borrowerName ? 'border-red-500' : ''}
          />
          {errors.borrowerName && (
            <p className="text-red-500 text-xs mt-1">{errors.borrowerName.message}</p>
          )}
        </div>

        {/* Account */}
        <div>
          <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
            Cuenta desde la que prestas *
          </label>
          <select
            id="accountId"
            {...register('accountId')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.accountId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Selecciona una cuenta</option>
            {!accounts || accounts.length === 0 ? (
              <option disabled>No hay cuentas disponibles</option>
            ) : (
              accounts
                .filter((a) => !a.isArchived)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))
            )}
          </select>
          {errors.accountId && (
            <p className="text-red-500 text-xs mt-1">{errors.accountId.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Monto *
          </label>
          <Input
            id="amount"
            type="text"
            value={formattedAmount}
            onChange={handleAmountChange}
            onBlur={handleAmountBlur}
            onFocus={handleAmountFocus}
            placeholder="0"
            className={errors.amount ? 'border-red-500' : ''}
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Loan Date */}
        <div>
          <label htmlFor="loanDate" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha del préstamo
          </label>
          <Input
            id="loanDate"
            type="date"
            {...register('loanDate')}
            className={errors.loanDate ? 'border-red-500' : ''}
          />
          {errors.loanDate && (
            <p className="text-red-500 text-xs mt-1">{errors.loanDate.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            placeholder="Detalles adicionales del préstamo..."
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.notes ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.notes && (
            <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-medium mb-1">💡 ¿Qué sucede al crear un préstamo?</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Se creará una transacción de GASTO en tu cuenta</li>
            <li>El dinero saldrá de tu cuenta (afectará tu balance)</li>
            <li>Podrás registrar pagos parciales o completos más adelante</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button type="submit" className="flex-1" disabled={isSaving}>
            {isSaving ? 'Creando...' : 'Crear Préstamo'}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
