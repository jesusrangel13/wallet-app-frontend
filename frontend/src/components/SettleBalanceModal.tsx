'use client'

import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Account } from '@/types'
import { accountAPI, groupAPI, userAPI } from '@/lib/api'
import { toast } from 'sonner'

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
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [defaultAccountId, setDefaultAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadAccountsAndDefault()
    }
  }, [isOpen])

  const loadAccountsAndDefault = async () => {
    try {
      setLoadingAccounts(true)
      const [accountsRes, profileRes] = await Promise.all([
        accountAPI.getAll(),
        userAPI.getProfile(),
      ])

      const activeAccounts = accountsRes.data.data.filter(
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
      console.error('Error loading accounts:', error)
      toast.error('Error al cargar las cuentas')
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleSettle = async () => {
    if (!selectedAccountId) {
      toast.error('Por favor selecciona una cuenta')
      return
    }

    try {
      setLoading(true)
      const response = await groupAPI.settleAllBalance(
        groupId,
        otherUserId,
        selectedAccountId
      )

      if (response.data.data.transactionsCreated) {
        toast.success(
          `Balance saldado con éxito. Transacciones creadas en tu cuenta.`
        )
      } else {
        toast.success(
          `Balance marcado como saldado. No se crearon transacciones (configura cuentas por defecto en Configuración).`
        )
      }

      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Error settling balance:', error)
      toast.error(
        error.response?.data?.message || 'Error al saldar el balance'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Saldar Balance">
      <div className="space-y-4">
        {/* Amount info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            Vas a marcar como pagado el balance de{' '}
            <span className="font-semibold">
              ${amount.toFixed(0)}
            </span>{' '}
            con {otherUserName}.
          </p>
        </div>

        {/* Account selection */}
        <div>
          <label
            htmlFor="account"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Selecciona la cuenta donde se registrará el pago
          </label>

          {loadingAccounts ? (
            <div className="text-sm text-gray-500">Cargando cuentas...</div>
          ) : accounts.length === 0 ? (
            <div className="text-sm text-red-600">
              No tienes cuentas activas. Crea una cuenta primero.
            </div>
          ) : (
            <select
              id="account"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.currency} $
                  {Number(account.balance).toFixed(2)}
                  {defaultAccountId === account.id ? ' (Por defecto)' : ''}
                </option>
              ))}
            </select>
          )}

          {!loadingAccounts && defaultAccountId === null && accounts.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Puedes configurar una cuenta por defecto en Configuración para que
              se seleccione automáticamente.
            </p>
          )}
        </div>

        {/* Info message */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            Al confirmar, se creará una transacción en la cuenta seleccionada y
            se marcará el balance como saldado.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSettle}
            disabled={loading || loadingAccounts || !selectedAccountId}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saldando...' : 'Confirmar Pago'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
