'use client'

import { formatCurrency } from '@/lib/utils'

interface DateGroupHeaderProps {
  date: string
  totalIncome: number
  totalExpense: number
  currency: string
}

export function DateGroupHeader({ date, totalIncome, totalExpense, currency }: DateGroupHeaderProps) {
  const parsedDate = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Format date as "Today", "Yesterday", or full date
  let displayDate: string

  if (parsedDate.toDateString() === today.toDateString()) {
    displayDate = 'Hoy'
  } else if (parsedDate.toDateString() === yesterday.toDateString()) {
    displayDate = 'Ayer'
  } else {
    // Format as "September 9, 2025" or localized version
    displayDate = parsedDate.toLocaleDateString('es-ES', {
      month: 'long',
      day: 'numeric',
      year: parsedDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  const netAmount = totalIncome - totalExpense

  return (
    <div className="flex items-center justify-between py-3 px-1 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900 capitalize">
        {displayDate}
      </h3>
      <div className="flex items-center gap-3 text-sm">
        <span className={`font-semibold ${netAmount >= 0 ? 'text-green-700' : 'text-red-700'}`}>
          {netAmount >= 0 ? '+' : ''}{formatCurrency(Math.abs(netAmount), currency)}
        </span>
      </div>
    </div>
  )
}
