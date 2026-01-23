'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Account } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

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
  onSubmit: (data: CreateLoanFormData) => void | Promise<void>
  accounts: Account[]
}

export default function CreateLoanModal({
  isOpen,
  onClose,
  onSubmit,
  accounts,
}: CreateLoanModalProps) {
  const t = useTranslations('createLoan')
  const tCommon = useTranslations('common.actions')
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
    } catch (error) {
      // Error is handled by the parent component
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t('title')}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Borrower Name */}
        <div>
          <label htmlFor="borrowerName" className="block text-sm font-medium text-foreground mb-1">
            {t('borrowerName')} *
          </label>
          <Input
            id="borrowerName"
            {...register('borrowerName')}
            placeholder={t('borrowerPlaceholder')}
            className={errors.borrowerName ? 'border-red-500' : ''}
          />
          {errors.borrowerName && (
            <p className="text-red-500 text-xs mt-1" role="alert">{errors.borrowerName.message}</p>
          )}
        </div>

        {/* Account */}
        <div>
          <label htmlFor="accountId" className="block text-sm font-medium text-foreground mb-1">
            {t('accountFrom')} *
          </label>
          <Select
            id="accountId"
            {...register('accountId')}
            error={errors.accountId?.message}
          >
            <option value="">{t('selectAccount')}</option>
            {!accounts || accounts.length === 0 ? (
              <option disabled>{t('noAccountsAvailable')}</option>
            ) : (
              accounts
                .filter((a) => !a.isArchived)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))
            )}
          </Select>
          {errors.accountId && (
            <p className="text-red-500 text-xs mt-1" role="alert">{errors.accountId.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
            {t('amount')} *
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
            <p className="text-red-500 text-xs mt-1" role="alert">{errors.amount.message}</p>
          )}
        </div>

        {/* Loan Date */}
        <div>
          <label htmlFor="loanDate" className="block text-sm font-medium text-foreground mb-1">
            {t('loanDate')}
          </label>
          <Input
            id="loanDate"
            type="date"
            {...register('loanDate')}
            className={errors.loanDate ? 'border-red-500' : ''}
          />
          {errors.loanDate && (
            <p className="text-red-500 text-xs mt-1" role="alert">{errors.loanDate.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
            {t('notes')}
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            placeholder={t('notesPlaceholder')}
            className={`w-full px-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.notes ? 'border-destructive' : 'border-input'
              }`}
          />
          {errors.notes && (
            <p className="text-destructive text-xs mt-1" role="alert">{errors.notes.message}</p>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-muted/50 border border-muted rounded-lg p-3 text-sm text-foreground" role="note">
          <p className="font-medium mb-1">{t('infoTitle')}</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
            <li>{t('infoPoint1')}</li>
            <li>{t('infoPoint2')}</li>
            <li>{t('infoPoint3')}</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t" role="group" aria-label="Form actions">
          <Button type="submit" className="flex-1" disabled={isSaving} aria-busy={isSaving}>
            {isSaving ? t('creating') : t('createButton')}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            {tCommon('cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
