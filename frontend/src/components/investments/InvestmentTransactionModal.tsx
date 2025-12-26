'use client'

/**
 * InvestmentTransactionModal Component
 *
 * Modal for creating BUY/SELL investment transactions
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateInvestmentTransaction } from '@/hooks/useInvestments'
import { useAccounts } from '@/hooks/useAccounts'
import { AssetSearch } from './AssetSearch'
import {
  InvestmentAssetType,
  type AssetSearchResult,
  type CreateInvestmentTransactionRequest,
} from '@/types/investment'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface InvestmentTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  defaultAccountId?: string
}

export function InvestmentTransactionModal({
  isOpen,
  onClose,
  defaultAccountId,
}: InvestmentTransactionModalProps) {
  const t = useTranslations('investments')
  const tCommon = useTranslations('common')

  // Get investment accounts
  const { data: accountsData } = useAccounts({ limit: 100 })
  const investmentAccounts =
    ((accountsData as any)?.data?.data || []).filter((acc: any) => acc.type === 'INVESTMENT') || []

  // Mutation
  const createTransaction = useCreateInvestmentTransaction()

  // Form state
  const [selectedAsset, setSelectedAsset] = useState<AssetSearchResult | null>(
    null
  )
  const [formData, setFormData] = useState({
    accountId: defaultAccountId || '',
    type: 'BUY' as 'BUY' | 'SELL',
    quantity: '',
    pricePerUnit: '',
    fees: '0',
    currency: 'USD',
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Calculate total
  const quantity = parseFloat(formData.quantity) || 0
  const price = parseFloat(formData.pricePerUnit) || 0
  const fees = parseFloat(formData.fees) || 0
  const total = quantity * price + fees

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedAsset) {
      toast.error(t('pleaseSelectAsset'))
      return
    }

    if (!formData.accountId) {
      toast.error(t('pleaseSelectAccount'))
      return
    }

    const data: CreateInvestmentTransactionRequest = {
      accountId: formData.accountId,
      assetSymbol: selectedAsset.symbol,
      assetName: selectedAsset.name,
      assetType: selectedAsset.assetType,
      type: formData.type,
      quantity: parseFloat(formData.quantity),
      pricePerUnit: parseFloat(formData.pricePerUnit),
      fees: parseFloat(formData.fees),
      currency: formData.currency,
      transactionDate: new Date(formData.transactionDate).toISOString(),
      notes: formData.notes || undefined,
    }

    try {
      await createTransaction.mutateAsync(data)
      toast.success(
        t(formData.type === 'BUY' ? 'buySuccess' : 'sellSuccess')
      )
      handleClose()
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || t('transactionFailed')
      )
    }
  }

  const handleClose = () => {
    setSelectedAsset(null)
    setFormData({
      accountId: defaultAccountId || '',
      type: 'BUY',
      quantity: '',
      pricePerUnit: '',
      fees: '0',
      currency: 'USD',
      transactionDate: new Date().toISOString().split('T')[0],
      notes: '',
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('newTransaction')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Asset Search */}
        <AssetSearch
          onSelect={setSelectedAsset}
          selectedAsset={selectedAsset}
        />

        {/* Account Selection */}
        <div>
          <label htmlFor="account" className="block text-sm font-medium mb-1">
            {t('account')}
          </label>
          <select
            id="account"
            value={formData.accountId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, accountId: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">{t('selectAccount')}</option>
            {investmentAccounts.map((account: any) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-1">
            {t('transactionType')}
          </label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, type: e.target.value as 'BUY' | 'SELL' }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BUY">{t('buy')}</option>
            <option value="SELL">{t('sell')}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium mb-1">
              {t('quantity')}
            </label>
            <Input
              id="quantity"
              type="number"
              step="0.00000001"
              min="0"
              placeholder="0.00"
              value={formData.quantity}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: e.target.value }))
              }
              required
            />
          </div>

          {/* Price Per Unit */}
          <div>
            <label htmlFor="pricePerUnit" className="block text-sm font-medium mb-1">
              {t('pricePerUnit')}
            </label>
            <Input
              id="pricePerUnit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.pricePerUnit}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  pricePerUnit: e.target.value,
                }))
              }
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Fees */}
          <div>
            <label htmlFor="fees" className="block text-sm font-medium mb-1">
              {t('fees')}
            </label>
            <Input
              id="fees"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.fees}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fees: e.target.value }))
              }
            />
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium mb-1">
              {t('currency')}
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, currency: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="CLP">CLP</option>
            </select>
          </div>
        </div>

        {/* Transaction Date */}
        <div>
          <label htmlFor="transactionDate" className="block text-sm font-medium mb-1">
            {t('transactionDate')}
          </label>
          <Input
            id="transactionDate"
            type="date"
            value={formData.transactionDate}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                transactionDate: e.target.value,
              }))
            }
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium mb-1">
            {t('notes')}
          </label>
          <textarea
            id="notes"
            placeholder={t('notesPlaceholder')}
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Total Display */}
        {quantity > 0 && price > 0 && (
          <div className="rounded-lg bg-gray-100 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {t('total')}:
              </span>
              <span className="text-xl font-bold">
                {total.toLocaleString('en-US', {
                  style: 'currency',
                  currency: formData.currency,
                })}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {quantity} × {price} + {fees} {t('fees').toLowerCase()}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createTransaction.isPending}
          >
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            disabled={
              !selectedAsset ||
              !formData.accountId ||
              !formData.quantity ||
              !formData.pricePerUnit ||
              createTransaction.isPending
            }
          >
            {createTransaction.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('processing')}
              </>
            ) : formData.type === 'BUY' ? (
              t('buy')
            ) : (
              t('sell')
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
