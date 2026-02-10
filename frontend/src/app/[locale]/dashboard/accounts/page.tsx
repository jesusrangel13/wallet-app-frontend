'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { accountAPI } from '@/lib/api'
import type { Account, CreateAccountForm } from '@/types'
import { CURRENCIES, type Currency } from '@/types/currency'
import { Wallet, Plus, CreditCard } from 'lucide-react'
import DeleteAccountModal from '@/components/DeleteAccountModal'
import { LoadingPage, LoadingOverlay } from '@/components/ui/Loading'
import AccountsCardView from '@/components/accounts/AccountsCardView'
import { Skeleton } from '@/components/ui/Skeleton'
import { useGlobalErrorHandler } from '@/hooks/useGlobalErrorHandler'
import { AccountsPageSkeleton } from '@/components/ui/PageSkeletons'
import { PageTransition } from '@/components/ui/animations'
import { AccountsViewVariants } from '@/components/accounts/AccountsViewVariants'
import { EmptyState } from '@/components/ui/EmptyState'


const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CASH', 'DEBIT', 'CREDIT', 'SAVINGS', 'INVESTMENT']),
  balance: z.coerce.number().min(0, 'Balance must be positive'),
  currency: z.enum(['CLP', 'USD', 'EUR']).default('CLP'),
  isDefault: z.boolean().default(false),
  includeInTotalBalance: z.boolean().default(true),
  creditLimit: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.coerce.number().positive().optional()),
  billingDay: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.coerce.number().min(1).max(31).optional()),
}).refine(
  (data) => {
    // If type is CREDIT, creditLimit and billingDay are required
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

export default function AccountsPage() {
  const router = useRouter()
  const t = useTranslations('accounts')
  const tCommon = useTranslations('common')
  const tLoading = useTranslations('loading')
  const { handleError } = useGlobalErrorHandler()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefetching, setIsRefetching] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null)
  const [transactionCount, setTransactionCount] = useState(0)


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

  const loadAccounts = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true)
      } else {
        setIsRefetching(true)
      }
      const response = await accountAPI.getAll()
      // Handle flexible response format (array or paginated structure)
      const accountsData = response.data as any
      setAccounts(Array.isArray(accountsData) ? accountsData : accountsData.data)
    } catch (error) {
      handleError(error)
    } finally {
      if (isInitial) {
        setIsLoading(false)
      } else {
        setIsRefetching(false)
      }
    }
  }, [handleError])

  useEffect(() => {
    loadAccounts(true)
  }, [loadAccounts])

  useEffect(() => {
    if (editingAccount) {
      reset({
        name: editingAccount.name,
        type: editingAccount.type,
        balance: Number(editingAccount.balance),
        currency: editingAccount.currency as Currency,
        isDefault: editingAccount.isDefault,
        includeInTotalBalance: editingAccount.includeInTotalBalance,
        creditLimit: editingAccount.creditLimit ? Number(editingAccount.creditLimit) : undefined,
        billingDay: editingAccount.billingDay,
      })
    } else {
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
    }
  }, [editingAccount, reset])

  const onSubmit = async (data: AccountFormData) => {
    try {
      console.log('Form submitted with data:', data)
      setIsSubmitting(true)
      if (editingAccount) {
        console.log('Updating account:', editingAccount.id)
        await accountAPI.update(editingAccount.id, data)
        toast.success('Account updated successfully')
      } else {
        console.log('Creating new account')
        await accountAPI.create(data as CreateAccountForm)
        toast.success('Account created successfully')
      }
      setIsModalOpen(false)
      setEditingAccount(null)
      reset()
      await loadAccounts(false)
    } catch (error) {
      handleError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (account: Account) => {
    setEditingAccount(account)
    setIsModalOpen(true)
  }

  const handleDeleteClick = async (account: Account) => {
    // First, try to delete without transferToAccountId to check if it has transactions
    try {
      const response = await accountAPI.delete(account.id)

      if (response.data.data.hasTransactions) {
        // Has transactions, show modal
        setDeletingAccount(account)
        setTransactionCount(response.data.data.transactionCount || 0)
        setIsDeleteModalOpen(true)
      } else {
        // No transactions, deleted successfully
        toast.success(response.data.data.message)
        await loadAccounts(false)
      }
    } catch (error) {
      handleError(error)
    }
  }

  const handleDeleteConfirm = async (transferToAccountId?: string) => {
    if (!deletingAccount) return

    try {
      const response = await accountAPI.delete(deletingAccount.id, transferToAccountId)
      toast.success(response.data.data.message)
      await loadAccounts(false)
      setIsDeleteModalOpen(false)
      setDeletingAccount(null)
      setTransactionCount(0)
    } catch (error) {
      handleError(error)
      throw error
    }
  }

  const handleAddNew = () => {
    setEditingAccount(null)
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
    return <AccountsPageSkeleton />
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header - Always visible */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-blue-600" />
              {t('title')}
            </h1>
            <p className="page-subtitle">{t('subtitle')}</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            {t('new')}
          </Button>
        </div>

        {/* Accounts Display - With localized loading */}
        <div className="relative space-y-6">
          {/* Refetching overlay */}
          {isRefetching && (
            <LoadingOverlay message={tLoading('updating')} />
          )}

          {/* Accounts content */}
          {accounts.length === 0 ? (
            <EmptyState
              type="accounts"
              title={tCommon('empty.accounts.title')}
              description={tCommon('empty.accounts.description')}
              actionLabel={t('new')}
              onAction={handleAddNew}
            />
          ) : (
            <AccountsViewVariants
              accounts={accounts}
              onNavigate={(id) => router.push(`/dashboard/accounts/${id}`)}
            />
          )}
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingAccount(null)
            reset()
          }}
          title={editingAccount ? t('edit') : t('new')}
        >
          <form onSubmit={handleSubmit(onSubmit, (errors) => console.log('Form validation failed:', errors))} className="space-y-4">
            <Input
              label={t('name')}
              placeholder={t('placeholders.name')}
              error={errors.name?.message}
              {...register('name')}
            />

            <div>
              <Select
                {...register('type')}
                label={t('type')}
              >
                <option value="CASH">{t('types.CASH')}</option>
                <option value="DEBIT">{t('types.DEBIT_CARD')}</option>
                <option value="CREDIT">{t('types.CREDIT_CARD')}</option>
                <option value="SAVINGS">{t('types.SAVINGS')}</option>
                <option value="INVESTMENT">{t('types.INVESTMENT')}</option>
              </Select>
              {errors.type && (
                <p className="form-error mt-1">{errors.type.message}</p>
              )}
            </div>

            <Input
              label={t('balance')}
              type="number"
              step="0.01"
              placeholder={t('placeholders.initialBalance')}
              error={errors.balance?.message}
              {...register('balance')}
            />

            <div>
              <Select
                {...register('currency')}
                label={t('currency')}
              >
                {Object.entries(CURRENCIES).map(([code, info]) => (
                  <option key={code} value={code}>
                    {info.symbol} {info.name} ({code})
                  </option>
                ))}
              </Select>
              {errors.currency && (
                <p className="form-error mt-1">{errors.currency.message}</p>
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
                className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary bg-white dark:bg-card"
              />
              <label htmlFor="isDefault" className="form-label">
                Set as default account
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeInTotalBalance"
                {...register('includeInTotalBalance')}
                className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary bg-white dark:bg-card"
              />
              <label htmlFor="includeInTotalBalance" className="form-label">
                Include in total balance
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingAccount(null)
                  reset()
                }}
                className="flex-1"
              >
                {tCommon('actions.cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                {editingAccount ? tCommon('actions.update') : tCommon('actions.create')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Account Modal */}
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false)
            setDeletingAccount(null)
            setTransactionCount(0)
          }}
          onConfirm={handleDeleteConfirm}
          account={deletingAccount}
          accounts={accounts}
          transactionCount={transactionCount}
        />
      </div>
    </PageTransition>
  )
}
