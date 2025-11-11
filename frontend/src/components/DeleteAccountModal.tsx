'use client'

import { useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Account } from '@/types'
import { AlertTriangle } from 'lucide-react'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (transferToAccountId?: string) => Promise<void>
  account: Account | null
  accounts: Account[]
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
  const [transferToAccountId, setTransferToAccountId] = useState<string>('')
  const [deleteTransactions, setDeleteTransactions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const availableAccounts = accounts.filter(a => a.id !== account?.id)
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Delete Account">
      <div className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Warning</p>
            <p className="text-sm text-red-700 mt-1">
              You are about to delete the account <span className="font-semibold">{account?.name}</span>.
            </p>
          </div>
        </div>

        {/* Transaction Info */}
        {hasTransactions && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-900">
              This account has <span className="font-semibold">{transactionCount}</span> transaction{transactionCount !== 1 ? 's' : ''} associated with it.
            </p>
          </div>
        )}

        {/* Options */}
        {hasTransactions && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-900">
              What would you like to do with the transactions?
            </p>

            {/* Option 1: Transfer to another account */}
            {availableAccounts.length > 0 && (
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                  style={{
                    borderColor: !deleteTransactions && transferToAccountId ? '#3b82f6' : '#e5e7eb',
                    backgroundColor: !deleteTransactions && transferToAccountId ? '#eff6ff' : 'white'
                  }}
                >
                  <input
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
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Transfer transactions to another account</p>
                    <p className="text-xs text-gray-600 mt-1">
                      All transactions will be moved to the selected account
                    </p>
                  </div>
                </label>

                {!deleteTransactions && (
                  <select
                    value={transferToAccountId}
                    onChange={(e) => setTransferToAccountId(e.target.value)}
                    className="w-full ml-9 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select an account...</option>
                    {availableAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Option 2: Delete all transactions */}
            <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
              style={{
                borderColor: deleteTransactions ? '#3b82f6' : '#e5e7eb',
                backgroundColor: deleteTransactions ? '#eff6ff' : 'white'
              }}
            >
              <input
                type="radio"
                name="deleteOption"
                checked={deleteTransactions}
                onChange={() => {
                  setDeleteTransactions(true)
                  setTransferToAccountId('')
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-red-900">Delete all transactions</p>
                <p className="text-xs text-red-700 mt-1">
                  This action cannot be undone. All {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} will be permanently deleted.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
            className={`flex-1 ${deleteTransactions ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isDeleting ? 'Deleting...' : deleteTransactions ? 'Delete Account & Transactions' : 'Delete Account'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
