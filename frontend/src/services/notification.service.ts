import { apiClient } from './api-client'
import type { ApiResponse } from '@/types'

export const notificationAPI = {
  getAll: (limit?: number) =>
    apiClient.get<ApiResponse<Array<{
      id: string;
      userId: string;
      type: 'PAYMENT_RECEIVED' | 'SHARED_EXPENSE_CREATED' | 'GROUP_MEMBER_ADDED' | 'BALANCE_SETTLED';
      title: string;
      message: string;
      data?: any;
      isRead: boolean;
      createdAt: string;
    }>>>('/notifications', { params: { limit } }),

  getUnread: () =>
    apiClient.get<ApiResponse<Array<{
      id: string;
      userId: string;
      type: 'PAYMENT_RECEIVED' | 'SHARED_EXPENSE_CREATED' | 'GROUP_MEMBER_ADDED' | 'BALANCE_SETTLED';
      title: string;
      message: string;
      data?: any;
      isRead: boolean;
      createdAt: string;
    }>>>('/notifications/unread'),

  getCount: () =>
    apiClient.get<ApiResponse<{ count: number }>>('/notifications/count'),

  markAsRead: (id: string) =>
    apiClient.patch<ApiResponse<any>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.patch<ApiResponse<any>>('/notifications/read-all'),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/notifications/${id}`),

  deleteAllRead: () =>
    apiClient.delete<ApiResponse<any>>('/notifications/read/all'),
}
