import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionAPI } from '@/lib/api'
import type { Transaction, CreateTransactionForm } from '@/types'

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

/**
 * Hook para crear una nueva transacción
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTransactionForm) => {
      const response = await transactionAPI.create(data)
      return response.data.data as Transaction
    },
    onMutate: async (newTransaction) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['transactions'] })

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData(['transactions'])

      // Optimistically update to the new value
      queryClient.setQueryData(['transactions'], (old: any) => {
        if (!old) return old

        // Create optimistic transaction with temporary ID
        const optimisticTransaction = {
          ...newTransaction,
          id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Add to the beginning of the list
        if (old.data?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              data: [optimisticTransaction, ...old.data.data],
            },
          }
        }
        return old
      })

      // Return context with previous value for rollback
      return { previousTransactions }
    },
    onError: (err, newTransaction, context) => {
      // Rollback to previous value on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['total-balance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['balance-history'] })
    },
  })
}

/**
 * Hook para actualizar una transacción
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTransactionForm> }) => {
      const response = await transactionAPI.update(id, data)
      return response.data.data as Transaction
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['transactions'] })
      await queryClient.cancelQueries({ queryKey: ['transaction', id] })

      // Snapshot the previous values
      const previousTransactions = queryClient.getQueryData(['transactions'])
      const previousTransaction = queryClient.getQueryData(['transaction', id])

      // Optimistically update the transaction in the list
      queryClient.setQueryData(['transactions'], (old: any) => {
        if (!old?.data?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((t: Transaction) =>
              t.id === id ? { ...t, ...data } : t
            ),
          },
        }
      })

      // Optimistically update the single transaction cache
      queryClient.setQueryData(['transaction', id], (old: any) => {
        if (!old) return old
        return { ...old, ...data }
      })

      return { previousTransactions, previousTransaction }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions)
      }
      if (context?.previousTransaction) {
        queryClient.setQueryData(['transaction', id], context.previousTransaction)
      }
    },
    onSuccess: (updatedTransaction) => {
      // Update the transaction in the cache with server response
      queryClient.setQueryData(['transaction', updatedTransaction.id], updatedTransaction)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['total-balance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['balance-history'] })
    },
  })
}

/**
 * Hook para eliminar una transacción
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await transactionAPI.delete(id)
      return id
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['transactions'] })

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData(['transactions'])

      // Optimistically remove the transaction
      queryClient.setQueryData(['transactions'], (old: any) => {
        if (!old?.data?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.filter((t: Transaction) => t.id !== id),
          },
        }
      })

      return { previousTransactions }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['total-balance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['balance-history'] })
    },
  })
}

/**
 * Hook para eliminar múltiples transacciones
 */
export function useBulkDeleteTransactions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await transactionAPI.bulkDelete(ids)
      return ids
    },
    onMutate: async (ids) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['transactions'] })

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData(['transactions'])

      // Optimistically remove the transactions
      queryClient.setQueryData(['transactions'], (old: any) => {
        if (!old?.data?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.filter((t: Transaction) => !ids.includes(t.id)),
          },
        }
      })

      return { previousTransactions }
    },
    onError: (err, ids, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions'], context.previousTransactions)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['total-balance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['balance-history'] })
    },
  })
}

/**
 * Hook para obtener transacciones recientes
 * @param limit - Número de transacciones a obtener
 */
export function useRecentTransactions(limit: number = 5) {
  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: () => transactionAPI.getRecent(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes - recent transactions should be fresh
  })
}

/**
 * Hook para obtener estadísticas de transacciones por mes
 * @param month - Mes (1-12)
 * @param year - Año
 */
export function useTransactionStats(month: number, year: number) {
  return useQuery({
    queryKey: ['transaction-stats', month, year],
    queryFn: () => transactionAPI.getStats(month, year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
