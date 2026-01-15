import { apiClient } from './api-client'
import type { ApiResponse } from '@/types'

export const dashboardPreferenceAPI = {
  getPreferences: () =>
    apiClient.get<ApiResponse<{
      id: string
      userId: string
      widgets: Array<{
        id: string
        type: string
        settings?: Record<string, any>
      }>
      layout: Array<{
        i: string
        x: number
        y: number
        w: number
        h: number
        minW?: number
        minH?: number
        maxW?: number
        maxH?: number
      }>
      createdAt: string
      updatedAt: string
    }>>('/dashboard-preferences'),

  savePreferences: (widgets: any[], layout: any[]) =>
    apiClient.put<ApiResponse<any>>('/dashboard-preferences', {
      widgets,
      layout,
    }),

  addWidget: (widget: any) =>
    apiClient.post<ApiResponse<any>>('/dashboard-preferences/widgets', {
      widget,
    }),

  removeWidget: (widgetId: string) =>
    apiClient.delete<ApiResponse<any>>(`/dashboard-preferences/widgets/${widgetId}`),

  updateWidgetSettings: (widgetId: string, settings: Record<string, any>) =>
    apiClient.patch<ApiResponse<any>>(`/dashboard-preferences/widgets/${widgetId}/settings`, {
      settings,
    }),

  updateLayout: (layout: any[]) =>
    apiClient.patch<ApiResponse<any>>('/dashboard-preferences/layout', {
      layout,
    }),

  resetToDefaults: () =>
    apiClient.delete<ApiResponse<any>>('/dashboard-preferences/reset'),
}
