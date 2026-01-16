import { apiClient } from './api-client'
import type { ApiResponse, Tag, CreateTagForm } from '@/types'

export const tagAPI = {
  create: (data: CreateTagForm) =>
    apiClient.post<ApiResponse<Tag>>('/tags', data),

  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<Tag[]>>('/tags', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<Tag>>(`/tags/${id}`),

  update: (id: string, data: Partial<CreateTagForm>) =>
    apiClient.put<ApiResponse<Tag>>(`/tags/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/tags/${id}`),
}
