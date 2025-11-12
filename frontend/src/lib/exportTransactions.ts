import { Transaction } from '@/types'
import { formatCurrency } from './utils'

export function exportToCSV(transactions: Transaction[], filename: string = 'transactions.csv') {
  const headers = [
    'Date',
    'Type',
    'Account',
    'Category',
    'Description',
    'Payee',
    'Payer',
    'Amount',
    'Currency',
    'Tags',
    'To Account',
  ]

  const rows = transactions.map((t) => [
    new Date(t.date).toLocaleDateString(),
    t.type,
    t.account?.name || '',
    t.category?.name || 'Uncategorized',
    t.description || '',
    t.payee || '',
    t.payer || '',
    t.amount.toString(),
    t.account?.currency || '',
    t.tags?.map((tag) => tag.tag.name).join('; ') || '',
    t.toAccount?.name || '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.toString().replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  downloadFile(csvContent, filename, 'text/csv')
}

export function exportToJSON(transactions: Transaction[], filename: string = 'transactions.json') {
  const data = transactions.map((t) => ({
    date: t.date,
    type: t.type,
    account: t.account?.name,
    category: t.category?.name,
    description: t.description,
    payee: t.payee,
    payer: t.payer,
    amount: t.amount,
    currency: t.account?.currency,
    tags: t.tags?.map((tag) => tag.tag.name),
    toAccount: t.toAccount?.name,
  }))

  const jsonContent = JSON.stringify(data, null, 2)
  downloadFile(jsonContent, filename, 'application/json')
}

/**
 * Export to Excel using dynamically imported xlsx library
 * The xlsx library (~600KB) is only loaded when explicitly called
 * This reduces initial bundle size significantly
 */
export async function exportToExcel(transactions: Transaction[], filename: string = 'transactions.xlsx') {
  const { exportToExcelWithXlsx } = await import('./exportExcel')
  return exportToExcelWithXlsx(transactions, filename)
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
