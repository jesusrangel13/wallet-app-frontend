import { apiClient } from './api-client'
import type { ApiResponse, Account, CreateAccountForm } from '@/types'

export const accountAPI = {
  create: (data: CreateAccountForm) =>
    apiClient.post<ApiResponse<Account>>('/accounts', data),

  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{
      data: Account[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>>('/accounts', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Account>>(`/accounts/${id}`),

  update: (id: string, data: Partial<CreateAccountForm>) =>
    apiClient.put<ApiResponse<Account>>(`/accounts/${id}`, data),

  delete: (id: string, transferToAccountId?: string) =>
    apiClient.delete<ApiResponse<{
      hasTransactions?: boolean
      transactionCount?: number
      transferred?: boolean
      message: string
    }>>(`/accounts/${id}`, { data: { transferToAccountId } }),

  getBalance: (id: string) =>
    apiClient.get<ApiResponse<{ id: string; name: string; balance: number; currency: string }>>(`/accounts/${id}/balance`),

  getTotalBalance: () =>
    apiClient.get<ApiResponse<Record<string, number>>>('/accounts/balance/total'),

  getBalanceHistory: (id: string, month?: number, year?: number) =>
    apiClient.get<ApiResponse<{
      history: Array<{ date: string; balance: number }>;
      currentBalance: number;
      previousMonthBalance: number;
      percentageChange: number;
      month: number;
      year: number;
    }>>(`/accounts/${id}/balance-history`, { params: { month, year } }),
}
