import { apiClient } from './api-client'
import type { ApiResponse, Budget, BudgetVsActual, CreateBudgetForm } from '@/types'

export const budgetAPI = {
  create: (data: CreateBudgetForm) =>
    apiClient.post<ApiResponse<Budget>>('/budgets', data),

  getAll: (params?: { year?: number; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{
      data: Budget[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>>('/budgets', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Budget>>(`/budgets/${id}`),

  update: (id: string, amount: number) =>
    apiClient.put<ApiResponse<Budget>>(`/budgets/${id}`, { amount }),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/budgets/${id}`),

  getVsActual: (month: number, year: number) =>
    apiClient.get<ApiResponse<BudgetVsActual>>('/budgets/vs-actual', { params: { month, year } }),

  getCurrent: () =>
    apiClient.get<ApiResponse<BudgetVsActual>>('/budgets/current'),
}
