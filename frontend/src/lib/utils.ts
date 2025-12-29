import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Parse a date string as local date (ignores timezone)
 * Useful for dates stored as midnight UTC that should be displayed as-is
 */
export function parseLocalDate(dateString: string | Date): Date {
  // If it's already a Date object, return it
  if (dateString instanceof Date) return dateString

  // Extract year, month, day from ISO string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  const parts = dateString.split('T')[0].split('-')
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // Months are 0-indexed
  const day = parseInt(parts[2], 10)

  // Create date in local timezone
  return new Date(year, month, day)
}

export function formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy'): string {
  // For date-only strings (transactions, etc), parse as local date
  if (typeof date === 'string' && date.includes('T00:00:00')) {
    return format(parseLocalDate(date), formatStr)
  }
  return format(new Date(date), formatStr)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export const TRANSACTION_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Healthcare',
  'Travel',
  'Education',
  'Groceries',
  'Income',
  'Other',
]

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: 'Cash',
  DEBIT: 'Debit Card',
  CREDIT: 'Credit Card',
  SAVINGS: 'Savings',
}

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  EXPENSE: 'Expense',
  INCOME: 'Income',
  TRANSFER: 'Transfer',
}
