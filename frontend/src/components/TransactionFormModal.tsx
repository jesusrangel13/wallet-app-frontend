'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { SuccessAnimation, ShakeAnimation } from '@/components/ui/animations'

const transactionSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
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
  initialSharedExpenseData?: SharedExpenseData | null
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
  initialSharedExpenseData,
  mode = 'create',
}: TransactionFormModalProps) {
  const t = useTranslations('transactions')
  const tCommon = useTranslations('common')
  const [isSharedExpense, setIsSharedExpense] = useState(!!initialSharedExpenseData)
  const [sharedExpenseData, setSharedExpenseData] = useState<SharedExpenseData | null>(initialSharedExpenseData || null)
  const [isSaving, setIsSaving] = useState(false)
  const [formattedAmount, setFormattedAmount] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

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

  const formatAmountDisplay = useCallback((value: string | number, currency: string): string => {
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
  }, [])


  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key as keyof TransactionFormData, value)
      })
      if (initialData.amount) {
        setFormattedAmount(initialData.amount.toString())
      }
    }
    // Sync shared expense data from props
    if (initialSharedExpenseData) {
      setSharedExpenseData(initialSharedExpenseData)
      setIsSharedExpense(true)
    } else {
      // If no initial shared data, we might want to reset, but only if we are strictly switching context
      // For now, let's rely on handleClose to reset state for new opens
    }
  }, [initialData, initialSharedExpenseData, setValue])

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
    // Remove existing commas to get raw number string
    const rawValue = e.target.value.replace(/,/g, '')

    // Allow empty or just a dot/comma for typing decimals
    if (rawValue === '' || rawValue === '.') {
      setFormattedAmount(rawValue)
      setValue('amount', 0)
      return
    }

    // Parse float
    const numValue = parseFloat(rawValue)
    if (!isNaN(numValue) && numValue >= 0) {
      // Logic for "Fintech" formatting while typing:
      // If user types '1000' -> show '1,000' immediately
      // But preserving decimal typing is tricky.
      // Simple strategy: exact match formatting for integers, allow decimals for typing.

      if (rawValue.includes('.')) {
        // User is typing decimals, keep raw input to avoid cursor jumps or messing up '.0'
        setFormattedAmount(rawValue) // User manages the dot position
      } else {
        // Integer: format with commas immediately
        // e.g. '1000' -> '1,000'
        const formatted = new Intl.NumberFormat('en-US').format(numValue)
        setFormattedAmount(formatted)
      }
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
      // Inject categoryId from transaction into shared expense data if available
      // This ensures shared expenses inherit the category from the parent transaction
      let finalSharedData = sharedExpenseData
      if (sharedExpenseData && data.categoryId) {
        finalSharedData = {
          ...sharedExpenseData,
          categoryId: data.categoryId
        }
      }

      await onSubmit(data, finalSharedData)
      setShowSuccess(true)
      // Close handled by onComplete in SuccessAnimation
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      if (!showSuccess) {
        setIsSaving(false)
      }
    }
  }

  const handleSuccessComplete = () => {
    setShowSuccess(false)
    handleClose()
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

  const getTypeStyles = (type: string, isSelected: boolean) => {
    if (!isSelected) return 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
    switch (type) {
      case 'EXPENSE': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 shadow-sm ring-1 ring-red-200 dark:ring-red-500/30'
      case 'INCOME': return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 shadow-sm ring-1 ring-green-200 dark:ring-green-500/30'
      case 'TRANSFER': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 shadow-sm ring-1 ring-blue-200 dark:ring-blue-500/30'
      default: return ''
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getModalTitle()}>
      <SuccessAnimation
        show={showSuccess}
        message={editingTransaction ? t('successUpdate') : t('successCreate') || 'Transaction Saved!'}
        onComplete={handleSuccessComplete}
      />
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">

        {/* HERO: Transaction Type & Amount */}
        <div className="space-y-6">
          {/* Type Selector (Segmented Control) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 rounded-xl">
            {['EXPENSE', 'INCOME', 'TRANSFER'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue('type', type as any)}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${getTypeStyles(type, selectedType === type)}`}
              >
                {type === 'EXPENSE' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
                {type === 'INCOME' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                {type === 'TRANSFER' && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
                <span className="truncate">{t(`types.${type.toLowerCase()}`)}</span>
              </button>
            ))}
          </div>

          {/* Hero Amount Input */}
          <div className="relative flex flex-col items-center justify-center py-4">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('fields.amount')}</label>
            <div className="relative flex items-center justify-center">
              <span className="text-3xl sm:text-4xl text-muted-foreground font-medium mr-1 self-center relative -top-1">
                {selectedAccount?.currency === 'EUR' ? '€' : selectedAccount?.currency === 'USD' ? '$' : '$'}
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                className="w-full max-w-[200px] text-center bg-transparent border-none text-5xl sm:text-6xl font-bold p-0 focus:ring-0 placeholder:text-gray-200 dark:placeholder:text-gray-800 tabular-nums tracking-tighter"
                value={formattedAmount}
                onChange={handleAmountChange}
                onFocus={handleAmountFocus}
                onBlur={handleAmountBlur}
                autoFocus={!editingTransaction}
              />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-2 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full animate-bounce">{errors.amount.message}</p>}
          </div>
        </div>

        <div className="space-y-4">
          {/* Account Selection (Visual Grid) */}
          {mode !== 'import' && (
            <div className="space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100 fill-mode-backwards">
              <label className="text-sm font-medium text-foreground ml-1">{t('fields.account')}</label>
              <div className="flex overflow-x-auto pb-4 gap-3 snap-x no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {accounts.map((account) => {
                  const isSelected = selectedAccountId === account.id;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setValue('accountId', account.id)}
                      className={`
                        relative p-3 rounded-xl border-2 text-left transition-all duration-200 group overflow-hidden flex-shrink-0 w-36 sm:w-40 snap-start
                        ${isSelected
                          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                      `}
                    >
                      <div className="flex flex-col gap-1 z-10 relative">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/80'}`}>
                          {account.currency}
                        </span>
                        <span className="font-semibold text-sm truncate leading-tight" title={account.name}>
                          {account.name}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {formatAmountDisplay(account.balance, account.currency)}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 text-primary animate-in zoom-in duration-200">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {errors.accountId && <p className="text-destructive text-sm mt-1 animate-pulse">{errors.accountId.message}</p>}
            </div>
          )}

          {/* Destination Account (Transfer) */}
          {selectedType === 'TRANSFER' && mode !== 'import' && (
            <div className="grid gap-2 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-150 fill-mode-backwards">
              <label className="text-sm font-medium text-foreground ml-1">{t('fields.toAccount')}</label>
              <Select
                {...register('toAccountId')}
                error={errors.toAccountId?.message}
                className="h-12 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
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

          {/* Category & Tags Row */}
          <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-200 fill-mode-backwards">
            <CategorySelector
              value={watch('categoryId')}
              onChange={(categoryId) => setValue('categoryId', categoryId)}
              type={selectedType}
              error={errors.categoryId?.message}
            />

            <div className="space-y-1">
              {/* <label className="text-sm font-medium text-foreground ml-1">Etiquetas</label> */}
              <TagSelector
                value={selectedTags}
                onChange={(tags) => setValue('tags', tags)}
                error={errors.tags?.message}
              />
            </div>
          </div>

          {/* Description & Payee */}
          <div className="grid gap-4 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-300 fill-mode-backwards">
            {selectedType !== 'TRANSFER' && mode !== 'import' && (
              <PayeeAutocomplete
                label={t('fields.payee')}
                value={watch('payee') || ''}
                onChange={(value) => setValue('payee', value)}
                error={errors.payee?.message}
                placeholder={t('placeholders.payee')}
              />
            )}

            <div>
              <label className="text-sm font-medium text-foreground ml-1">{t('fields.description')}</label>
              <Input
                {...register('description')}
                className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                placeholder={t('placeholders.description')}
              />
              {errors.description && <p className="text-destructive text-sm mt-1">{errors.description.message}</p>}
            </div>
          </div>

          {/* Date Picker */}
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-500 delay-300 fill-mode-backwards">
            <DateTimePicker
              label={mode === 'import' ? t('fields.date') : t('fields.dateTime')}
              value={watch('date')}
              onChange={(value) => setValue('date', value)}
              error={errors.date?.message}
              includeTime={mode !== 'import'}
              placeholder={t('placeholders.selectDateTime')}
              maxDate={new Date()}
            />
          </div>

          {/* Advanced: Shared Expense Toggle */}
          {selectedType === 'EXPENSE' && !editingTransaction && mode !== 'import' && (
            <div className="pt-2 animate-in slide-in-from-bottom-2 fade-in duration-500 delay-500 fill-mode-backwards">
              <button
                type="button"
                onClick={() => setIsSharedExpense(!isSharedExpense)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isSharedExpense
                  ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isSharedExpense ? 'bg-primary text-primary-foreground' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${isSharedExpense ? 'text-primary' : 'text-foreground'}`}>{t('shared.label')}</p>
                    <p className="text-xs text-muted-foreground">{t('shared.subtitle')}</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${isSharedExpense ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${isSharedExpense ? 'left-5' : 'left-1'}`} />
                </div>
              </button>

              {isSharedExpense && (
                <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200 pl-2 border-l-2 border-primary/20 ml-6">
                  <SharedExpenseForm
                    enabled={true}
                    onToggle={() => { }} // Controlled by parent button now
                    totalAmount={selectedAmount}
                    currency={selectedAccount?.currency || 'CLP'}
                    onChange={setSharedExpenseData}
                    hideToggle={true} // New prop needed or just css hide
                  />
                </div>
              )}
            </div>
          )}

          {/* Notes Section for Import */}
          {mode === 'import' && (
            <div className="pt-2">
              <label className="text-sm font-medium text-foreground ml-1 mb-1 block">{t('fields.notes')}</label>
              <textarea
                {...register('notes')}
                rows={2}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-input"
                placeholder={t('placeholders.notes')}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving} className="flex-1 h-12 text-base rounded-xl border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" className="flex-[2] h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]" disabled={isSaving}>
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{tCommon('actions.saving')}</span>
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {mode === 'import' ? tCommon('actions.save') : editingTransaction ? tCommon('actions.update') : tCommon('actions.create')}
                {watch('amount') > 0 && (
                  <span className="opacity-90 font-mono">
                    {selectedAccount?.currency === 'EUR' ? '€' : selectedAccount?.currency === 'USD' ? '$' : '$'}
                    {formatAmountDisplay(watch('amount'), selectedAccount?.currency || 'CLP')}
                  </span>
                )}
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
