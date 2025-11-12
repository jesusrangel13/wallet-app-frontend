import { Transaction } from '@/types'

/**
 * Dynamically import and use xlsx library for Excel export
 * This is only loaded when the user explicitly exports to Excel
 * Reduces initial bundle size by ~600KB
 */
export async function exportToExcelWithXlsx(
  transactions: Transaction[],
  filename: string = 'transactions.xlsx'
) {
  try {
    // Dynamic import - only loads when called
    const XLSX = await import('xlsx')

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

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

    // Set column widths
    const colWidths = [
      { wch: 12 }, // Date
      { wch: 10 }, // Type
      { wch: 15 }, // Account
      { wch: 15 }, // Category
      { wch: 20 }, // Description
      { wch: 15 }, // Payee
      { wch: 15 }, // Payer
      { wch: 12 }, // Amount
      { wch: 10 }, // Currency
      { wch: 20 }, // Tags
      { wch: 15 }, // To Account
    ]
    ws['!cols'] = colWidths

    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')

    // Generate Excel file
    XLSX.writeFile(wb, filename)
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('Failed to export to Excel. Please try again.')
  }
}
