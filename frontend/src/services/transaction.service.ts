import { apiClient } from './api-client'
import type { ApiResponse, Transaction, CreateTransactionForm } from '@/types'

export const transactionAPI = {
  create: (data: CreateTransactionForm) =>
    apiClient.post<ApiResponse<Transaction>>('/transactions', data),

  getAll: (filters?: {
    accountId?: string
    type?: string
    categoryId?: string
    startDate?: string
    endDate?: string
    minAmount?: number
    maxAmount?: number
    tags?: string[]
    search?: string
    sortBy?: 'date' | 'amount' | 'payee'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) =>
    apiClient.get<ApiResponse<{
      data: Transaction[]
      total: number
      page: number
      limit: number
      totalPages: number
      hasMore: boolean
    }>>('/transactions', { params: filters }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`),

  update: (id: string, data: Partial<CreateTransactionForm>) =>
    apiClient.put<ApiResponse<Transaction>>(`/transactions/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/transactions/${id}`),

  getByCategory: () =>
    apiClient.get<ApiResponse<Record<string, { income: number; expense: number }>>>('/transactions/by-category'),

  getStats: (month: number, year: number) =>
    apiClient.get<ApiResponse<{
      totalIncome: number
      totalExpense: number
      totalTransactions: number
      byCategory: Record<string, number>
    }>>('/transactions/stats', { params: { month, year } }),

  bulkDelete: (transactionIds: string[]) =>
    apiClient.post<ApiResponse<{
      deletedCount: number
      message: string
    }>>('/transactions/bulk-delete', { transactionIds }),

  getRecent: (limit: number = 5) =>
    apiClient.get<ApiResponse<Transaction[]>>('/transactions/recent', { params: { limit } }),

  getUniquePayees: (search?: string) =>
    apiClient.get<ApiResponse<string[]>>('/transactions/payees', { params: search ? { search } : {} }),

  getLastByPayee: (payee: string) =>
    apiClient.get<ApiResponse<Transaction>>('/transactions/last-by-payee', { params: { payee } }),
}
