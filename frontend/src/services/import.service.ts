import { apiClient } from './api-client'
import type { ApiResponse } from '@/types'

export const importAPI = {
  importTransactions: (data: {
    accountId: string
    fileName: string
    fileType: 'CSV' | 'EXCEL'
    transactions: Array<{
      row: number
      date: string
      type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
      amount: number
      description: string
      categoryId?: string
      tags?: string[]
      notes?: string
    }>
  }) =>
    apiClient.post<ApiResponse<{
      importHistoryId: string
      successCount: number
      failedCount: number
      transactions: Array<{
        row: number
        transactionId?: string
        status: 'SUCCESS' | 'FAILED'
        errorMessage?: string
      }>
    }>>('/import', data),

  getHistory: () =>
    apiClient.get<ApiResponse<any[]>>('/import/history'),

  getHistoryById: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/import/history/${id}`),
}
