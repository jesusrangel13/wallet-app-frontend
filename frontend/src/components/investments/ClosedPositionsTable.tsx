'use client'

/**
 * ClosedPositionsTable Component
 *
 * Displays fully sold investment positions with realized gains/losses
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react'
import type { HoldingWithMetrics } from '@/types/investment'
import { cn } from '@/lib/utils'

interface ClosedPositionsTableProps {
  holdings: HoldingWithMetrics[]
  onRowClick?: (holding: HoldingWithMetrics) => void
  className?: string
}

type SortField = 'asset' | 'realizedPL' | 'roi' | 'dividends' | 'dateSold'
type SortOrder = 'asc' | 'desc'

export function ClosedPositionsTable({
  holdings,
  onRowClick,
  className = '',
}: ClosedPositionsTableProps) {
  const t = useTranslations('investments')
  const [sortField, setSortField] = useState<SortField>('dateSold')
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
      case 'realizedPL':
        aValue = a.realizedGainLoss
        bValue = b.realizedGainLoss
        break
      case 'roi':
        aValue = a.roi
        bValue = b.roi
        break
      case 'dividends':
        aValue = a.dividendsEarned
        bValue = b.dividendsEarned
        break
      case 'dateSold':
        aValue = a.dateSold ? new Date(a.dateSold).getTime() : 0
        bValue = b.dateSold ? new Date(b.dateSold).getTime() : 0
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

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.00%'
    }
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (holdings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {t('noClosedPositions')}
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
              onClick={() => handleSort('realizedPL')}
            >
              {t('realizedPL')}
              <SortIcon field="realizedPL" />
            </th>
            <th
              className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-100"
              onClick={() => handleSort('roi')}
            >
              {t('roi')}
              <SortIcon field="roi" />
            </th>
            <th
              className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-100"
              onClick={() => handleSort('dividends')}
            >
              {t('dividends')}
              <SortIcon field="dividends" />
            </th>
            <th
              className="px-4 py-3 text-right text-sm font-medium text-gray-700 cursor-pointer select-none hover:bg-gray-100"
              onClick={() => handleSort('dateSold')}
            >
              {t('dateSold')}
              <SortIcon field="dateSold" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedHoldings.map((holding) => {
            const isProfitable = holding.realizedGainLoss >= 0
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
                          holding.realizedGainLoss,
                          holding.currency
                        )}
                      </span>
                    </div>
                  </div>
                </td>
                <td className={cn('px-4 py-3 text-right font-semibold', roiColor)}>
                  {formatPercentage(holding.roi)}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-green-600">
                  {formatCurrency(holding.dividendsEarned, holding.currency)}
                </td>
                <td className="px-4 py-3 text-right text-gray-900">
                  {formatDate(holding.dateSold)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
