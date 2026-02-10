'use client'

import { memo, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'

interface DateGroupHeaderProps {
  date: string
  totalIncome: number
  totalExpense: number
  currency: string
}

export const DateGroupHeader = memo(function DateGroupHeader({
  date,
  totalIncome,
  totalExpense,
  currency
}: DateGroupHeaderProps) {
  // Memoize date formatting - expensive operation
  const displayDate = useMemo(() => {
    const parsedDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Format date as "Today", "Yesterday", or full date
    if (parsedDate.toDateString() === today.toDateString()) {
      return 'Hoy'
    } else if (parsedDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer'
    } else {
      // Format as "September 9, 2025" or localized version
      return parsedDate.toLocaleDateString('es-ES', {
        month: 'long',
        day: 'numeric',
        year: parsedDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }, [date])

  // Memoize net amount calculation
  const netAmount = useMemo(
    () => totalIncome - totalExpense,
    [totalIncome, totalExpense]
  )

  return (
    <div className="flex items-center pt-6 pb-2 bg-background z-10 sticky top-0 group">
      {/* Spacer for Checkbox alignment (w-4 + pl-4 + pr-2 = approx w-[42px] or match visually) 
            Checkbox const: pl-4 (16) + w-4 (16) + pr-2 (8) = 40px
        */}
      <div className="w-[40px] flex-shrink-0" />

      {/* Timeline Column */}
      <div className="flex flex-col items-center w-6 mr-2 flex-shrink-0 self-stretch">
        {/* Top Line (connects to previous group) */}
        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 min-h-[10px]" />

        {/* Date Node (Dot or Pill) */}
        {/* Using a hollow dot for date to distinguish from transactions */}
        <div className="w-3 h-3 rounded-full border-2 border-gray-400 dark:border-gray-500 bg-background z-10 my-1" />

        {/* Bottom Line (connects to current group) */}
        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 min-h-[10px]" />
      </div>

      {/* Date Content */}
      <div className="flex-1 flex items-center py-1 gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
          {displayDate}
        </h3>
        <span className="text-gray-400 dark:text-gray-500 text-xs">•</span>
        <span className={`text-sm font-medium ${netAmount >= 0 ? 'text-income' : 'text-gray-600 dark:text-gray-400'}`}>
          {netAmount >= 0 ? '+' : ''}{formatCurrency(Math.abs(netAmount), currency)}
        </span>
      </div>
    </div>
  )
})
