'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { accountAPI } from '@/lib/api'
import type { Account, AccountType, CreateAccountForm } from '@/types'
import { formatCurrency, CURRENCIES, type Currency } from '@/types/currency'
import { Wallet, CreditCard, Banknote, Landmark, TrendingUp, Edit, Trash2, Plus, Star } from 'lucide-react'
import DeleteAccountModal from '@/components/DeleteAccountModal'

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['CASH', 'DEBIT', 'CREDIT', 'SAVINGS', 'INVESTMENT']),
  balance: z.coerce.number().min(0, 'Balance must be positive'),
  currency: z.enum(['CLP', 'USD', 'EUR']).default('CLP'),
  isDefault: z.boolean().default(false),
  creditLimit: z.coerce.number().positive().optional(),
  billingDay: z.coerce.number().min(1).max(31).optional(),
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

const accountTypeIcons: Record<AccountType, any> = {
  CASH: Banknote,
  DEBIT: CreditCard,
  CREDIT: CreditCard,
  SAVINGS: Landmark,
  INVESTMENT: TrendingUp,
}

const accountTypeColors: Record<AccountType, string> = {
  CASH: 'bg-green-100 text-green-700',
  DEBIT: 'bg-blue-100 text-blue-700',
  CREDIT: 'bg-purple-100 text-purple-700',
  SAVINGS: 'bg-yellow-100 text-yellow-700',
  INVESTMENT: 'bg-indigo-100 text-indigo-700',
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
    },
  })

  const selectedType = watch('type')

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (editingAccount) {
      reset({
        name: editingAccount.name,
        type: editingAccount.type,
        balance: Number(editingAccount.balance),
        currency: editingAccount.currency as Currency,
        isDefault: editingAccount.isDefault,
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
        creditLimit: undefined,
        billingDay: undefined,
      })
    }
  }, [editingAccount, reset])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await accountAPI.getAll()
      setAccounts(response.data.data)
    } catch (error: any) {
      toast.error('Failed to load accounts')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: AccountFormData) => {
    try {
      setIsSubmitting(true)
      if (editingAccount) {
        await accountAPI.update(editingAccount.id, data)
        toast.success('Account updated successfully')
      } else {
        await accountAPI.create(data as CreateAccountForm)
        toast.success('Account created successfully')
      }
      setIsModalOpen(false)
      setEditingAccount(null)
      reset()
      await loadAccounts()
    } catch (error: any) {
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
        await loadAccounts()
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
      await loadAccounts()
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
      creditLimit: undefined,
      billingDay: undefined,
    })
    setIsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Accounts Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const Icon = accountTypeIcons[account.type]
            const colorClass = accountTypeColors[account.type]

            return (
              <Card key={account.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${colorClass}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        {account.isDefault && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 capitalize">
                        {account.type.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {account.type === 'CREDIT' ? (
                    <>
                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Credit Limit</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(Number(account.creditLimit || 0), account.currency as Currency)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Available</p>
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(Number(account.balance), account.currency as Currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Used</p>
                            <p className="text-sm font-semibold text-red-600">
                              {formatCurrency(Number(account.creditLimit || 0) - Number(account.balance), account.currency as Currency)}
                            </p>
                          </div>
                        </div>
                        {account.billingDay && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Billing Day</p>
                            <p className="text-sm font-medium text-gray-700">Day {account.billingDay} of each month</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Balance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(Number(account.balance), account.currency as Currency)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {CURRENCIES[account.currency as Currency]?.name || account.currency}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(account)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(account)}
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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
