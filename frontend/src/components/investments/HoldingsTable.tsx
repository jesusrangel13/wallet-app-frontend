'use client'

/**
 * HoldingsTable Component
 *
 * Displays user's investment holdings with current prices and metrics
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react'
import type { HoldingWithMetrics } from '@/types/investment'
import { cn } from '@/lib/utils'

interface HoldingsTableProps {
  holdings: HoldingWithMetrics[]
  onRowClick?: (holding: HoldingWithMetrics) => void
  className?: string
}

type SortField = 'asset' | 'quantity' | 'avgCost' | 'currentValue' | 'unrealizedPL' | 'roi'
type SortOrder = 'asc' | 'desc'

export function HoldingsTable({
  holdings,
  onRowClick,
  className = '',
}: HoldingsTableProps) {
  const t = useTranslations('investments')
  const [sortField, setSortField] = useState<SortField>('currentValue')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedHoldings = [...holdings].sort((a, b) => {
    let aValue: number | string = 0
    let bValue: number | string = 0

    switch (sortField) {
      case 'asset':
        aValue = a.assetSymbol
        bValue = b.assetSymbol
        break
      case 'quantity':
        aValue = a.totalQuantity
        bValue = b.totalQuantity
        break
      case 'avgCost':
        aValue = a.averageCostPerUnit
        bValue = b.averageCostPerUnit
        break
      case 'currentValue':
        aValue = a.currentValue
        bValue = b.currentValue
        break
      case 'unrealizedPL':
        aValue = a.unrealizedGainLoss
        bValue = b.unrealizedGainLoss
        break
      case 'roi':
        aValue = a.roi
        bValue = b.roi
        break
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
  })

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={cn(
        'ml-2 h-4 w-4 inline',
        sortField === field && 'text-blue-600'
      )}
    />
  )

  const formatCurrency = (amount: number, currency: string) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('noHoldings')}
      </div>
    )
  }

  return (
    <div className={cn('rounded-md border overflow-x-auto', className)}>
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th
              className="px-4 py-3 text-left text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-100"
              onClick={() => handleSort('asset')}
            >
              {t('asset')}
              <SortIcon field="asset" />
            </th>
            <th
              className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-100"
              onClick={() => handleSort('quantity')}
            >
              {t('quantity')}
              <SortIcon field="quantity" />
            </th>
            <th
              className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-100"
              onClick={() => handleSort('avgCost')}
            >
              {t('avgCost')}
              <SortIcon field="avgCost" />
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
              {t('currentPrice')}
            </th>
            <th
              className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-100"
              onClick={() => handleSort('currentValue')}
            >
              {t('currentValue')}
              <SortIcon field="currentValue" />
            </th>
            <th
              className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-100"
              onClick={() => handleSort('unrealizedPL')}
            >
              {t('unrealizedPL')}
              <SortIcon field="unrealizedPL" />
            </th>
            <th
              className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-100"
              onClick={() => handleSort('roi')}
            >
              {t('roi')}
              <SortIcon field="roi" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedHoldings.map((holding) => {
            const isProfitable = holding.unrealizedGainLoss >= 0
            const roiColor = isProfitable ? 'text-green-600' : 'text-red-600'

            return (
              <tr
                key={holding.id}
                className={cn(
                  'hover:bg-gray-50',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(holding)}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{holding.assetSymbol}</p>
                    <p className="text-sm text-gray-500">{holding.assetName}</p>
                    <span className="inline-block mt-1 px-2 py-1 text-xs rounded border border-gray-300 text-gray-700">
                      {t(holding.assetType.toLowerCase())}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {holding.totalQuantity.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 8,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {formatCurrency(holding.averageCostPerUnit, holding.currency)}
                </td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {formatCurrency(holding.currentPrice, holding.currency)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {formatCurrency(holding.currentValue, holding.currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className={roiColor}>
                    <div className="flex items-center justify-end gap-1">
                      {isProfitable ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {formatCurrency(
                          holding.unrealizedGainLoss,
                          holding.currency
                        )}
                      </span>
                    </div>
                    <div className="text-sm">
                      {formatPercentage(holding.unrealizedGainLossPercentage)}
                    </div>
                  </div>
                </td>
                <td className={cn('px-4 py-3 text-right font-semibold', roiColor)}>
                  {formatPercentage(holding.roi)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
