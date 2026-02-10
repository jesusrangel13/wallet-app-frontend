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
import { useConfetti } from '@/components/ui/animations'
import { toast } from 'sonner'

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
  onSubmit: (data: RecordPaymentFormData) => void
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
  const { fire } = useConfetti()
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
      amount: 0,
    },
  })

  // Set default amount to 0 effectively, but let the user type
  // We initialize with 0 to show placeholder-like behavior if needed or just empty

  const selectedAccountId = watch('accountId')
  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId)
  const selectedAmount = watch('amount') || 0
  const paymentDate = watch('paymentDate')

  const currency = loan.currency as Currency

  // Calculate new balances
  const newLoanBalance = Math.max(0, pendingAmount - selectedAmount)
  const newAccountBalance = selectedAccount
    ? selectedAccount.balance + selectedAmount
    : 0

  const formatAmountDisplay = (value: string | number, currentCurrency: string): string => {
    if (!value) return ''
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
    if (isNaN(numValue)) return ''

    if (currentCurrency === 'CLP') {
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
    if (amount) {
      setFormattedAmount(formatAmountDisplay(amount, currency))
    }
  }

  const handleAmountFocus = () => {
    const amount = watch('amount')
    if (amount) {
      setFormattedAmount(amount.toString())
    }
  }

  const setPercentageAmount = (percentage: number) => {
    const amount = Math.floor(pendingAmount * percentage)
    // For CLP usually no decimals, for others maybe 2. 
    // Simplified logic:
    const finalAmount = currency === 'CLP' ? Math.round(amount) : Number(amount.toFixed(2))

    setValue('amount', finalAmount)
    setFormattedAmount(formatAmountDisplay(finalAmount, currency))
  }

  const handleFormSubmit = async (data: RecordPaymentFormData) => {
    if (data.amount > pendingAmount + 1) { // Small buffer for float issues
      toast.error(t('paymentExceedsError', { amount: formatCurrency(pendingAmount, currency) }))
      return
    }

    setIsSaving(true)
    try {
      if (Math.abs(data.amount - pendingAmount) < 0.01) {
        fire()
        toast.success(t('fullPaymentCelebration') || '🎉 Loan paid in full!')
      }

      onSubmit(data)
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('title')} className="max-w-xl">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

        {/* HERO INPUT SECTION */}
        <div className="flex flex-col items-center justify-center py-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t('paymentAmount')}
          </label>
          <div className="relative flex items-center justify-center">
            <span className="text-4xl font-light text-gray-400 mr-2">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={formattedAmount}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              onFocus={handleAmountFocus}
              placeholder="0"
              className="w-48 text-5xl font-bold text-center bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-200 dark:placeholder-gray-700"
            />
          </div>
          {errors.amount && (
            <p className="text-red-500 text-sm mt-2">{errors.amount.message}</p>
          )}

          {/* Quick Amount Chips */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setPercentageAmount(0.10)}
              className="px-3 py-1 text-xs font-medium rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              10%
            </button>
            <button
              type="button"
              onClick={() => setPercentageAmount(0.50)}
              className="px-3 py-1 text-xs font-medium rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              50%
            </button>
            <button
              type="button"
              onClick={() => setPercentageAmount(1)}
              className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
            >
              Total
            </button>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT: Account Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('accountTo')}
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {accounts
                ?.filter((a) => !a.isArchived && a.currency === currency)
                .map((account) => {
                  const isSelected = selectedAccountId === account.id
                  return (
                    <div
                      key={account.id}
                      onClick={() => setValue('accountId', account.id)}
                      className={`
                          cursor-pointer p-3 rounded-lg border transition-all
                          flex items-center justify-between
                          ${isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                        `}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
                          {account.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Saldo: {formatCurrency(account.balance, currency)}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                  )
                })}
              {(!accounts || accounts.length === 0) && (
                <p className="text-xs text-gray-500 italic">{t('noAccounts', { currency })}</p>
              )}
            </div>
            {errors.accountId && (
              <p className="text-red-500 text-xs">{errors.accountId.message}</p>
            )}
          </div>

          {/* RIGHT: Details & Impact */}
          <div className="space-y-4">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('paymentDate')}
              </label>
              <Input
                type="date"
                {...register('paymentDate')}
                className={errors.paymentDate ? 'border-red-500' : ''}
              />
            </div>

            {/* Dynamic Impact Preview */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('currentPending')}:</span>
                <span className="font-medium">{formatCurrency(pendingAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-sm border-b border-gray-200 dark:border-gray-700 pb-2">
                <span className="text-gray-500">{t('lessPayment')}:</span>
                <span className="font-medium text-red-500">-{formatCurrency(selectedAmount, currency)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="font-semibold text-gray-900 dark:text-white">{t('newPending')}:</span>
                <div className="text-right">
                  <span className={`font-bold ${newLoanBalance === 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                    {formatCurrency(newLoanBalance, currency)}
                  </span>
                  {newLoanBalance === 0 && selectedAmount > 0 && (
                    <span className="text-xs text-green-600 block">{t('paidSuccess')}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes (Collapsible or just simple input at bottom) */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('notes')}
          </label>
          <Input
            {...register('notes')}
            placeholder={t('notesPlaceholder')}
            className="text-sm"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} className="flex-1">
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isSaving || selectedAmount <= 0}
          >
            {isSaving ? t('recording') : t('recordButton')}
          </Button>
        </div>

      </form>
    </Modal>
  )
}
