'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Account, Loan } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatCurrency, type Currency } from '@/types/currency'

const paymentSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  accountId: z.string().min(1, 'Account is required'),
  paymentDate: z.string().optional(),
  notes: z.string().optional(),
})

export type RecordPaymentFormData = z.infer<typeof paymentSchema>

interface RecordLoanPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RecordPaymentFormData) => Promise<void>
  loan: Loan
  accounts: Account[]
}

export default function RecordLoanPaymentModal({
  isOpen,
  onClose,
  onSubmit,
  loan,
  accounts,
}: RecordLoanPaymentModalProps) {
  const t = useTranslations('recordPayment')
  const tCommon = useTranslations('common.actions')
  const [isSaving, setIsSaving] = useState(false)
  const [formattedAmount, setFormattedAmount] = useState('')

  const pendingAmount = loan.originalAmount - loan.paidAmount

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RecordPaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      amount: pendingAmount,
    },
  })

  const selectedAccountId = watch('accountId')
  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId)
  const selectedAmount = watch('amount') || 0

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

  const handleFormSubmit = async (data: RecordPaymentFormData) => {
    // Validate amount doesn't exceed pending
    if (data.amount > pendingAmount) {
      return
    }

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

  const setFullAmount = () => {
    setValue('amount', pendingAmount)
    setFormattedAmount(pendingAmount.toString())
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('title')}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Loan Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('borrower')}:</span>
            <span className="font-medium">{loan.borrowerName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('originalAmount')}:</span>
            <span className="font-medium">{formatCurrency(loan.originalAmount, loan.currency as Currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t('paidAmount')}:</span>
            <span className="font-medium text-green-600">{formatCurrency(loan.paidAmount, loan.currency as Currency)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
            <span className="text-gray-900 font-semibold">{t('pendingAmount')}:</span>
            <span className="font-bold text-orange-600">{formatCurrency(pendingAmount, loan.currency as Currency)}</span>
          </div>
        </div>

        {/* Account */}
        <div>
          <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
            {t('accountTo')} *
          </label>
          <select
            id="accountId"
            {...register('accountId')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.accountId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">{t('selectAccount')}</option>
            {accounts
              ?.filter((a) => !a.isArchived && a.currency === loan.currency)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              )) || []}
          </select>
          {errors.accountId && (
            <p className="text-red-500 text-xs mt-1">{errors.accountId.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              {t('paymentAmount')} *
            </label>
            <button
              type="button"
              onClick={setFullAmount}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              {t('payAll', { amount: formatCurrency(pendingAmount, loan.currency as Currency) })}
            </button>
          </div>
          <Input
            id="amount"
            type="text"
            value={formattedAmount}
            onChange={handleAmountChange}
            onBlur={handleAmountBlur}
            onFocus={handleAmountFocus}
            placeholder="0"
            className={errors.amount || selectedAmount > pendingAmount ? 'border-red-500' : ''}
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
          )}
          {selectedAmount > pendingAmount && (
            <p className="text-red-500 text-xs mt-1">
              {t('paymentExceedsError', { amount: formatCurrency(pendingAmount, loan.currency as Currency) })}
            </p>
          )}
        </div>

        {/* Payment Date */}
        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
            {t('paymentDate')}
          </label>
          <Input
            id="paymentDate"
            type="date"
            {...register('paymentDate')}
            className={errors.paymentDate ? 'border-red-500' : ''}
          />
          {errors.paymentDate && (
            <p className="text-red-500 text-xs mt-1">{errors.paymentDate.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            {t('notes')}
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={2}
            placeholder={t('notesPlaceholder')}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.notes ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.notes && (
            <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          <p className="font-medium mb-1">{t('infoTitle')}</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>{t('infoPoint1')}</li>
            <li>{t('infoPoint2')}</li>
            <li>{t('infoPoint3')}</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="submit"
            className="flex-1"
            disabled={isSaving || selectedAmount > pendingAmount || selectedAmount <= 0}
          >
            {isSaving ? t('recording') : t('recordButton')}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            {tCommon('cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
