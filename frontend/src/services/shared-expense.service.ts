import { apiClient } from './api-client'
import type { ApiResponse, SharedExpense, Payment, CreateSharedExpenseForm, CreatePaymentForm } from '@/types'

export const sharedExpenseAPI = {
  create: (data: CreateSharedExpenseForm) =>
    apiClient.post<ApiResponse<SharedExpense>>('/shared-expenses', data),

  getAll: (groupId?: string) =>
    apiClient.get<ApiResponse<SharedExpense[]>>('/shared-expenses', { params: { groupId } }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<SharedExpense>>(`/shared-expenses/${id}`),

  update: (id: string, data: Partial<CreateSharedExpenseForm>) =>
    apiClient.put<ApiResponse<SharedExpense>>(`/shared-expenses/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/shared-expenses/${id}`),

  settlePayment: (data: CreatePaymentForm) =>
    apiClient.post<ApiResponse<Payment>>('/shared-expenses/payments', data),

  getPaymentHistory: (groupId?: string) =>
    apiClient.get<ApiResponse<Payment[]>>('/shared-expenses/payments/history', { params: { groupId } }),

  getSimplifiedDebts: (groupId: string) =>
    apiClient.get<ApiResponse<Array<{
      from: { id: string; name: string }
      to: { id: string; name: string }
      amount: number
    }>>>(`/shared-expenses/groups/${groupId}/simplified-debts`),

  markParticipantAsPaid: (expenseId: string, participantUserId: string, accountId?: string) =>
    apiClient.patch<ApiResponse<any>>(`/shared-expenses/${expenseId}/participants/${participantUserId}/mark-paid`, { accountId }),

  markParticipantAsUnpaid: (expenseId: string, participantUserId: string) =>
    apiClient.patch<ApiResponse<any>>(`/shared-expenses/${expenseId}/participants/${participantUserId}/mark-unpaid`),
}
