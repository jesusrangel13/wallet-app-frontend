import { apiClient } from './api-client'
import type { ApiResponse, Group, User, Payment, CreateGroupForm } from '@/types'

export const groupAPI = {
  create: (data: CreateGroupForm) =>
    apiClient.post<ApiResponse<Group>>('/groups', data),

  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Group[] | {
      data: Group[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>>('/groups', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Group>>(`/groups/${id}`),

  update: (id: string, data: Partial<CreateGroupForm>) =>
    apiClient.put<ApiResponse<Group>>(`/groups/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/groups/${id}`),

  addMember: (id: string, email: string) =>
    apiClient.post<ApiResponse<{ message: string; member: User }>>(`/groups/${id}/members`, { email }),

  removeMember: (id: string, memberId: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/groups/${id}/members/${memberId}`),

  leave: (id: string) =>
    apiClient.post<ApiResponse<{ message: string }>>(`/groups/${id}/leave`, {}),

  getBalances: (id: string) =>
    apiClient.get<ApiResponse<Array<{ user: User; balance: number }>>>(`/groups/${id}/balances`),

  updateDefaultSplit: (id: string, data: { defaultSplitType: string; memberSplits: Array<{ userId: string; percentage?: number; shares?: number; exactAmount?: number }> }) =>
    apiClient.put<ApiResponse<Group>>(`/groups/${id}/default-split`, data),

  settleAllBalance: (groupId: string, otherUserId: string, accountId?: string) =>
    apiClient.post<ApiResponse<{
      payment: Payment;
      settledExpenses: number;
      amount: number;
      transactionsCreated: boolean;
    }>>(`/groups/${groupId}/settle-balance`, { otherUserId, accountId }),
}
