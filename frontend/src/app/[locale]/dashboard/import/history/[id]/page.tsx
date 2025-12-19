'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { importAPI } from '@/lib/api'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, FileText, CheckCircle2, XCircle, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface ImportedTransaction {
  id: string
  rowNumber: number
  status: 'SUCCESS' | 'FAILED'
  errorMessage: string | null
  originalDate: string
  type: string
  amount: string
  description: string
  category: string | null
  tags: string | null
  notes: string | null
  transaction: {
    id: string
    amount: number
    description: string
    date: string
    categoryId: string | null
    category: {
      id: string
      name: string
      icon?: string | null
      color?: string | null
      type?: string
    } | null
  } | null
}

interface ImportHistoryDetail {
  id: string
  fileName: string
  fileType: string
  totalRows: number
  successCount: number
  failedCount: number
  importedAt: string
  account: {
    id: string
    name: string
    currency: string
  }
  importedTransactions: ImportedTransaction[]
}

export default function ImportDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [importDetail, setImportDetail] = useState<ImportHistoryDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')

  const loadImportDetail = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await importAPI.getHistoryById(id)
      setImportDetail(response.data.data)
    } catch (error: any) {
      toast.error('Failed to load import details')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadImportDetail()
  }, [loadImportDetail])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(amount))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/import/history">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import Details</h1>
            <p className="text-sm text-gray-600 mt-1">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!importDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/import/history">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import not found</h1>
          </div>
        </div>
      </div>
    )
  }

  const filteredTransactions = importDetail.importedTransactions.filter(tx => {
    if (filter === 'all') return true
    if (filter === 'success') return tx.status === 'SUCCESS'
    if (filter === 'failed') return tx.status === 'FAILED'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/import/history">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            View detailed information about this import
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {importDetail.fileName}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Calendar className="w-4 h-4" />
                {formatDate(importDetail.importedAt)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Account</p>
                  <p className="text-sm font-medium text-gray-900">
                    {importDetail.account.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">File Type</p>
                  <p className="text-sm font-medium text-gray-900">
                    {importDetail.fileType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Rows</p>
                  <p className="text-sm font-medium text-gray-900">
                    {importDetail.totalRows}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Successful</p>
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{importDetail.successCount}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Failed</p>
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{importDetail.failedCount}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-600">
                    Success Rate: {((importDetail.successCount / importDetail.totalRows) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(importDetail.successCount / importDetail.totalRows) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({importDetail.totalRows})
        </button>
        <button
          onClick={() => setFilter('success')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'success'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Successful ({importDetail.successCount})
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'failed'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Failed ({importDetail.failedCount})
        </button>
      </div>

      {/* Transactions List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Row
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.rowNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tx.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tx.originalDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        tx.type === 'EXPENSE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(tx.amount, importDetail.account.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tx.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tx.transaction?.category?.name || tx.category || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {tx.errorMessage ? (
                        <div className="flex items-start gap-1">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{tx.errorMessage}</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
