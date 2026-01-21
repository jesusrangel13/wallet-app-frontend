import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { ApiResponse } from '@/types'
import { safeGetItem } from '@/lib/storage'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Helper to get auth headers consistently
function getAuthHeaders() {
  const token = safeGetItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

interface DashboardSummary {
  cashFlow: any
  expensesByCategory: any
  balanceHistory: any
  groupBalances: any
  accountBalances: any
  timestamp: string
}

/**
 * Hook para obtener todo el resumen del dashboard en una sola llamada
 * Esto reemplaza 5+ llamadas separadas por 1 sola llamada
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const response = await axios.get<ApiResponse<DashboardSummary>>(
        `${API_URL}/dashboard/summary`,
        { headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
  })
}

/**
 * Hook para obtener el historial de balance
 */
export function useBalanceHistory(days: number = 30) {
  return useQuery({
    queryKey: ['balance-history', days],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/balance-history`,
        { params: { days }, headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook para obtener los balances de grupos
 */
export function useGroupBalances(params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: ['group-balances', params],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/group-balances`,
        { params, headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener los balances de cuentas
 */
export function useAccountBalances() {
  return useQuery({
    queryKey: ['account-balances'],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/account-balances`,
        { headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener gastos por categoría
 */
export function useExpensesByCategory(params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: ['expenses-by-category', params],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/expenses-by-category`,
        { params, headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener gastos por categoría padre
 */
export function useExpensesByParentCategory(params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: ['expenses-by-parent-category', params],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/expenses-by-parent-category`,
        { params, headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener flujo de caja
 */
export function useCashFlow(months?: number, params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: ['cash-flow', months, params],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/cashflow`,
        { params: { months, ...(params || {}) }, headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener gastos personales
 */
export function usePersonalExpenses(params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: ['personal-expenses', params],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/personal-expenses`,
        { params, headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener gastos compartidos
 */
export function useSharedExpensesTotal(params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: ['shared-expenses-total', params],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/shared-expenses`,
        { params, headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener ahorros mensuales
 */
export function useMonthlySavings(params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: ['monthly-savings', params],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/savings`,
        { params, headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener gastos por etiqueta
 */
export function useExpensesByTag(params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: ['expenses-by-tag', params],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/expenses-by-tag`,
        { params, headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener las etiquetas principales
 */
export function useTopTags(params?: { month?: number; year?: number; limit?: number }) {
  return useQuery({
    queryKey: ['top-tags', params],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/top-tags`,
        { params, headers: getAuthHeaders() }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener tendencia de etiquetas
 */
export function useTagTrend(months?: number, tagIds?: string[]) {
  return useQuery({
    queryKey: ['tag-trend', months, tagIds],
    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/dashboard/tag-trend`,
        {
          params: { months, ...(tagIds && tagIds.length > 0 ? { tagIds } : {}) },
          headers: getAuthHeaders(),
        }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
