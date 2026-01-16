import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { budgetAPI } from '@/lib/api'
import type { Budget, BudgetVsActual, CreateBudgetForm } from '@/types'

/**
 * Hook para obtener todos los budgets con caching automático
 * @param params - Parámetros opcionales (año, paginación)
 */
export function useBudgets(params?: { year?: number; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['budgets', params],
    queryFn: async () => {
      const response = await budgetAPI.getAll(params)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener un budget específico
 */
export function useBudget(id: string | undefined) {
  return useQuery({
    queryKey: ['budget', id],
    queryFn: async () => {
      if (!id) return null
      const response = await budgetAPI.getById(id)
      return response.data.data as Budget
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para obtener budget vs actual del mes
 */
export function useBudgetVsActual(month: number, year: number) {
  return useQuery({
    queryKey: ['budget-vs-actual', month, year],
    queryFn: async () => {
      const response = await budgetAPI.getVsActual(month, year)
      return response.data.data as BudgetVsActual
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - budget comparisons should be fresh
  })
}

/**
 * Hook para obtener budget vs actual del mes actual
 */
export function useCurrentBudget() {
  return useQuery({
    queryKey: ['budget-current'],
    queryFn: async () => {
      const response = await budgetAPI.getCurrent()
      return response.data.data as BudgetVsActual
    },
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook para crear un nuevo budget con optimistic update
 */
export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBudgetForm) => {
      const response = await budgetAPI.create(data)
      return response.data.data as Budget
    },
    onMutate: async (newBudget) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['budgets'] })

      // Snapshot the previous value
      const previousBudgets = queryClient.getQueryData(['budgets'])

      // Optimistically update to the new value
      queryClient.setQueryData(['budgets'], (old: any) => {
        if (!old) return old

        // Create optimistic budget with temporary ID
        const optimisticBudget: Budget = {
          ...newBudget,
          id: `temp-${Date.now()}`,
          userId: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Handle paginated response structure
        if (old.data?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              data: [optimisticBudget, ...old.data.data],
            },
          }
        }
        return old
      })

      return { previousBudgets }
    },
    onError: (err, newBudget, context) => {
      // Rollback on error
      if (context?.previousBudgets) {
        queryClient.setQueryData(['budgets'], context.previousBudgets)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget-vs-actual'] })
      queryClient.invalidateQueries({ queryKey: ['budget-current'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

/**
 * Hook para actualizar un budget con optimistic update
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const response = await budgetAPI.update(id, amount)
      return response.data.data as Budget
    },
    onMutate: async ({ id, amount }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['budgets'] })
      await queryClient.cancelQueries({ queryKey: ['budget', id] })

      // Snapshot the previous values
      const previousBudgets = queryClient.getQueryData(['budgets'])
      const previousBudget = queryClient.getQueryData(['budget', id])

      // Optimistically update the budget in the list
      queryClient.setQueryData(['budgets'], (old: any) => {
        if (!old?.data?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((b: Budget) =>
              b.id === id ? { ...b, amount } : b
            ),
          },
        }
      })

      // Optimistically update the single budget cache
      queryClient.setQueryData(['budget', id], (old: any) => {
        if (!old) return old
        return { ...old, amount }
      })

      return { previousBudgets, previousBudget }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousBudgets) {
        queryClient.setQueryData(['budgets'], context.previousBudgets)
      }
      if (context?.previousBudget) {
        queryClient.setQueryData(['budget', id], context.previousBudget)
      }
    },
    onSuccess: (updatedBudget) => {
      // Update the budget in the cache
      queryClient.setQueryData(['budget', updatedBudget.id], updatedBudget)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget-vs-actual'] })
      queryClient.invalidateQueries({ queryKey: ['budget-current'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

/**
 * Hook para eliminar un budget con optimistic update
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await budgetAPI.delete(id)
      return id
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['budgets'] })

      // Snapshot the previous value
      const previousBudgets = queryClient.getQueryData(['budgets'])

      // Optimistically remove the budget
      queryClient.setQueryData(['budgets'], (old: any) => {
        if (!old?.data?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.filter((b: Budget) => b.id !== id),
          },
        }
      })

      return { previousBudgets }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousBudgets) {
        queryClient.setQueryData(['budgets'], context.previousBudgets)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget-vs-actual'] })
      queryClient.invalidateQueries({ queryKey: ['budget-current'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}
