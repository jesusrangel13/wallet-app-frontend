import { useQuery } from '@tanstack/react-query'
import { transactionAPI } from '@/lib/api'
import type { Transaction } from '@/types'

interface TransactionFilters {
  accountId?: string
  type?: string
  categoryId?: string
  startDate?: string
  endDate?: string
  minAmount?: number
  maxAmount?: number
  tags?: string[]
  page?: number
  limit?: number
}

/**
 * Hook para obtener transacciones con caching automático usando React Query
 * @param filters - Filtros para las transacciones
 * @param enabled - Habilitar/deshabilitar la query
 */
export function useTransactions(filters?: TransactionFilters, enabled = true) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionAPI.getAll(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener una transacción específica
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionAPI.getById(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
