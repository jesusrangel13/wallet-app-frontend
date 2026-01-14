'use client'

import { formatCurrency, type Currency, CURRENCIES } from '@/types/currency'
import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useAccountBalances } from '@/hooks/useDashboard'
import { useCreateAccount } from '@/hooks/useAccounts'
import { Plus } from 'lucide-react'
import { getAccountIcon } from '@/utils/accountIcons'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { CreateAccountForm, AccountType } from '@/types'

// Validation schema
const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CASH', 'DEBIT', 'CREDIT', 'SAVINGS', 'INVESTMENT']),
  balance: z.coerce.number().min(0, 'Balance must be positive'),
  currency: z.enum(['CLP', 'USD', 'EUR']).default('CLP'),
  isDefault: z.boolean().default(false),
  includeInTotalBalance: z.boolean().default(true),
  accountNumber: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().regex(/^\d+$/, 'Only numbers allowed').optional()
  ),
  color: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color').optional()
  ),
  creditLimit: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.coerce.number().positive().optional()),
  billingDay: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.coerce.number().min(1).max(31).optional()),
}).refine(
  (data) => {
    if (data.type === 'CREDIT') {
      return data.creditLimit && data.creditLimit > 0 && data.billingDay && data.billingDay >= 1 && data.billingDay <= 31;
    }
    return true;
  },
  {
    message: 'Credit limit and billing day are required for credit cards',
    path: ['creditLimit'],
  }
)

type AccountFormData = z.infer<typeof accountSchema>

interface AccountBalance {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  creditLimit: number | null
  color: string
}

interface AccountBalancesWidgetProps {
  gridWidth?: number
  gridHeight?: number
}

export const AccountBalancesWidget = ({ gridWidth = 4, gridHeight = 1 }: AccountBalancesWidgetProps) => {
  const t = useTranslations('widgets.accountBalances')
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Use React Query hooks for data fetching and mutations
  const { data: response, isLoading } = useAccountBalances()
  const createAccountMutation = useCreateAccount()

  const accounts = response || []

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      currency: 'CLP',
      balance: 0,
      isDefault: false,
      includeInTotalBalance: true,
    },
  })

  const selectedType = watch('type')

  const onSubmit = async (data: AccountFormData) => {
    try {
      await createAccountMutation.mutateAsync(data as CreateAccountForm)
      toast.success('Account created successfully')
      setIsModalOpen(false)
      reset()
    } catch (error: any) {
      console.error('Error saving account:', error)
      toast.error(error.response?.data?.message || 'Failed to save account')
    }
  }

  const handleAddAccount = () => {
    reset({
      name: '',
      type: 'CASH',
      balance: 0,
      currency: 'CLP',
      isDefault: false,
      includeInTotalBalance: true,
      creditLimit: undefined,
      billingDay: undefined,
    })
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <Card className="h-[140px]">
        <CardContent className="h-full flex items-center justify-center !p-0">
          <div className="animate-pulse h-20 w-full bg-gray-200 rounded mx-4"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[140px]">
      <CardContent className="h-full flex items-center !p-0">
        {accounts.length > 0 ? (
          <div className="relative w-full h-full flex items-center px-4">
            {/* Carousel container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory w-full"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {accounts.map((account: AccountBalance) => {
                // Calculate spent and percentage for credit cards
                const isCreditCard = account.type === 'CREDIT' && account.creditLimit
                const spent = isCreditCard ? account.creditLimit! - account.balance : 0
                const percentageUsed = isCreditCard ? (spent / account.creditLimit!) * 100 : 0

                // Get icon component for this account type
                const IconComponent = getAccountIcon(account.type as AccountType)

                return (
                  <button
                    key={account.id}
                    onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
                    className="min-w-[230px] flex-shrink-0 px-3 py-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors snap-start cursor-pointer text-left relative overflow-hidden"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
                      style={{ backgroundColor: account.color }}
                    />
                    {isCreditCard ? (
                      <div className="flex flex-col gap-1 pl-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-3 h-3" style={{ color: account.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-xs text-gray-900 truncate">{account.name}</h3>
                          </div>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-[9px] text-gray-500 uppercase tracking-wide">{t('spent')}</span>
                          <p className="font-semibold text-sm text-gray-900 tabular-nums">
                            {formatCurrency(spent, account.currency as Currency)}
                          </p>
                        </div>
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(Math.max(percentageUsed, 0), 100)}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-gray-500 truncate">
                          {t('available')}: <span className="font-medium text-gray-700">{formatCurrency(account.balance, account.currency as Currency)}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 pl-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <IconComponent className="w-3 h-3" style={{ color: account.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs text-gray-900 truncate">{account.name}</p>
                          </div>
                        </div>
                        <div className="text-left mt-0.5">
                          <p className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">{t('balance')}</p>
                          <p className="font-semibold text-base text-gray-900 tabular-nums">
                            {formatCurrency(account.balance, account.currency as Currency)}
                          </p>
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}

              {/* Add Account Card */}
              <button
                onClick={handleAddAccount}
                className="min-w-[230px] flex-shrink-0 px-3 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50/50 transition-all snap-start flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-600">{t('addAccount')}</span>
              </button>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full px-4">
            <p className="text-gray-500 text-center text-xs mb-4">
              {t('noAccountsYet')}
            </p>
            <button
              onClick={handleAddAccount}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {t('addAccountButton')}
            </button>
          </div>
        )}

        {/* Custom CSS to hide scrollbar */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </CardContent>

      {/* Add Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          reset()
        }}
        title="Add New Account"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Account Name"
            placeholder="e.g., Main Wallet, Savings Account"
            error={errors.name?.message}
            {...register('name')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CASH">Cash</option>
              <option value="DEBIT">Debit Card</option>
              <option value="CREDIT">Credit Card</option>
              <option value="SAVINGS">Savings</option>
              <option value="INVESTMENT">Investment</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          <Input
            label="Initial Balance"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.balance?.message}
            {...register('balance')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              {...register('currency')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.symbol} {info.name} ({code})
                </option>
              ))}
            </select>
            {errors.currency && (
              <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>
            )}
          </div>

          <Input
            label="Account Number (optional)"
            placeholder="e.g., 1234567890"
            error={errors.accountNumber?.message}
            {...register('accountNumber')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                {...register('color')}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <Input
                placeholder="#3B82F6"
                error={errors.color?.message}
                {...register('color')}
                className="flex-1"
              />
            </div>
            {errors.color && (
              <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
            )}
          </div>

          {/* Credit card specific fields */}
          {selectedType === 'CREDIT' && (
            <>
              <Input
                label="Credit Limit"
                type="number"
                step="0.01"
                placeholder="Enter credit limit"
                error={errors.creditLimit?.message}
                {...register('creditLimit')}
              />

              <Input
                label="Billing Day (1-31)"
                type="number"
                min="1"
                max="31"
                placeholder="Day of month for statement generation"
                error={errors.billingDay?.message}
                {...register('billingDay')}
              />
            </>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              {...register('isDefault')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
              Set as default account
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeInTotalBalance"
              {...register('includeInTotalBalance')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeInTotalBalance" className="text-sm font-medium text-gray-700">
              Include in total balance
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false)
                reset()
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createAccountMutation.isPending} className="flex-1">
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  )
}
