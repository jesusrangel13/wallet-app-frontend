import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { ApiResponse } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await axios.get<ApiResponse<DashboardSummary>>(
        `${API_URL}/dashboard/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await axios.get(
        `${API_URL}/dashboard/balance-history`,
        {
          params: { days },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook para obtener los balances de grupos
 */
export function useGroupBalances() {
  return useQuery({
    queryKey: ['group-balances'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await axios.get(
        `${API_URL}/dashboard/group-balances`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
