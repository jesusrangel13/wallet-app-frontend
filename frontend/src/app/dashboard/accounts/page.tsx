'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { accountAPI } from '@/lib/api'
import type { Account, CreateAccountForm } from '@/types'
import { CURRENCIES, type Currency } from '@/types/currency'
import { Wallet, Plus } from 'lucide-react'
import DeleteAccountModal from '@/components/DeleteAccountModal'
import { LoadingPage, LoadingOverlay, LoadingMessages } from '@/components/ui/Loading'
import AccountsCardView from '@/components/accounts/AccountsCardView'
import { Skeleton } from '@/components/ui/Skeleton'

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

  useEffect(() => {
    loadAccounts(true)
  }, [])

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

  const loadAccounts = async (isInitial = false) => {
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
    } catch (error: any) {
      toast.error('Failed to load accounts')
      console.error(error)
    } finally {
      if (isInitial) {
        setIsLoading(false)
      } else {
        setIsRefetching(false)
      }
    }
  }

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
    } catch (error: any) {
      console.error('Error saving account:', error)
      toast.error(error.response?.data?.message || 'Failed to save account')
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account')
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
    return (
      <div className="space-y-6">
        {/* Header con título y botón */}
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Grid de tarjetas de cuentas (3 columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Always visible */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600 mt-1">Manage your financial accounts</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Accounts Display - With localized loading */}
      <div className="relative">
        {/* Refetching overlay */}
        {isRefetching && (
          <LoadingOverlay message={LoadingMessages.updating} />
        )}

        {/* Accounts content */}
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">No accounts yet</p>
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first account
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <AccountsCardView
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
        title={editingAccount ? 'Edit Account' : 'Add New Account'}
      >
        <form onSubmit={handleSubmit(onSubmit, (errors) => console.log('Form validation failed:', errors))} className="space-y-4">
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
            label={editingAccount ? 'Current Balance' : 'Initial Balance'}
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
                setEditingAccount(null)
                reset()
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              {editingAccount ? 'Update' : 'Create'} Account
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
  )
}
