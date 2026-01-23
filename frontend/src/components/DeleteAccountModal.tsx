'use client'

import { useState, useId } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Account } from '@/types'
import { AlertTriangle } from 'lucide-react'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (transferToAccountId?: string) => Promise<void>
  account: Account | null
  accounts: Account[] | undefined
  transactionCount?: number
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  account,
  accounts,
  transactionCount = 0,
}: DeleteAccountModalProps) {
  const t = useTranslations('deleteAccount')
  const tCommon = useTranslations('common.actions')
  const [transferToAccountId, setTransferToAccountId] = useState<string>('')
  const [deleteTransactions, setDeleteTransactions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Accessibility IDs
  const transferSelectId = useId()
  const transferOptionId = useId()
  const deleteOptionId = useId()

  const availableAccounts = accounts?.filter(a => a.id !== account?.id) || []
  const hasTransactions = transactionCount > 0

  const handleConfirm = async () => {
    try {
      setIsDeleting(true)

      if (hasTransactions && !deleteTransactions && transferToAccountId) {
        await onConfirm(transferToAccountId)
      } else if (hasTransactions && deleteTransactions) {
        await onConfirm(undefined)
      } else {
        await onConfirm(undefined)
      }

      handleClose()
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setTransferToAccountId('')
    setDeleteTransactions(false)
    onClose()
  }

  const canDelete = !hasTransactions || deleteTransactions || (hasTransactions && transferToAccountId)

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('title')}>
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-medium text-red-900">{t('warning')}</p>
            <p className="text-sm text-red-700 mt-1">
              {t('warningMessage')} <span className="font-semibold">{account?.name}</span>.
            </p>
          </div>
        </div>

        {/* Transaction Info */}
        {hasTransactions && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">
              {t('transactionCount', { count: transactionCount })}
            </p>
          </div>
        )}

        {/* Options */}
        {hasTransactions && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-900">
              {t('whatToDo')}
            </p>

            {/* Option 1: Transfer to another account */}
            {availableAccounts.length > 0 && (
              <div className="space-y-2">
                <label
                  htmlFor={transferOptionId}
                  className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${!deleteTransactions && transferToAccountId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-card'
                    }`}
                >
                  <input
                    id={transferOptionId}
                    type="radio"
                    name="deleteOption"
                    checked={!deleteTransactions && !!transferToAccountId}
                    onChange={() => {
                      setDeleteTransactions(false)
                      if (!transferToAccountId && availableAccounts.length > 0) {
                        setTransferToAccountId(availableAccounts[0].id)
                      }
                    }}
                    className="mt-1"
                    aria-describedby="transfer-description"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{t('transferOption')}</p>
                    <p id="transfer-description" className="text-xs text-gray-600 mt-1">
                      {t('transferDescription')}
                    </p>
                  </div>
                </label>

                {!deleteTransactions && (
                  <div>
                    <label htmlFor={transferSelectId} className="sr-only">{t('selectAccount')}</label>
                    <Select
                      id={transferSelectId}
                      value={transferToAccountId}
                      onChange={(e) => setTransferToAccountId(e.target.value)}
                      className="ml-9"
                      aria-label={t('selectAccount')}
                    >
                      <option value="">{t('selectAccount')}</option>
                      {availableAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type})
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Option 2: Delete all transactions */}
            <label
              htmlFor={deleteOptionId}
              className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${deleteTransactions
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-card'
                }`}
            >
              <input
                id={deleteOptionId}
                type="radio"
                name="deleteOption"
                checked={deleteTransactions}
                onChange={() => {
                  setDeleteTransactions(true)
                  setTransferToAccountId('')
                }}
                className="mt-1"
                aria-describedby="delete-warning"
              />
              <div className="flex-1">
                <p className="font-medium text-red-900">{t('deleteOption')}</p>
                <p id="delete-warning" className="text-xs text-red-700 mt-1">
                  {t('deleteWarning', { count: transactionCount })}
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t" role="group" aria-label="Modal actions">
          <Button
            type="button"
            onClick={handleClose}
            variant="outline"
            disabled={isDeleting}
            className="flex-1"
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
            aria-busy={isDeleting}
            className={`flex-1 ${deleteTransactions ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isDeleting ? t('deleting') : deleteTransactions ? t('deleteAccountAndTransactions') : t('deleteAccountOnly')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
