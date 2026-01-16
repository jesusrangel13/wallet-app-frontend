import { apiClient } from './api-client'
import type { ApiResponse } from '@/types'

export const dashboardAPI = {
  getCashFlow: (months?: number, params?: { month?: number; year?: number }) =>
    apiClient.get<ApiResponse<Array<{
      month: string
      income: number
      expense: number
    }>>>('/dashboard/cashflow', { params: { months, ...(params || {}) } }),

  getExpensesByCategory: (params?: { month?: number; year?: number }) =>
    apiClient.get<ApiResponse<Array<{
      category: string
      amount: number
      percentage: number
    }>>>('/dashboard/expenses-by-category', { params }),

  getExpensesByParentCategory: (params?: { month?: number; year?: number }) =>
    apiClient.get<ApiResponse<Array<{
      category: string
      amount: number
      percentage: number
      icon: string | null
      color: string | null
    }>>>('/dashboard/expenses-by-parent-category', { params }),

  getBalanceHistory: (days?: number, params?: { month?: number; year?: number }) =>
    apiClient.get<ApiResponse<Array<{
      date: string
      balance: number
    }>>>('/dashboard/balance-history', { params: { days, ...(params || {}) } }),

  getGroupBalances: (params?: { month?: number; year?: number }) =>
    apiClient.get<ApiResponse<Array<{
      groupId: string
      groupName: string
      totalOwed: number
      members: Array<{
        userId: string
        name: string
        email: string
        balance: number
      }>
    }>>>('/dashboard/group-balances', { params }),

  getAccountBalances: () =>
    apiClient.get<ApiResponse<Array<{
      id: string
      name: string
      type: string
      balance: number
      currency: string
      creditLimit: number | null
      color: string
    }>>>('/dashboard/account-balances'),

  getPersonalExpenses: (params?: { month?: number; year?: number }) =>
    apiClient.get<ApiResponse<{
      total: number
      month: string
    }>>('/dashboard/personal-expenses', { params }),

  getSharedExpensesTotal: (params?: { month?: number; year?: number }) =>
    apiClient.get<ApiResponse<{
      total: number
      count: number
      month: string
    }>>('/dashboard/shared-expenses', { params }),

  getMonthlySavings: (params?: { month?: number; year?: number }) =>
    apiClient.get<ApiResponse<{
      savings: number
      savingsRate: number
      income: number
      expenses: number
      breakdown: {
        personal: number
        shared: number
      }
      month: string
    }>>('/dashboard/savings', { params }),

  getExpensesByTag: (params?: { month?: number; year?: number }) =>
    apiClient.get<ApiResponse<Array<{
      tagName: string
      tagColor: string | null
      totalAmount: number
      percentage: number
      transactionCount: number
    }>>>('/dashboard/expenses-by-tag', { params }),

  getTopTags: (params?: { month?: number; year?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Array<{
      tagId: string
      tagName: string
      tagColor: string | null
      transactionCount: number
      totalAmount: number
      averageAmount: number
    }>>>('/dashboard/top-tags', { params }),

  getTagTrend: (months?: number, tagIds?: string[]) =>
    apiClient.get<ApiResponse<Array<{
      tagId: string
      tagName: string
      tagColor: string | null
      monthlyData: Array<{
        month: number
        year: number
        amount: number
      }>
    }>>>('/dashboard/tag-trend', {
      params: {
        months,
        ...(tagIds && tagIds.length > 0 ? { tagIds } : {})
      }
    }),
}
