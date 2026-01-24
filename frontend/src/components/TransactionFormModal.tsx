'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Account } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import CategorySelector from '@/components/CategorySelector'
import TagSelector from '@/components/TagSelector'
import SharedExpenseForm, { SharedExpenseData } from '@/components/SharedExpenseForm'
import PayeeAutocomplete from '@/components/PayeeAutocomplete'

const transactionSchema = z.object({
  accountId: z.string().optional(),
  type: z.enum(['EXPENSE', 'INCOME', 'TRANSFER']),
  amount: z.coerce.number().positive('Amount must be positive'),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  payee: z.string().optional(),
  payer: z.string().optional(),
  toAccountId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sharedGroup: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // If type is TRANSFER, toAccountId is required
    if (data.type === 'TRANSFER') {
      return data.toAccountId && data.toAccountId.length > 0
    }
    return true
  },
  {
    message: 'Destination account is required for transfers',
    path: ['toAccountId'],
  }
)

export type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TransactionFormData, sharedExpenseData?: SharedExpenseData | null) => Promise<void>
  accounts: Account[]
  editingTransaction?: any
  suggestedCategory?: string
  initialData?: Partial<TransactionFormData>
  mode?: 'create' | 'edit' | 'import'
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  onSubmit,
  accounts,
  editingTransaction,
  suggestedCategory,
  initialData,
  mode = 'create',
}: TransactionFormModalProps) {
  const t = useTranslations('transactions')
  const tCommon = useTranslations('common')
  const [isSharedExpense, setIsSharedExpense] = useState(false)
  const [sharedExpenseData, setSharedExpenseData] = useState<SharedExpenseData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formattedAmount, setFormattedAmount] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'EXPENSE',
      tags: [],
      date: mode !== 'import' ? new Date().toISOString() : undefined,
      ...initialData,
    },
  })

  const selectedType = watch('type')
  const selectedAccountId = watch('accountId')
  const selectedTags = watch('tags') || []
  const selectedAmount = watch('amount') || 0
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

  const formatAmountDisplay = (value: string | number, currency: string): string => {
    if (!value) return ''
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
    if (isNaN(numValue)) return ''

    // Format based on currency
    if (currency === 'CLP') {
      // CLP doesn't use decimals typically
      return new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numValue)
    } else {
      // USD and EUR use decimals
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue)
    }
  }

  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key as keyof TransactionFormData, value)
      })
      if (initialData.amount) {
        setFormattedAmount(initialData.amount.toString())
      }
    }
  }, [initialData, setValue])

  // Initialize form from editingTransaction when not using initialData
  useEffect(() => {
    if (editingTransaction && !initialData) {
      const amount = Number(editingTransaction.amount)
      setValue('accountId', editingTransaction.accountId)
      setValue('type', editingTransaction.type)
      setValue('amount', amount)
      setValue('categoryId', editingTransaction.categoryId || undefined)
      setValue('description', editingTransaction.description || '')
      setValue('date', editingTransaction.date ? new Date(editingTransaction.date).toISOString() : '')
      setValue('payee', editingTransaction.payee || '')
      setValue('payer', editingTransaction.payer || '')
      setValue('toAccountId', editingTransaction.toAccountId || undefined)
      setValue('tags', editingTransaction.tags?.map((t: any) => t.tagId) || [])

      if (amount) {
        const currency = accounts.find(a => a.id === editingTransaction.accountId)?.currency || 'CLP'
        setFormattedAmount(formatAmountDisplay(amount, currency))
      }
    }
  }, [editingTransaction, initialData, setValue, accounts, formatAmountDisplay])

  const getAvailableToAccounts = () => {
    if (!selectedAccountId) return []
    const selectedAcc = accounts.find((a) => a.id === selectedAccountId)
    if (!selectedAcc) return []

    // Only show accounts with the same currency
    return accounts.filter(
      (a) => a.id !== selectedAccountId && a.currency === selectedAcc.currency
    )
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '') // Remove commas for parsing

    // Allow empty or just a dot
    if (rawValue === '' || rawValue === '.') {
      setFormattedAmount(rawValue)
      setValue('amount', 0)
      return
    }

    // Allow valid numbers with optional decimal
    const numValue = parseFloat(rawValue)
    if (!isNaN(numValue) && numValue >= 0) {
      setFormattedAmount(rawValue) // Keep raw input while typing
      setValue('amount', numValue)
    }
  }

  const handleAmountBlur = () => {
    const amount = watch('amount')
    if (amount && amount > 0 && selectedAccount) {
      setFormattedAmount(formatAmountDisplay(amount, selectedAccount.currency))
    } else if (!amount || amount === 0) {
      setFormattedAmount('')
    }
  }

  const handleAmountFocus = () => {
    const amount = watch('amount')
    if (amount && amount > 0) {
      setFormattedAmount(amount.toString())
    } else {
      setFormattedAmount('')
    }
  }

  const handleFormSubmit = async (data: TransactionFormData) => {
    setIsSaving(true)
    try {
      await onSubmit(data, sharedExpenseData)
      handleClose()
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    reset()
    setIsSharedExpense(false)
    setSharedExpenseData(null)
    setFormattedAmount('')
    onClose()
  }

  const getModalTitle = () => {
    if (mode === 'import') return t('edit')
    return editingTransaction ? t('edit') : t('new')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getModalTitle()}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Transaction Type - Tabs */}
        <fieldset>
          <legend className="block text-sm font-medium text-foreground mb-2">
            {t('fields.type')} <span className="text-red-500" aria-hidden="true">*</span>
          </legend>
          <div className="grid grid-cols-3 gap-2 bg-muted p-1 rounded-lg" role="radiogroup" aria-label={t('fields.type')}>
            <button
              type="button"
              onClick={() => setValue('type', 'EXPENSE')}
              role="radio"
              aria-checked={selectedType === 'EXPENSE'}
              className={`py-3 px-4 rounded-md text-sm font-medium transition-all ${selectedType === 'EXPENSE'
                ? 'bg-expense text-white shadow-md'
                : 'text-muted-foreground hover:bg-muted/80'
                }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>{t('types.expense')}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'INCOME')}
              role="radio"
              aria-checked={selectedType === 'INCOME'}
              className={`py-3 px-4 rounded-md text-sm font-medium transition-all ${selectedType === 'INCOME'
                ? 'bg-income text-white shadow-md'
                : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>{t('types.income')}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'TRANSFER')}
              role="radio"
              aria-checked={selectedType === 'TRANSFER'}
              className={`py-3 px-4 rounded-md text-sm font-medium transition-all ${selectedType === 'TRANSFER'
                ? 'bg-transfer text-white shadow-md'
                : 'text-muted-foreground hover:bg-muted'
                }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>{t('types.transfer')}</span>
              </div>
            </button>
          </div>
          {errors.type && <p className="text-destructive text-sm mt-1" role="alert">{errors.type.message}</p>}
        </fieldset>

        {/* Account */}
        {mode !== 'import' && (
          <div>
            <Select
              {...register('accountId')}
              label={`${t('fields.account')} *`}
              error={errors.accountId?.message}
            >
              <option value="">{t('placeholders.selectAccount')}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* To Account (for transfers) */}
        {selectedType === 'TRANSFER' && mode !== 'import' && (
          <div>
            <Select
              {...register('toAccountId')}
              label={`${t('fields.toAccount')} *`}
              error={errors.toAccountId?.message}
            >
              <option value="">{t('placeholders.selectDestination')}</option>
              {getAvailableToAccounts().map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t('fields.amount')} <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
              {selectedAccount
                ? selectedAccount.currency === 'CLP'
                  ? '$'
                  : selectedAccount.currency === 'USD'
                    ? 'US$'
                    : '€'
                : '$'}
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder={t('placeholders.amount')}
              className={`w-full pl-12 pr-3 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-input ${errors.amount ? 'border-destructive' : 'border-input'
                }`}
              value={formattedAmount}
              onChange={handleAmountChange}
              onFocus={handleAmountFocus}
              onBlur={handleAmountBlur}
              required
            />
          </div>
          {errors.amount && <p className="text-destructive text-sm mt-1" role="alert">{errors.amount.message}</p>}
        </div>

        {/* AI Suggested Category (only in import mode) */}
        {mode === 'import' && suggestedCategory && (
          <div className="p-3 bg-blue-50/50 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              <span className="font-medium">AI Suggestion:</span> {suggestedCategory}
            </p>
          </div>
        )}

        {/* Category */}
        <CategorySelector
          value={watch('categoryId')}
          onChange={(categoryId) => setValue('categoryId', categoryId)}
          type={selectedType}
          error={errors.categoryId?.message}
        />

        {/* Payee (quien recibe el pago) */}
        {selectedType !== 'TRANSFER' && mode !== 'import' && (
          <PayeeAutocomplete
            label={t('fields.payee')}
            value={watch('payee') || ''}
            onChange={(value) => setValue('payee', value)}
            error={errors.payee?.message}
            placeholder={t('placeholders.payee')}
          />
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('fields.description')}</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-input"
            placeholder={t('placeholders.description')}
          />
          {errors.description && (
            <p className="text-destructive text-sm mt-1" role="alert">{errors.description.message}</p>
          )}
        </div>

        {/* Date */}
        {mode === 'import' ? (
          <DateTimePicker
            label={t('fields.date')}
            value={watch('date')}
            onChange={(value) => setValue('date', value)}
            error={errors.date?.message}
            includeTime={false}
            placeholder={t('placeholders.selectDate')}
          />
        ) : (

          <DateTimePicker
            label={t('fields.dateTime')}
            value={watch('date')}
            onChange={(value) => setValue('date', value)}
            error={errors.date?.message}
            includeTime={true}
            placeholder={t('placeholders.selectDateTime')}
          />
        )}

        {/* Tags */}
        <TagSelector
          value={selectedTags}
          onChange={(tags) => setValue('tags', tags)}
          error={errors.tags?.message}
        />

        {/* Shared Expense */}
        {selectedType === 'EXPENSE' && !editingTransaction && mode !== 'import' && (
          <SharedExpenseForm
            enabled={isSharedExpense}
            onToggle={setIsSharedExpense}
            totalAmount={selectedAmount}
            currency={selectedAccount?.currency || 'CLP'}
            onChange={setSharedExpenseData}
          />
        )}

        {/* Shared Group (simplified for import mode) */}
        {mode === 'import' && selectedType === 'EXPENSE' && initialData?.sharedGroup && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Shared Group
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-muted-foreground"
              value={initialData.sharedGroup}
              disabled
            />
            <p className="text-xs text-muted-foreground mt-1">Shared group will be processed during import</p>
          </div>
        )}

        {/* Notes (for import mode) */}
        {mode === 'import' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t('fields.notes')}
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-input"
              placeholder={t('placeholders.notes')}
            />
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <Button type="submit" className="flex-1" disabled={isSaving}>
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>{tCommon('actions.saving')}</span>
              </div>
            ) : (
              <span>{mode === 'import' ? tCommon('actions.save') : editingTransaction ? tCommon('actions.update') : tCommon('actions.create')}</span>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            {tCommon('actions.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
