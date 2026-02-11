'use client'

import { useState, useEffect, useCallback } from 'react'


import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Account } from '@/types'
import { AccountCard } from '@/components/widgets/AccountCard'
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

const getCurrencyConfig = (currency: string) => {
  switch (currency) {
    case 'CLP': return { locale: 'es-CL', chunk: '.', decimal: ',' }
    case 'EUR': return { locale: 'de-DE', chunk: '.', decimal: ',' }
    default: return { locale: 'en-US', chunk: ',', decimal: '.' }
  }
}

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
    getValues,
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
    if (!value && value !== 0) return ''

    const { chunk, decimal, locale } = getCurrencyConfig(currency)

    // Clean value to standard number
    let numValue = value
    if (typeof value === 'string') {
      const standard = value.split(chunk).join('').split(decimal).join('.')
      numValue = parseFloat(standard)
    }

    if (isNaN(numValue as number)) return ''

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: currency === 'CLP' ? 0 : 2,
      maximumFractionDigits: currency === 'CLP' ? 0 : 2,
    }).format(numValue as number)
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

  // Auto-scroll account carousel to selection
  useEffect(() => {
    if (selectedAccountId && isOpen) {
      setTimeout(() => {
        const element = document.getElementById(`account-card-${selectedAccountId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
      }, 100)
    }
  }, [selectedAccountId, isOpen])

  // Smart Pre-fill: Auto-fill category, account, and amount based on payee
  const watchedPayee = watch('payee')
  useEffect(() => {
    // Only run if:
    // 1. We have a payee with at least 3 chars
    // 2. Not editing an existing transaction (only for new ones)
    // 3. Not in import mode (imports already have data)
    if (!watchedPayee || watchedPayee.length < 3 || editingTransaction || mode === 'import') return

    const timer = setTimeout(async () => {
      try {
        const { transactionAPI } = await import('@/services/transaction.service')
        const response = await transactionAPI.getLastByPayee(watchedPayee)

        if (response.data && response.data.data) {
          const lastTx = response.data.data

          // Auto-fill Logic:
          // 1. Account: Only if not already selected
          const currentAccountId = getValues('accountId')
          if (lastTx.accountId && !currentAccountId) {
            const accountExists = accounts.find(a => a.id === lastTx.accountId)
            if (accountExists) {
              setValue('accountId', lastTx.accountId, { shouldDirty: true })
            }
          }

          // 2. Category: Only if not already selected
          const currentCategoryId = getValues('categoryId')
          if (lastTx.categoryId && !currentCategoryId) {
            setValue('categoryId', lastTx.categoryId, { shouldDirty: true })
          }

          // 3. Amount: Only if current amount is 0/empty
          const currentAmount = getValues('amount')
          if (!currentAmount || currentAmount === 0) {
            const amount = Number(lastTx.amount)
            setValue('amount', amount, { shouldDirty: true })

            // Format the amount display
            const currency = accounts.find(a => a.id === (lastTx.accountId))?.currency || 'CLP'
            setFormattedAmount(formatAmountDisplay(amount, currency))
          }
        }
      } catch (error) {
        // Silently fail if no previous transaction found or error
        console.debug('No previous transaction found for payee', error)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [watchedPayee, editingTransaction, mode, setValue, accounts, formatAmountDisplay, getValues])

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
    const { value } = e.target
    const currency = selectedAccount?.currency || 'CLP'
    const { chunk, decimal, locale } = getCurrencyConfig(currency)

    // 1. Remove chunks (thousands separators)
    let raw = value.split(chunk).join('')

    // 2. Replace localized decimal with standard dot
    // If multiple decimals, take only the last one? Or reject? Let's just standard replace.
    // Actually, ensure only one decimal exists in the raw string for safety.
    // If user types '1,000,50' (as decimal), that's invalid.

    // Allow empty
    if (raw === '') {
      setFormattedAmount('')
      setValue('amount', 0)
      return
    }

    // Handle decimal typing (e.g. "10,")
    const isDecimalInput = raw.endsWith(decimal)
    if (isDecimalInput) {
      // Just show the decimal char if it's the first one
      // and if currency supports decimals (CLP usually doesn't, but let's allow typing if user insists?)
      // Actually CLP has 0 decimals in my config, so maybe block decimal input?
      if (currency === 'CLP') {
        // strip it
        raw = raw.slice(0, -1)
      } else {
        // Let it be, update formatted state directly to show comma
        setFormattedAmount(value)
        return
      }
    }

    // Standardize for parsing
    const standard = raw.split(decimal).join('.')

    // Validate number
    if (isNaN(Number(standard))) return

    const numValue = parseFloat(standard)

    // Update Form State (always standard number)
    setValue('amount', numValue)

    // Update Visual State (Formatted)
    // Avoid formatting if user is typing decimal part
    if (raw.includes(decimal) && currency !== 'CLP') {
      const parts = raw.split(decimal)
      if (parts[1].length <= 2) {
        setFormattedAmount(value) // keep typing 
        return
      }
    }

    // Otherwise format nicely
    const formatted = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'CLP' ? 0 : 2 // Allow typing up to 2
    }).format(numValue)

    // If result is exactly what user typed (minus maybe some leading zeros), use it?
    // Actually, just setFormattedAmount(formatted) works for integers nicely.
    // e.g. type 1000 -> 1.000
    setFormattedAmount(formatted)
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
                id="transaction-amount-input"
                type="text"
                inputMode="decimal"
                placeholder="0"
                className="w-auto min-w-[120px] max-w-full text-center bg-transparent border-none text-5xl sm:text-6xl font-bold p-0 focus:ring-0 placeholder:text-gray-200 dark:placeholder:text-gray-800 tabular-nums tracking-tighter transition-all"
                style={{ width: `${Math.max(1, formattedAmount.length) * 0.6 + 0.5}em` }}
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
                {accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    variant="compact"
                    isSelected={selectedAccountId === account.id}
                    onClick={() => setValue('accountId', account.id)}
                    className="snap-start"
                  />
                ))}
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
          {selectedType === 'EXPENSE' && mode !== 'import' && (
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
