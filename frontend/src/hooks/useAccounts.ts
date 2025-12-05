import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountAPI } from '@/lib/api'
import type { Account, CreateAccountForm } from '@/types'

/**
 * Hook para obtener todas las cuentas con caching automático
 * @param params - Parámetros de paginación opcionales
 */
export function useAccounts(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['accounts', params],
    queryFn: async () => {
      const response = await accountAPI.getAll(params)
      // Transformar la respuesta para mantener compatibilidad con código existente
      // Si no se especifican params de paginación, obtener todas las cuentas
      if (!params?.page && !params?.limit) {
        // Sin paginación, devolver directamente el array de data
        return {
          ...response,
          data: response.data.data.data, // Extraer el array de cuentas
        }
      }
      // Con paginación, devolver la estructura completa
      return response
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - accounts don't change often
  })
}

/**
 * Hook para obtener una cuenta específica
 */
export function useAccount(id: string) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => accountAPI.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para obtener el balance total
 */
export function useTotalBalance() {
  return useQuery({
    queryKey: ['total-balance'],
    queryFn: () => accountAPI.getTotalBalance(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook para crear una nueva cuenta con optimistic update
 */
export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAccountForm) => {
      const response = await accountAPI.create(data)
      return response.data.data as Account
    },
    onMutate: async (newAccount) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['accounts'] })

      // Snapshot the previous value
      const previousAccounts = queryClient.getQueryData(['accounts'])

      // Optimistically update to the new value
      queryClient.setQueryData(['accounts'], (old: any) => {
        if (!old) return old

        // Create optimistic account with temporary ID
        const optimisticAccount = {
          ...newAccount,
          id: `temp-${Date.now()}`,
          balance: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Add to the accounts list
        if (old.data?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              data: [...old.data.data, optimisticAccount],
            },
          }
        }
        return old
      })

      return { previousAccounts }
    },
    onError: (err, newAccount, context) => {
      // Rollback on error
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts'], context.previousAccounts)
      }
    },
    onSuccess: (newAccount) => {
      // Invalidate accounts and balance queries to refetch
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['total-balance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

/**
 * Hook para actualizar una cuenta con optimistic update
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateAccountForm> }) => {
      const response = await accountAPI.update(id, data)
      return response.data.data as Account
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['accounts'] })
      await queryClient.cancelQueries({ queryKey: ['account', id] })

      // Snapshot the previous values
      const previousAccounts = queryClient.getQueryData(['accounts'])
      const previousAccount = queryClient.getQueryData(['account', id])

      // Optimistically update the account in the list
      queryClient.setQueryData(['accounts'], (old: any) => {
        if (!old?.data?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((a: Account) =>
              a.id === id ? { ...a, ...data } : a
            ),
          },
        }
      })

      // Optimistically update the single account cache
      queryClient.setQueryData(['account', id], (old: any) => {
        if (!old) return old
        return { ...old, ...data }
      })

      return { previousAccounts, previousAccount }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts'], context.previousAccounts)
      }
      if (context?.previousAccount) {
        queryClient.setQueryData(['account', id], context.previousAccount)
      }
    },
    onSuccess: (updatedAccount) => {
      // Update the account in the cache
      queryClient.setQueryData(['account', updatedAccount.id], updatedAccount)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['total-balance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

/**
 * Hook para eliminar una cuenta
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await accountAPI.delete(id)
      return id
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['accounts'] })

      // Snapshot the previous value
      const previousAccounts = queryClient.getQueryData(['accounts'])

      // Optimistically remove the account
      queryClient.setQueryData(['accounts'], (old: any) => {
        if (!old?.data?.data) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.filter((a: Account) => a.id !== id),
          },
        }
      })

      return { previousAccounts }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousAccounts) {
        queryClient.setQueryData(['accounts'], context.previousAccounts)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['total-balance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}
