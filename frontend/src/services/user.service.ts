import { apiClient } from './api-client'
import type { ApiResponse, User } from '@/types'

export const userAPI = {
  getProfile: () =>
    apiClient.get<ApiResponse<User>>('/users/profile'),

  updateProfile: (data: Partial<User>) =>
    apiClient.put<ApiResponse<User>>('/users/profile', data),

  deleteAccount: () =>
    apiClient.delete<ApiResponse<{ message: string }>>('/users/account'),

  getStats: () =>
    apiClient.get<ApiResponse<{ accounts: number; transactions: number; groups: number }>>('/users/stats'),

  getMyBalances: (params?: { month?: number; year?: number }) =>
    apiClient.get<ApiResponse<{
      totalOthersOweMe: number;
      totalIOweOthers: number;
      netBalance: number;
      groupBalances: Array<{
        group: { id: string; name: string; coverImageUrl?: string };
        othersOweMe: number;
        iOweOthers: number;
        netBalance: number;
        peopleWhoOweMe: Array<{
          amount: number;
          totalHistorical: number;
          totalPaid: number;
          user: { id: string; name: string; avatarUrl?: string };
          unpaidExpenses: Array<{
            expenseId: string;
            description: string;
            amount: number;
            date: string;
          }>;
          paidExpenses: Array<{
            expenseId: string;
            description: string;
            amount: number;
            date: string;
            paidDate?: string;
          }>;
        }>;
        peopleIOweTo: Array<{
          amount: number;
          totalHistorical: number;
          totalPaid: number;
          user: { id: string; name: string; avatarUrl?: string };
          unpaidExpenses: Array<{
            expenseId: string;
            description: string;
            amount: number;
            date: string;
          }>;
          paidExpenses: Array<{
            expenseId: string;
            description: string;
            amount: number;
            date: string;
            paidDate?: string;
          }>;
        }>;
      }>;
    }>>('/users/my-balances', { params }),

  updateDefaultSharedExpenseAccount: (accountId: string | null) =>
    apiClient.patch<ApiResponse<User>>('/users/me/default-shared-expense-account', { accountId }),
}
