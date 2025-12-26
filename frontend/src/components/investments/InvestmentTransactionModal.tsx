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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
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
    accountsData?.data.data.filter((acc) => acc.type === 'INVESTMENT') || []

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
    transactionDate: new Date(),
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
      transactionDate: formData.transactionDate.toISOString(),
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
      transactionDate: new Date(),
      notes: '',
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('newTransaction')}</DialogTitle>
          <DialogDescription>
            {t('newTransactionDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Search */}
          <AssetSearch
            onSelect={setSelectedAsset}
            selectedAsset={selectedAsset}
          />

          {/* Account Selection */}
          <div>
            <Label htmlFor="account">{t('account')}</Label>
            <Select
              value={formData.accountId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, accountId: value }))
              }
            >
              <SelectTrigger id="account">
                <SelectValue placeholder={t('selectAccount')} />
              </SelectTrigger>
              <SelectContent>
                {investmentAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Type */}
          <div>
            <Label htmlFor="type">{t('transactionType')}</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'BUY' | 'SELL') =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">{t('buy')}</SelectItem>
                <SelectItem value="SELL">{t('sell')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantity */}
            <div>
              <Label htmlFor="quantity">{t('quantity')}</Label>
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
              <Label htmlFor="pricePerUnit">{t('pricePerUnit')}</Label>
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
              <Label htmlFor="fees">{t('fees')}</Label>
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
              <Label htmlFor="currency">{t('currency')}</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, currency: value }))
                }
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="CLP">CLP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Transaction Date */}
          <div>
            <Label>{t('transactionDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.transactionDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.transactionDate ? (
                    format(formData.transactionDate, 'PPP')
                  ) : (
                    <span>{tCommon('selectDate')}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.transactionDate}
                  onSelect={(date) =>
                    setFormData((prev) => ({
                      ...prev,
                      transactionDate: date || new Date(),
                    }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('notesPlaceholder')}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Total Display */}
          {quantity > 0 && price > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {t('total')}:
                </span>
                <span className="text-xl font-bold">
                  {total.toLocaleString('en-US', {
                    style: 'currency',
                    currency: formData.currency,
                  })}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {quantity} × {price} + {fees} {t('fees').toLowerCase()}
              </div>
            </div>
          )}

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
