import { apiClient } from './api-client'
import type { ApiResponse, MergedCategory } from '@/types'

// Category API (legacy - uses new template system internally)
export const categoryAPI = {
  // Returns merged categories from templates + overrides
  getAll: (type?: string) =>
    apiClient.get<ApiResponse<MergedCategory[]>>('/categories', { params: { type } }),
}

// Category Template API (new system - USE_CATEGORY_TEMPLATES enabled)
export const categoryTemplateAPI = {
  // Get user's merged categories (templates + overrides + custom)
  getUserCategories: () =>
    apiClient.get<ApiResponse<any[]>>('/categories/user/categories'),

  // Get all templates
  getAllTemplates: () =>
    apiClient.get<ApiResponse<any[]>>('/categories/templates/all'),

  // Get templates in hierarchy
  getTemplatesHierarchy: () =>
    apiClient.get<ApiResponse<any[]>>('/categories/templates/hierarchy'),

  // Override a template category
  createOverride: (data: { templateId: string; name?: string; icon?: string; color?: string }) =>
    apiClient.post<ApiResponse<any>>('/categories/overrides', data),

  // Get a category override
  getOverride: (id: string) =>
    apiClient.get<ApiResponse<any>>(`/categories/overrides/${id}`),

  // Update a category override
  updateOverride: (id: string, data: { name?: string; icon?: string; color?: string }) =>
    apiClient.put<ApiResponse<any>>(`/categories/overrides/${id}`, data),

  // Delete/deactivate a category override
  deleteOverride: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/categories/overrides/${id}`),

  // Create a custom category (or subcategory if parentId is provided)
  createCustom: (data: { name: string; icon?: string; color?: string; type: 'EXPENSE' | 'INCOME' | 'TRANSFER'; parentId?: string }) =>
    apiClient.post<ApiResponse<any>>('/categories/custom', data),

  // Get all custom categories
  getCustomCategories: () =>
    apiClient.get<ApiResponse<any[]>>('/categories/custom/all'),
}
