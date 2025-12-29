'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { investmentAPI } from '@/lib/api'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ImportHistory {
  id: string
  fileName: string
  fileType: string
  totalRows: number
  successCount: number
  failedCount: number
  duplicateCount: number
  status: string
  importedAt: string
  completedAt: string
  account: {
    id: string
    name: string
    currency: string
  }
}

export default function InvestmentImportHistoryPage() {
  const [imports, setImports] = useState<ImportHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImport, setSelectedImport] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const res = await investmentAPI.getImportHistory()
      const data = res.data as any
      setImports(Array.isArray(data) ? data : data.data)
    } catch (error: any) {
      toast.error('Failed to load import history')
    } finally {
      setIsLoading(false)
    }
  }

  const viewDetails = async (importId: string) => {
    try {
      const res = await investmentAPI.getImportHistoryById(importId)
      setSelectedImport(res.data)
      setIsDetailModalOpen(true)
    } catch (error: any) {
      toast.error('Failed to load import details')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        )
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Processing
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/investments/import"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Import History
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            View your past investment transaction imports
          </p>
        </div>
        <Link href="/dashboard/investments/import">
          <Button>New Import</Button>
        </Link>
      </div>

      {/* Imports List */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading import history...</p>
          </CardContent>
        </Card>
      ) : imports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No imports yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start importing your broker transaction history
            </p>
            <Link href="/dashboard/investments/import">
              <Button>Import Transactions</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {imports.map((imp) => (
            <Card key={imp.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {imp.fileName}
                      </h3>
                      {getStatusBadge(imp.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Account</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {imp.account.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Total Rows</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {imp.totalRows}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Success</p>
                        <p className="font-medium text-green-600 dark:text-green-400">
                          {imp.successCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Duplicates</p>
                        <p className="font-medium text-yellow-600 dark:text-yellow-400">
                          {imp.duplicateCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Failed</p>
                        <p className="font-medium text-red-600 dark:text-red-400">
                          {imp.failedCount}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Imported {formatDistanceToNow(new Date(imp.importedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div>
                    <Button onClick={() => viewDetails(imp.id)} variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedImport && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Import Details
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">File Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedImport.fileName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Account</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedImport.account.name}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Row
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Description
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Symbol
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Amount
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                          Error
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedImport.importedTransactions.slice(0, 50).map((tx: any) => (
                        <tr key={tx.id}>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                            {tx.rowNumber}
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {tx.isDuplicate ? (
                              <span className="px-2 py-1 text-xs rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                                Duplicate
                              </span>
                            ) : tx.status === 'SUCCESS' ? (
                              <span className="px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                Success
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                            {tx.csvDescription}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                            {tx.csvSymbol || '-'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                            {tx.csvNetAmount}
                          </td>
                          <td className="px-3 py-2 text-sm text-red-600 dark:text-red-400">
                            {tx.errorMessage || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={() => setIsDetailModalOpen(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
