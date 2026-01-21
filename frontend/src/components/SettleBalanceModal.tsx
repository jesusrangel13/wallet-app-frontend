'use client'

import { useState, useEffect, useCallback, useId } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from './ui/Modal'
import { Account } from '@/types'
import { accountAPI, userAPI } from '@/lib/api'
import { toast } from 'sonner'
import { useGlobalErrorHandler } from '@/hooks/useGlobalErrorHandler'
import { useSettleBalance } from '@/hooks/useGroups'

interface SettleBalanceModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  otherUserId: string
  otherUserName: string
  amount: number
  onSuccess?: () => void
}

export function SettleBalanceModal({
  isOpen,
  onClose,
  groupId,
  otherUserId,
  otherUserName,
  amount,
  onSuccess,
}: SettleBalanceModalProps) {
  const t = useTranslations('groups')
  const { handleError } = useGlobalErrorHandler()
  const settleBalance = useSettleBalance()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [defaultAccountId, setDefaultAccountId] = useState<string | null>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  // Accessibility IDs
  const accountSelectId = useId()

  const loadAccountsAndDefault = useCallback(async () => {
    try {
      setLoadingAccounts(true)
      const [accountsRes, profileRes] = await Promise.all([
        accountAPI.getAll(),
        userAPI.getProfile(),
      ])

      // Handle paginated response - data is in accountsRes.data.data.data
      const accountsData = Array.isArray(accountsRes.data.data)
        ? accountsRes.data.data
        : accountsRes.data.data.data || []

      const activeAccounts = accountsData.filter(
        (account: Account) => !account.isArchived
      )
      setAccounts(activeAccounts)

      const defaultId = profileRes.data.data.defaultSharedExpenseAccountId
      setDefaultAccountId(defaultId || null)

      // Pre-select the default account if available
      if (defaultId && activeAccounts.some((acc: Account) => acc.id === defaultId)) {
        setSelectedAccountId(defaultId)
      } else if (activeAccounts.length > 0) {
        // Otherwise select the first account
        setSelectedAccountId(activeAccounts[0].id)
      }
    } catch (error) {
      handleError(error)
    } finally {
      setLoadingAccounts(false)
    }
  }, [handleError])

  useEffect(() => {
    if (isOpen) {
      loadAccountsAndDefault()
    }
  }, [isOpen, loadAccountsAndDefault])

  const handleSettle = () => {
    if (!selectedAccountId) {
      toast.error(t('payment.toasts.selectAccountFirst'))
      return
    }

    settleBalance.mutate(
      {
        groupId,
        otherUserId,
        accountId: selectedAccountId,
      },
      {
        onSuccess: (response) => {
          if (response.data.transactionsCreated) {
            toast.success(t('payment.toasts.balanceSettledWithTransactions'))
          } else {
            toast.success(t('payment.toasts.balanceSettledNoTransactions'))
          }
          onSuccess?.()
          onClose()
        },
        onError: (error) => {
          handleError(error)
        },
      }
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('payment.modal.settleBalanceTitle')}>
      <div className="space-y-4">
        {/* Amount info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            {t('payment.modal.balanceInfo', { amount: amount.toFixed(0), name: otherUserName })}
          </p>
        </div>

        {/* Account selection */}
        <div>
          <label
            htmlFor={accountSelectId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t('payment.modal.selectAccount')}
          </label>

          {loadingAccounts ? (
            <div className="text-sm text-gray-500" role="status" aria-live="polite">{t('payment.modal.loadingAccounts')}</div>
          ) : accounts.length === 0 ? (
            <div className="text-sm text-red-600" role="alert">
              {t('payment.modal.noActiveAccounts')}
            </div>
          ) : (
            <select
              id={accountSelectId}
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={settleBalance.isPending}
              aria-describedby={defaultAccountId === null ? 'account-hint' : undefined}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.currency} $
                  {Number(account.balance).toFixed(2)}
                  {defaultAccountId === account.id ? ` ${t('payment.modal.defaultBadge')}` : ''}
                </option>
              ))}
            </select>
          )}

          {!loadingAccounts && defaultAccountId === null && accounts.length > 0 && (
            <p id="account-hint" className="mt-2 text-xs text-gray-500">
              {t('payment.modal.defaultAccountHint')}
            </p>
          )}
        </div>

        {/* Info message */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            {t('payment.modal.settleInfo')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end pt-4" role="group" aria-label="Modal actions">
          <button
            type="button"
            onClick={onClose}
            disabled={settleBalance.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {t('payment.modal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSettle}
            disabled={settleBalance.isPending || loadingAccounts || !selectedAccountId}
            aria-busy={settleBalance.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {settleBalance.isPending ? t('payment.modal.settling') : t('payment.modal.confirmPayment')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
