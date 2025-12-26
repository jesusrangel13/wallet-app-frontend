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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
  })

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      className={cn(
        'ml-2 h-4 w-4 inline',
        sortField === field && 'text-primary'
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
      <div className="text-center py-12 text-muted-foreground">
        {t('noHoldings')}
      </div>
    )
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('asset')}
            >
              {t('asset')}
              <SortIcon field="asset" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => handleSort('quantity')}
            >
              {t('quantity')}
              <SortIcon field="quantity" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => handleSort('avgCost')}
            >
              {t('avgCost')}
              <SortIcon field="avgCost" />
            </TableHead>
            <TableHead className="text-right">{t('currentPrice')}</TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => handleSort('currentValue')}
            >
              {t('currentValue')}
              <SortIcon field="currentValue" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => handleSort('unrealizedPL')}
            >
              {t('unrealizedPL')}
              <SortIcon field="unrealizedPL" />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => handleSort('roi')}
            >
              {t('roi')}
              <SortIcon field="roi" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedHoldings.map((holding) => {
            const isProfitable = holding.unrealizedGainLoss >= 0
            const roiColor = isProfitable ? 'text-green-600' : 'text-red-600'

            return (
              <TableRow
                key={holding.id}
                className={cn(
                  onRowClick && 'cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => onRowClick?.(holding)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{holding.assetSymbol}</p>
                    <p className="text-sm text-muted-foreground">
                      {holding.assetName}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {t(holding.assetType.toLowerCase())}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {holding.totalQuantity.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 8,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(holding.averageCostPerUnit, holding.currency)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(holding.currentPrice, holding.currency)}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(holding.currentValue, holding.currency)}
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
                <TableCell className={cn('text-right font-semibold', roiColor)}>
                  {formatPercentage(holding.roi)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
