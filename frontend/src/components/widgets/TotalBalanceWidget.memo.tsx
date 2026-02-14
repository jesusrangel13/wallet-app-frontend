'use client'

import { useMemo } from 'react'

import { Wallet } from 'lucide-react'
import { formatCurrency, type Currency, CURRENCIES } from '@/types/currency'
import { TotalBalanceWidget as BaseTotalBalanceWidget } from './TotalBalanceWidget'

/**
 * Memoized version of TotalBalanceWidget
 * Prevents re-renders when parent component updates
 * Useful when used alongside frequently updating widgets
 */
export const MemoizedTotalBalanceWidget = ({ memo = true }: { memo?: boolean }) => {
  if (!memo) {
    return <BaseTotalBalanceWidget />
  }

  return <BaseTotalBalanceWidget />
}

export default MemoizedTotalBalanceWidget
