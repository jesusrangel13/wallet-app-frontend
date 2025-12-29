'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Account } from '@/types'
import { accountAPI, investmentAPI } from '@/lib/api'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, History } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface CSVRow {
  'Operation Date': string
  'Operation Type': string
  'Symbol': string
  'Description': string
  'Trade Action': string
  'Qty': string
  'Price': string
  'Net amount': string
  'Saldo': string
}

interface ParsedRow extends CSVRow {
  row: number
  isValid: boolean
  errors: string[]
  detectedType: string
}

export default function InvestmentImportPage() {
  const t = useTranslations('investments')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload')
  const [importStats, setImportStats] = useState({
    success: 0,
    failed: 0,
    duplicates: 0,
    total: 0,
    finalBalance: 0,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [currentTransaction, setCurrentTransaction] = useState<string>('')

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const res = await accountAPI.getAll()
      const accountsData = res.data as any
      const allAccounts = Array.isArray(accountsData) ? accountsData : accountsData.data
      // Filtrar solo cuentas de tipo INVESTMENT
      const investmentAccounts = allAccounts.filter((acc: Account) => acc.type === 'INVESTMENT')
      setAccounts(investmentAccounts)
    } catch (error: any) {
      toast.error('Failed to load accounts')
    }
  }

  const downloadTemplate = () => {
    const headers = [
      'Operation Date',
      'Operation Type',
      'Symbol',
      'Description',
      'Trade Action',
      'Qty',
      'Price',
      'Net amount',
      'Saldo',
    ]
    const exampleRows = [
      '2024-01-15T10:30:00.000Z;TRADE;AAPL;BUY - AAPL;BUY;10;150.50;-1505.00;5000.00',
      '2024-01-16T14:20:00.000Z;TRANSACTION;;DEPOSIT;;0;0;1000.00;6505.00',
      '2024-01-17T11:45:00.000Z;TRANSACTION;AAPL;DIVIDEND - DIVIDEND;;0;0;5.50;6510.50',
      '2024-01-18T09:15:00.000Z;TRADE;AAPL;SELL - AAPL;SELL;-5;155.00;775.00;7285.50',
    ]

    const csvContent = [
      headers.join(';'),
      ...exampleRows,
    ].join('\\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'investment_import_template.csv'
    link.click()
  }

  const detectTransactionType = (row: CSVRow): string => {
    if (row['Operation Type'] === 'TRADE') {
      return `TRADE (${row['Trade Action']})`
    }
    if (row['Operation Type'] === 'TRANSACTION') {
      if (row['Description'].includes('DIVIDEND')) return 'DIVIDEND'
      if (row['Description'] === 'DEPOSIT') return 'DEPOSIT'
      if (row['Description'] === 'WITHDRAWAL') return 'WITHDRAWAL'
      if (row['Description'] === 'FPL') return 'FPL (Skip)'
    }
    return 'UNKNOWN'
  }

  const parseCSV = async (file: File) => {
    try {
      setIsProcessing(true)
      const text = await file.text()

      // Importar PapaParse dinámicamente
      const Papa = (await import('papaparse')).default

      const result = Papa.parse<CSVRow>(text, {
        header: true,
        delimiter: ';', // CRÍTICO: punto y coma
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim(),
      })

      if (result.errors.length > 0) {
        toast.error('Error parsing CSV: ' + result.errors[0].message)
        return
      }

      // Validar y procesar filas
      const parsed: ParsedRow[] = result.data.map((row, index) => {
        const errors: string[] = []

        if (!row['Operation Date']) errors.push('Missing Operation Date')
        if (!row['Operation Type']) errors.push('Missing Operation Type')
        if (!row['Description']) errors.push('Missing Description')

        const detectedType = detectTransactionType(row)

        return {
          ...row,
          row: index + 1,
          isValid: errors.length === 0,
          errors,
          detectedType,
        }
      })

      setParsedData(parsed)
      setFileName(file.name)
      setStep('preview')
    } catch (error: any) {
      toast.error('Failed to parse CSV: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      parseCSV(file)
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
    const file = e.dataTransfer.files[0]
    if (file) {
      parseCSV(file)
    }
  }

  const handleImport = async () => {
    if (!selectedAccount) {
      toast.error('Please select an investment account')
      return
    }

    const validRows = parsedData.filter((r) => r.isValid)
    if (validRows.length === 0) {
      toast.error('No valid rows to import')
      return
    }

    setStep('importing')
    setIsProcessing(true)
    setImportProgress(0)
    setCurrentTransaction('')

    try {
      // Convertir ParsedRow a CSVRow (eliminar campos extras)
      const csvRows = validRows.map(({ row, isValid, errors, detectedType, ...rest }) => rest)

      const totalTransactions = validRows.length
      let currentTxnIndex = 0

      // Simular progreso realista mientras se importa
      const progressInterval = setInterval(() => {
        currentTxnIndex = Math.min(currentTxnIndex + 1, totalTransactions - 1)
        const progress = (currentTxnIndex / totalTransactions) * 95 // Max 95% hasta que termine
        setImportProgress(progress)
        setCurrentTransaction(`${currentTxnIndex + 1}/${totalTransactions}`)
      }, Math.max(50, 3000 / totalTransactions)) // Ajustar velocidad según cantidad

      const result = await investmentAPI.importTransactions({
        accountId: selectedAccount,
        fileName,
        fileType: 'CSV',
        csvRows,
      })

      clearInterval(progressInterval)
      setImportProgress(100)

      // La respuesta viene en result.data.data porque ApiResponse<T> envuelve la data
      const importResult = result.data.data

      console.log('Import result from API:', importResult)

      setImportStats({
        success: importResult.successCount,
        failed: importResult.failedCount,
        duplicates: importResult.duplicateCount,
        total: validRows.length,
        finalBalance: importResult.finalBalance,
      })

      console.log('Import stats set:', {
        success: importResult.successCount,
        failed: importResult.failedCount,
        duplicates: importResult.duplicateCount,
        total: validRows.length,
        finalBalance: importResult.finalBalance,
      })

      // Esperar un momento para que se vea el 100%
      await new Promise((resolve) => setTimeout(resolve, 500))

      setStep('complete')
      toast.success(`Import completed! ${importResult.successCount} transactions imported.`)
    } catch (error: any) {
      toast.error('Import failed: ' + (error.response?.data?.message || error.message))
      setStep('preview')
    } finally {
      setIsProcessing(false)
      setImportProgress(0)
    }
  }

  const resetImport = () => {
    setParsedData([])
    setFileName('')
    setStep('upload')
    setImportStats({ success: 0, failed: 0, duplicates: 0, total: 0, finalBalance: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/investments"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Import Investment Transactions
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Import your broker transaction history from CSV
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/investments/import/history">
            <Button variant="outline">
              <History className="w-4 h-4 mr-2" />
              Import History
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-4">
        {['upload', 'preview', 'importing', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : i < ['upload', 'preview', 'importing', 'complete'].indexOf(step)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
              }`}
            >
              {i < ['upload', 'preview', 'importing', 'complete'].indexOf(step) ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 3 && (
              <div
                className={`w-16 h-1 ${
                  i < ['upload', 'preview', 'importing', 'complete'].indexOf(step)
                    ? 'bg-green-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Upload CSV File</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Investment Account *
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              >
                <option value="">-- Select Account --</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Download Template */}
            <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Need a template?
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Download our CSV template with example data
                </p>
              </div>
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                Download Template
              </Button>
            </div>

            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Drag and drop your CSV file here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Select CSV File
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Only CSV files with semicolon delimiter (;) are supported
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Preview Import</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {parsedData.filter((r) => r.isValid).length} valid rows,{' '}
                  {parsedData.filter((r) => !r.isValid).length} errors
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={resetImport} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={parsedData.filter((r) => r.isValid).length === 0 || !selectedAccount}
                >
                  Import {parsedData.filter((r) => r.isValid).length} Transactions
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Symbol
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Price
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Amount
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {parsedData.map((row) => (
                    <tr
                      key={row.row}
                      className={!row.isValid ? 'bg-red-50 dark:bg-red-900/20' : ''}
                    >
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        {row.row}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        {new Date(row['Operation Date']).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {row.detectedType}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        {row['Symbol'] || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        {row['Qty'] || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        {row['Price'] || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                        {row['Net amount']}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {row.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-red-600">
                              {row.errors.join(', ')}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-4 sticky bottom-0 bg-white dark:bg-gray-900 py-2">
                  Showing all {parsedData.length} rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-lg font-semibold mb-2">Importing Transactions...</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please wait while we process your import
            </p>

            {/* Progress Bar */}
            <div className="max-w-md mx-auto">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${Math.min(importProgress, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {Math.round(importProgress)}% complete
              </p>
              {currentTransaction && (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Processing transaction {currentTransaction}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && (
        <Card>
          <CardHeader>
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Import Complete!
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {importStats.success}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Success</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {importStats.duplicates}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Duplicates</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {importStats.failed}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${(importStats.finalBalance || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Final Balance</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-4">
              <Link href="/dashboard/investments">
                <Button>View Portfolio</Button>
              </Link>
              <Button onClick={resetImport} variant="outline">
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
