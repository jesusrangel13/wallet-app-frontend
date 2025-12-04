'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Account } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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

  const getAvailableToAccounts = () => {
    if (!selectedAccountId) return []
    const selectedAcc = accounts.find((a) => a.id === selectedAccountId)
    if (!selectedAcc) return []

    // Only show accounts with the same currency
    return accounts.filter(
      (a) => a.id !== selectedAccountId && a.currency === selectedAcc.currency
    )
  }

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
    if (mode === 'import') return 'Edit Transaction'
    return editingTransaction ? 'Edit Transaction' : 'New Transaction'
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={getModalTitle()}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Transaction Type - Tabs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setValue('type', 'EXPENSE')}
              className={`py-3 px-4 rounded-md text-sm font-medium transition-all ${
                selectedType === 'EXPENSE'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <span>Expense</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'INCOME')}
              className={`py-3 px-4 rounded-md text-sm font-medium transition-all ${
                selectedType === 'INCOME'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>Income</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setValue('type', 'TRANSFER')}
              className={`py-3 px-4 rounded-md text-sm font-medium transition-all ${
                selectedType === 'TRANSFER'
                  ? 'bg-blue-400 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Transfer</span>
              </div>
            </button>
          </div>
          {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
        </div>

        {/* Account */}
        {mode !== 'import' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account <span className="text-red-500">*</span>
            </label>
            <select
              {...register('accountId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>
            )}
          </div>
        )}

        {/* To Account (for transfers) */}
        {selectedType === 'TRANSFER' && mode !== 'import' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Account <span className="text-red-500">*</span>
            </label>
            <select
              {...register('toAccountId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select destination account...</option>
              {getAvailableToAccounts().map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
            {errors.toAccountId && (
              <p className="text-red-500 text-sm mt-1">{errors.toAccountId.message}</p>
            )}
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
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
              placeholder="0.00"
              className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              value={formattedAmount}
              onChange={handleAmountChange}
              onFocus={handleAmountFocus}
              onBlur={handleAmountBlur}
              required
            />
          </div>
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
        </div>

        {/* AI Suggested Category (only in import mode) */}
        {mode === 'import' && suggestedCategory && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
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
            label="Payee (Who received the payment)"
            value={watch('payee') || ''}
            onChange={(value) => setValue('payee', value)}
            error={errors.payee?.message}
            placeholder="e.g., McDonald's, Uber, Enel"
          />
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add details about this transaction..."
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Date */}
        {mode === 'import' ? (
          <DateTimePicker
            label="Date"
            value={watch('date')}
            onChange={(value) => setValue('date', value)}
            error={errors.date?.message}
            includeTime={false}
            placeholder="Select date..."
          />
        ) : (
          
          <DateTimePicker
            label="Date & Time"
            value={watch('date')}
            onChange={(value) => setValue('date', value)}
            error={errors.date?.message}
            includeTime={true}
            placeholder="Select date and time..."
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shared Group
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              value={initialData.sharedGroup}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Shared group will be processed during import</p>
          </div>
        )}

        {/* Notes (for import mode) */}
        {mode === 'import' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional notes"
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
                <span>Saving...</span>
              </div>
            ) : (
              <span>{mode === 'import' ? 'Save Changes' : editingTransaction ? 'Update Transaction' : 'Create Transaction'}</span>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  )
}
