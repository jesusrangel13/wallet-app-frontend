'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { importAPI } from '@/lib/api'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, FileText, CheckCircle2, XCircle, Calendar, Upload, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ImportHistory as ImportHistoryType, ImportHistoryStatus } from '@/types'
import { LoadingSpinner, LoadingMessages } from '@/components/ui/Loading'

type ImportHistory = ImportHistoryType

export default function ImportHistoryPage() {
  const router = useRouter()
  const [imports, setImports] = useState<ImportHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    // Set up polling every 3 seconds if there are processing imports
    const hasProcessing = imports.some(imp => imp.status === 'PROCESSING')

    if (hasProcessing) {
      const interval = setInterval(() => {
        loadHistory(false) // Don't show loading state during polling
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [imports])

  const loadHistory = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      const response = await importAPI.getHistory()
      setImports(response.data.data)
    } catch (error: any) {
      if (showLoading) {
        toast.error('Failed to load import history')
      }
    } finally {
      if (showLoading) {
        setIsLoading(false)
      }
    }
  }

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <LoadingSpinner size="sm" className="text-blue-800" />
            {LoadingMessages.processing}
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-4 h-4" />
            Completed
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="w-4 h-4" />
            Failed
          </span>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/import">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import History</h1>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <LoadingSpinner size="sm" />
              {LoadingMessages.imports}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/import">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Import History</h1>
            <p className="text-sm text-gray-600 mt-1">
              View all your previous transaction imports
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {imports.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No imports yet</h3>
            <p className="text-gray-600 mb-6">
              Start importing transactions to see your history here
            </p>
            <Link href="/dashboard/import">
              <Button>Import Transactions</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Import List */}
      {imports.length > 0 && (
        <div className="grid gap-4">
          {imports.map((importItem) => (
            <Card key={importItem.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {importItem.fileName}
                          </h3>
                          {getStatusBadge(importItem.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(importItem.importedAt)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Account</p>
                        <p className="text-sm font-medium text-gray-900">
                          {importItem.account.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">File Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {importItem.fileType}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Rows</p>
                        <p className="text-sm font-medium text-gray-900">
                          {importItem.totalRows}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Status</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm font-medium">{importItem.successCount}</span>
                          </div>
                          {importItem.failedCount > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">{importItem.failedCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => router.push(`/dashboard/import/history/${importItem.id}`)}
                  >
                    View Details
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-600">
                      Success Rate: {((importItem.successCount / importItem.totalRows) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(importItem.successCount / importItem.totalRows) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
