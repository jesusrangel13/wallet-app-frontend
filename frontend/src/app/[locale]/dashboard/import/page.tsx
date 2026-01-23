'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Account, Group, MergedCategory } from '@/types'
import { accountAPI, categoryAPI, groupAPI, importAPI } from '@/lib/api'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
// import Papa from 'papaparse' // Dynamically imported
// import * as XLSX from 'xlsx' // Dynamically imported
import { Upload, FileText, Table, CheckCircle2, AlertCircle, Info, History, Edit2 } from 'lucide-react'
import Link from 'next/link'
import TransactionFormModal, { TransactionFormData } from '@/components/TransactionFormModal'

interface ParsedTransaction {
  row: number
  date: string | number
  type: string
  amount: string
  description: string
  category?: string
  tags?: string
  notes?: string
  sharedGroup?: string
  paidBy?: string
  splitType?: string
  participants?: string
  isValid: boolean
  errors: string[]
  suggestedCategory?: string
  isEdited?: boolean
}

export default function ImportPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<MergedCategory[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [parsedData, setParsedData] = useState<ParsedTransaction[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, total: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const [fileType, setFileType] = useState<'CSV' | 'EXCEL'>('CSV')
  const [editingTransaction, setEditingTransaction] = useState<ParsedTransaction | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<TransactionFormData>>({
    date: '',
    type: 'EXPENSE',
    amount: 0,
    description: '',
    categoryId: '',
    tags: [] as string[],
    notes: '',
    sharedGroup: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [accountsRes, categoriesRes, groupsRes] = await Promise.all([
        accountAPI.getAll(),
        categoryAPI.getAll(),
        groupAPI.getAll(),
      ])
      // Manejar respuestas que pueden ser arrays directos o formato paginado
      const accountsData = accountsRes.data as any
      setAccounts(Array.isArray(accountsData) ? accountsData : accountsData.data)
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.data)
      setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : (groupsRes.data as any).data)
    } catch (error: any) {
      toast.error('Failed to load data')
    }
  }

  const downloadTemplate = async (format: 'csv' | 'excel') => {
    const categoryNames = categories.map(c => c.name).join(', ')
    const groupNames = groups.map(g => g.name).join(', ')

    const headers = ['date', 'type', 'amount', 'description', 'payee', 'category', 'tags', 'notes', 'sharedGroup', 'paidBy', 'splitType', 'participants']
    const exampleRows = [
      ['2024-01-15', 'EXPENSE', '50000', 'Groceries at supermarket', 'Supermarket XYZ', 'Food', 'grocery', 'Weekly shopping', '', '', '', ''],
      ['15/01/2024', 'INCOME', '500000', 'Monthly salary', 'Company ABC', 'Salary', 'work', '', '', '', '', ''],
      ['2024-01-16', 'EXPENSE', '35000', 'Gas station', 'Shell Station', 'Transport', 'fuel,car', 'Full tank', '', '', '', ''],
      ['2024-01-17', 'EXPENSE', '60000', 'Dinner with friends', 'Restaurant La Piazza', 'Food', 'restaurant', 'Group dinner', 'Familia', 'user@example.com', 'EQUAL', 'user1@example.com,user2@example.com,user3@example.com'],
      ['2024-01-18', 'EXPENSE', '90000', 'Pizza with group (70/30)', 'Pizza Hut', 'Food', '', '', 'Friends', 'user@example.com', 'PERCENTAGE', 'user1@example.com:70,user2@example.com:30'],
      ['2024-01-19', 'EXPENSE', '100000', 'Rent split exactly', 'Landlord', 'Housing', '', '', 'Roommates', 'user@example.com', 'EXACT', 'user1@example.com:50000,user2@example.com:50000'],
      ['2024-01-20', 'EXPENSE', '80000', 'Food split by shares (2:1)', 'Market', 'Food', '', '', 'Family', 'user@example.com', 'SHARES', 'user1@example.com:2,user2@example.com:1'],
    ]

    const instructions = [
      '# INSTRUCTIONS',
      '# Required fields: date, type, amount, description',
      '# Date formats accepted: YYYY-MM-DD, DD/MM/YYYY, or Excel date numbers',
      `# Type: Must be EXPENSE, INCOME, or TRANSFER`,
      `# Amount: Number without currency symbols`,
      '# Payee: Recipient or merchant name (optional, e.g., "Restaurant", "Supermarket XYZ")',
      `# Available categories: ${categoryNames}`,
      `# Available groups: ${groupNames}`,
      '# Tags: Separate multiple tags with commas',
      '',
      '# SHARED EXPENSES (Optional):',
      '# sharedGroup: Name of the group (leave empty for non-shared expenses)',
      '# paidBy: Email of the person who paid (required if sharedGroup is set)',
      '# splitType: EQUAL, PERCENTAGE, SHARES, or EXACT (required if sharedGroup is set)',
      '# participants: Format depends on splitType:',
      '#',
      '#   EQUAL: email1,email2,email3 (no values needed)',
      '#   Example: user1@example.com,user2@example.com,user3@example.com',
      '#',
      '#   PERCENTAGE: email1:percent1,email2:percent2 (must sum to 100)',
      '#   Example: user1@example.com:70,user2@example.com:30',
      '#',
      '#   EXACT: email1:amount1,email2:amount2 (must sum to transaction amount)',
      '#   Example: user1@example.com:50000,user2@example.com:50000',
      '#',
      '#   SHARES: email1:shares1,email2:shares2 (must be positive integers)',
      '#   Example: user1@example.com:2,user2@example.com:1 (splits 2:1)',
      '',
    ]

    if (format === 'csv') {
      const csvContent = [
        ...instructions,
        headers.join(','),
        ...exampleRows.map(row => row.join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'transaction_template.csv'
      link.click()
      toast.success('CSV template downloaded')
    } else {
      // Dynamic import for XLSX
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()

      // Instructions sheet
      const instructionsSheet = XLSX.utils.aoa_to_sheet([
        ['TRANSACTION IMPORT TEMPLATE'],
        [''],
        ['REQUIRED FIELDS:'],
        ['- date: Transaction date (YYYY-MM-DD, DD/MM/YYYY, or Excel date numbers)'],
        ['- type: Transaction type (EXPENSE, INCOME, or TRANSFER)'],
        ['- amount: Transaction amount (number without currency symbols)'],
        ['- description: Brief description of the transaction'],
        [''],
        ['OPTIONAL FIELDS:'],
        ['- category: Category name (leave empty for "Uncategorized")'],
        ['- tags: Tags separated by commas (e.g., "work,urgent")'],
        ['- notes: Additional notes'],
        [''],
        ['SHARED EXPENSES (Optional):'],
        ['- sharedGroup: Name of the group (leave empty for non-shared expenses)'],
        ['- paidBy: Email of the person who paid (required if sharedGroup is set)'],
        ['- splitType: EQUAL, PERCENTAGE, SHARES, or EXACT (required if sharedGroup is set)'],
        ['- participants: Format depends on splitType (required if sharedGroup is set)'],
        [''],
        ['SPLIT TYPE FORMATS:'],
        ['EQUAL: List emails without values, splits equally'],
        ['  Example: user1@example.com,user2@example.com,user3@example.com'],
        [''],
        ['PERCENTAGE: email1:percent1,email2:percent2 - must sum to 100'],
        ['  Example: user1@example.com:70,user2@example.com:30'],
        [''],
        ['EXACT: email1:amount1,email2:amount2 - must sum to transaction amount'],
        ['  Example: user1@example.com:50000,user2@example.com:50000'],
        [''],
        ['SHARES: email1:shares1,email2:shares2 - must be positive integers'],
        ['  Example: user1@example.com:2,user2@example.com:1 (splits 2:1)'],
        [''],
        ['AVAILABLE CATEGORIES:'],
        [categoryNames],
        [''],
        ['AVAILABLE GROUPS:'],
        [groupNames],
      ])
      XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions')

      // Data sheet with examples
      const dataSheet = XLSX.utils.aoa_to_sheet([headers, ...exampleRows])
      XLSX.utils.book_append_sheet(wb, dataSheet, 'Transactions')

      XLSX.writeFile(wb, 'transaction_template.xlsx')
      toast.success('Excel template downloaded')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV or Excel file')
      return
    }

    parseFile(selectedFile)
  }

  const parseFile = async (fileToParse: File) => {
    setIsProcessing(true)
    setFileName(fileToParse.name)

    try {
      const fileNameLower = fileToParse.name.toLowerCase()

      if (fileNameLower.endsWith('.csv')) {
        setFileType('CSV')
        const text = await fileToParse.text()
        const Papa = (await import('papaparse')).default
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            validateAndProcessData(results.data as any[])
          },
          error: (error: any) => {
            toast.error(`CSV parsing error: ${error.message}`)
            setIsProcessing(false)
          }
        })
      } else {
        setFileType('EXCEL')
        const arrayBuffer = await fileToParse.arrayBuffer()
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames.find(name => name.toLowerCase() === 'transactions') || workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        validateAndProcessData(jsonData as any[])
      }
    } catch (error: any) {
      toast.error(`Error reading file: ${error.message}`)
      setIsProcessing(false)
    }
  }

  const findSimilarCategory = (inputCategory: string): string | undefined => {
    if (!inputCategory) return undefined

    const input = inputCategory.toLowerCase().trim()

    // Exact match
    const exactMatch = categories.find(c => c.name.toLowerCase() === input)
    if (exactMatch) return exactMatch.name

    // Fuzzy match - Levenshtein distance
    const calculateDistance = (a: string, b: string): number => {
      const matrix: number[][] = []

      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i]
      }

      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j
      }

      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1]
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            )
          }
        }
      }

      return matrix[b.length][a.length]
    }

    // Find closest match with distance <= 2
    let closestMatch: string | undefined
    let smallestDistance = 3

    for (const category of categories) {
      const distance = calculateDistance(input, category.name.toLowerCase())
      if (distance < smallestDistance) {
        smallestDistance = distance
        closestMatch = category.name
      }
    }

    return closestMatch
  }

  const formatDateForDisplay = (dateValue: string | number): string => {
    const parsedDate = parseDate(dateValue)
    if (!parsedDate) return String(dateValue)

    const year = parsedDate.getFullYear()
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
    const day = String(parsedDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const parseDate = (dateString: string | number): Date | null => {
    if (!dateString && dateString !== 0) return null

    // Check if it's an Excel serial number (numeric value)
    if (typeof dateString === 'number' || !isNaN(Number(dateString))) {
      const excelSerialNumber = typeof dateString === 'number' ? dateString : Number(dateString)

      // Excel stores dates as the number of days since 1/1/1900
      // But there's a bug in Excel that treats 1900 as a leap year (it wasn't)
      // So we need to account for that
      const excelEpoch = new Date(1899, 11, 30) // December 30, 1899
      const millisecondsPerDay = 24 * 60 * 60 * 1000
      const date = new Date(excelEpoch.getTime() + excelSerialNumber * millisecondsPerDay)

      if (!isNaN(date.getTime())) {
        return date
      }
    }

    // Convert to string for remaining checks
    const dateStr = String(dateString)

    // Try ISO format (YYYY-MM-DD)
    const isoDate = new Date(dateStr)
    if (!isNaN(isoDate.getTime())) {
      return isoDate
    }

    // Try DD/MM/YYYY or DD-MM-YYYY format
    const separators = ['/', '-']
    for (const sep of separators) {
      if (dateStr.includes(sep)) {
        const parts = dateStr.split(sep)
        if (parts.length === 3) {
          // Assume DD/MM/YYYY or DD-MM-YYYY
          const day = parseInt(parts[0])
          const month = parseInt(parts[1])
          const year = parseInt(parts[2])

          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const date = new Date(year, month - 1, day)
            if (!isNaN(date.getTime())) {
              return date
            }
          }
        }
      }
    }

    return null
  }

  const validateAndProcessData = (data: any[]) => {
    const processed: ParsedTransaction[] = data.map((row, index) => {
      const errors: string[] = []
      const rowNumber = index + 2 // +2 because of header and 0-index

      // Validate required fields
      if (!row.date) errors.push('Date is required')
      if (!row.type) errors.push('Type is required')
      if (!row.amount) errors.push('Amount is required')
      if (!row.description) errors.push('Description is required')

      // Validate type
      const validTypes = ['EXPENSE', 'INCOME', 'TRANSFER']
      if (row.type && !validTypes.includes(row.type.toUpperCase())) {
        errors.push(`Type must be one of: ${validTypes.join(', ')}`)
      }

      // Validate amount
      const amount = parseFloat(row.amount)
      if (row.amount && (isNaN(amount) || amount <= 0)) {
        errors.push('Amount must be a positive number')
      }

      // Validate date format
      if (row.date) {
        const parsedDate = parseDate(row.date)
        if (!parsedDate) {
          errors.push('Invalid date format. Use YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY')
        }
      }

      // Validate shared expense fields
      if (row.sharedGroup) {
        if (!row.paidBy) {
          errors.push('paidBy is required when sharedGroup is set')
        }
        if (!row.splitType) {
          errors.push('splitType is required when sharedGroup is set')
        } else {
          const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'SHARES', 'EXACT']
          if (!validSplitTypes.includes(row.splitType.toUpperCase())) {
            errors.push(`splitType must be one of: ${validSplitTypes.join(', ')}`)
          }
        }
        if (!row.participants) {
          errors.push('participants is required when sharedGroup is set')
        }
      }

      // Find similar category
      const suggestedCategory = row.category ? findSimilarCategory(row.category) : undefined

      return {
        row: rowNumber,
        date: row.date || '',
        type: row.type || '',
        amount: row.amount || '',
        description: row.description || '',
        category: row.category || '',
        tags: row.tags || '',
        notes: row.notes || '',
        sharedGroup: row.sharedGroup || '',
        paidBy: row.paidBy || '',
        splitType: row.splitType || '',
        participants: row.participants || '',
        isValid: errors.length === 0,
        errors,
        suggestedCategory,
      }
    })

    setParsedData(processed)
    setStep('preview')
    setIsProcessing(false)

    const validCount = processed.filter(t => t.isValid).length
    const invalidCount = processed.length - validCount

    if (invalidCount > 0) {
      toast.warning(`Found ${invalidCount} row(s) with errors. Please review before importing.`)
    } else {
      toast.success(`All ${validCount} transactions are valid!`)
    }
  }

  const handleImport = async (importOnlyValid: boolean) => {
    if (!selectedAccount) {
      toast.error('Please select an account')
      return
    }

    setStep('importing')
    setIsProcessing(true)

    const transactionsToImport = importOnlyValid
      ? parsedData.filter(t => t.isValid)
      : parsedData

    try {
      // Prepare transactions for backend
      const transactions = transactionsToImport.map(transaction => {
        // Format date to ISO format (YYYY-MM-DD)
        let formattedDate: string
        const parsedDate = parseDate(transaction.date)
        if (parsedDate) {
          // Convert to YYYY-MM-DD format
          const year = parsedDate.getFullYear()
          const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
          const day = String(parsedDate.getDate()).padStart(2, '0')
          formattedDate = `${year}-${month}-${day}`
        } else {
          formattedDate = String(transaction.date)
        }

        // Find category ID
        const categoryName = transaction.suggestedCategory || transaction.category
        const category = categoryName
          ? categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())
          : undefined

        return {
          row: transaction.row,
          date: formattedDate,
          type: transaction.type.toUpperCase() as 'EXPENSE' | 'INCOME' | 'TRANSFER',
          amount: parseFloat(transaction.amount),
          description: transaction.description,
          categoryId: category?.id,
          tags: transaction.tags ? transaction.tags.split(',').map(t => t.trim()) : undefined,
          notes: transaction.notes,
          // Include shared expense data if present
          sharedGroup: transaction.sharedGroup || undefined,
          paidBy: transaction.paidBy || undefined,
          splitType: transaction.splitType || undefined,
          participants: transaction.participants || undefined,
        }
      })

      // Call import API
      const response = await importAPI.importTransactions({
        accountId: selectedAccount,
        fileName: fileName,
        fileType: fileType,
        transactions: transactions,
      })

      const result = response.data.data

      setImportStats({
        success: result.successCount,
        failed: result.failedCount,
        total: result.successCount + result.failedCount,
      })

      setStep('complete')
      setIsProcessing(false)

      if (result.failedCount === 0) {
        toast.success(`Successfully imported ${result.successCount} transactions!`)
      } else {
        toast.warning(`Imported ${result.successCount} transactions, ${result.failedCount} failed`)
      }

      // Redirect to import history to see the processing status
      toast.info('Redirecting to import history...')
      setTimeout(() => {
        window.location.href = '/dashboard/import/history'
      }, 2000)
    } catch (error: any) {
      toast.error(`Import failed: ${error.response?.data?.message || error.message}`)
      setIsProcessing(false)
      setStep('preview')
    }
  }

  const resetImport = () => {
    setParsedData([])
    setStep('upload')
    setImportStats({ success: 0, failed: 0, total: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleEditTransaction = (transaction: ParsedTransaction) => {
    setEditingTransaction(transaction)

    // Find category ID from category name
    const categoryName = transaction.suggestedCategory || transaction.category || ''
    const foundCategory = categories.find(c => c.name === categoryName)

    // Parse tags from comma-separated string to array
    const tagsArray = transaction.tags ? transaction.tags.split(',').map(t => t.trim()) : []

    setEditFormData({
      date: typeof transaction.date === 'number' ? formatDateForDisplay(transaction.date) : transaction.date,
      type: transaction.type as 'EXPENSE' | 'INCOME' | 'TRANSFER',
      amount: parseFloat(transaction.amount) || 0,
      description: transaction.description,
      categoryId: foundCategory?.id || '',
      tags: tagsArray,
      notes: transaction.notes || '',
      sharedGroup: transaction.sharedGroup || '',
    })
    setIsEditModalOpen(true)
  }

  const handleModalSubmit = async (data: TransactionFormData) => {
    if (!editingTransaction) return

    // Get category name from categoryId
    const selectedCategory = categories.find(c => c.id === data.categoryId)
    const categoryName = selectedCategory?.name || ''

    // Convert tags array to comma-separated string
    const tagsString = data.tags?.join(', ') || ''

    const updatedTransactions = parsedData.map(tx => {
      if (tx.row === editingTransaction.row) {
        const updated = {
          ...tx,
          date: data.date || '',
          type: data.type,
          amount: data.amount?.toString() || '',
          description: data.description || '',
          category: categoryName,
          tags: tagsString,
          notes: data.notes || '',
          sharedGroup: data.sharedGroup || '',
          isEdited: true,
        }

        // Re-validate the edited transaction
        const errors: string[] = []
        if (!updated.date) errors.push('Date is required')
        if (!updated.type) errors.push('Type is required')
        if (!updated.amount) errors.push('Amount is required')
        if (!updated.description) errors.push('Description is required')

        const validTypes = ['EXPENSE', 'INCOME', 'TRANSFER']
        if (updated.type && !validTypes.includes(updated.type.toUpperCase())) {
          errors.push(`Type must be one of: ${validTypes.join(', ')}`)
        }

        const amount = parseFloat(updated.amount)
        if (updated.amount && (isNaN(amount) || amount <= 0)) {
          errors.push('Amount must be a positive number')
        }

        if (updated.date) {
          const parsedDate = parseDate(updated.date)
          if (!parsedDate) {
            errors.push('Invalid date format. Use YYYY-MM-DD, DD/MM/YYYY, or DD-MM-YYYY')
          }
        }

        updated.errors = errors
        updated.isValid = errors.length === 0

        return updated
      }
      return tx
    })

    setParsedData(updatedTransactions)
    setIsEditModalOpen(false)
    setEditingTransaction(null)
    toast.success('Transaction updated successfully')
  }

  const validTransactions = parsedData.filter(t => t.isValid)
  const invalidTransactions = parsedData.filter(t => !t.isValid)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Import Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a CSV or Excel file to import multiple transactions at once
          </p>
        </div>
        <Link href="/dashboard/import/history">
          <Button variant="outline" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            View History
          </Button>
        </Link>
      </div>

      {step === 'upload' && (
        <>
          {/* Account Selection */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">1. Select Account</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose which account to import transactions to</p>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                required
              >
                <option value="">Select an account...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </Select>
            </CardContent>
          </Card>

          {/* Download Templates */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">2. Download Template</h2>
              <p className="text-sm text-muted-foreground mt-1">Get a template file with examples and instructions</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  onClick={() => downloadTemplate('csv')}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>
                <Button
                  onClick={() => downloadTemplate('excel')}
                  variant="outline"
                  className="flex-1"
                >
                  <Table className="w-4 h-4 mr-2" />
                  Download Excel Template
                </Button>
              </div>

              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground">
                    <p className="font-medium mb-1">Template includes:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Required fields: date, type, amount, description</li>
                      <li>Optional fields: category, tags, notes, sharedGroup</li>
                      <li>List of your available categories and groups</li>
                      <li>Example transactions to guide you</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-foreground">3. Upload File</h2>
              <p className="text-sm text-muted-foreground mt-1">Upload your completed CSV or Excel file</p>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-border hover:border-muted-foreground/50'
                  }`}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Drop your file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports CSV and Excel (.xlsx) files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className={!selectedAccount || isProcessing ? 'cursor-not-allowed' : 'cursor-pointer'}>
                  <span className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 ${!selectedAccount || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    }`}>
                    {isProcessing ? 'Processing...' : 'Choose File'}
                  </span>
                </label>
                {!selectedAccount && (
                  <p className="text-xs text-red-600 mt-2">Please select an account first</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {step === 'preview' && parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Preview & Validate</h2>
                <p className="text-sm text-muted-foreground mt-1">Review transactions before importing</p>
              </div>
              <Button onClick={resetImport} variant="outline">
                Start Over
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold text-foreground">{parsedData.length}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-600 dark:text-green-300 font-medium">Valid</p>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-200">{validTransactions.length}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-600 dark:text-red-300 font-medium">Errors</p>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-200">{invalidTransactions.length}</p>
              </div>
            </div>

            {/* Error List */}
            {invalidTransactions.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-3">Rows with Errors:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {invalidTransactions.map((transaction) => (
                    <div key={transaction.row} className="p-3 bg-card rounded border border-red-200 dark:border-red-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground mb-1">
                            Row {transaction.row}: {transaction.description || '(no description)'}
                          </p>
                          <ul className="text-xs text-red-600 dark:text-red-300 list-disc list-inside">
                            {transaction.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTransaction(transaction)}
                          className="flex items-center gap-1 flex-shrink-0"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid Transactions Preview */}
            {validTransactions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Valid Transactions ({validTransactions.length}):</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {validTransactions.map((transaction) => (
                          <tr key={transaction.row} className="hover:bg-muted/50">
                            <td className="px-4 py-3 text-sm text-foreground">{formatDateForDisplay(transaction.date)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${transaction.type === 'EXPENSE'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                }`}>
                                {transaction.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-foreground">{transaction.amount}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{transaction.description}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                {transaction.isEdited && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                    Edited
                                  </span>
                                )}
                                {transaction.suggestedCategory && transaction.suggestedCategory !== transaction.category ? (
                                  <span className="text-blue-600" title={`Original: ${transaction.category}`}>
                                    {transaction.suggestedCategory} *
                                  </span>
                                ) : (
                                  transaction.category || 'Uncategorized'
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditTransaction(transaction)}
                                className="flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {parsedData.some(t => t.suggestedCategory && t.suggestedCategory !== t.category) && (
                  <p className="text-xs text-blue-600 mt-2">
                    * Category was automatically matched to a similar existing category
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {validTransactions.length > 0 && (
                <Button
                  onClick={() => handleImport(true)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Import {validTransactions.length} Valid Transaction(s)
                </Button>
              )}
              {invalidTransactions.length > 0 && validTransactions.length === 0 && (
                <Button onClick={resetImport} variant="outline" className="flex-1">
                  Fix Errors & Upload Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Import Complete!</h2>
            <p className="text-muted-foreground mb-6">Your transactions have been imported successfully</p>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{importStats.total}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-300">Success</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-200">{importStats.success}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-300">Failed</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-200">{importStats.failed}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button onClick={resetImport} variant="outline">
                Import More
              </Button>
              <Button onClick={() => window.location.href = '/dashboard/transactions'}>
                View Transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Transaction Modal */}
      <TransactionFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleModalSubmit}
        accounts={accounts}
        editingTransaction={editingTransaction}
        suggestedCategory={editingTransaction?.suggestedCategory}
        initialData={editFormData}
        mode="import"
      />
    </div>
  )
}
