import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { groupAPI } from '@/lib/api'
import type { Group, CreateGroupForm } from '@/types'

/**
 * Hook para obtener todos los grupos con caching automático
 * @param params - Parámetros de paginación opcionales
 */
export function useGroups(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['groups', params],
    queryFn: async () => {
      const response = await groupAPI.getAll(params)
      // El backend devuelve diferentes formatos dependiendo si hay paginación o no
      // Sin paginación: response.data = Group[]
      // Con paginación: response.data = { data: Group[], pagination: {...} }

      // Si no hay params de paginación, el backend devuelve array directo
      if (!params?.page && !params?.limit) {
        // Verificar si ya es un array o tiene estructura paginada
        if (Array.isArray(response.data)) {
          return response.data as Group[]
        }
        // Si tiene estructura paginada, extraer el array
        return (response.data as any).data.data as Group[]
      }

      // Con paginación, devolver toda la respuesta incluyendo metadata
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - groups change less frequently
  })
}

/**
 * Hook para obtener un grupo específico
 */
export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async () => {
      if (!groupId) return null
      const response = await groupAPI.getById(groupId)
      return response.data.data as Group
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para crear un nuevo grupo
 */
export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const response = await groupAPI.create(data)
      return response.data.data as Group
    },
    onMutate: async (newGroup) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['groups'] })

      // Snapshot the previous value
      const previousGroups = queryClient.getQueryData(['groups'])

      // Optimistically update to the new value
      queryClient.setQueryData(['groups'], (old: any) => {
        if (!old) return old

        // Create optimistic group with temporary ID
        const optimisticGroup = {
          ...newGroup,
          id: `temp-${Date.now()}`,
          members: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Handle both array and paginated responses
        if (Array.isArray(old)) {
          return [...old, optimisticGroup]
        }
        return old
      })

      return { previousGroups }
    },
    onError: (err, newGroup, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups)
      }
    },
    onSuccess: () => {
      // Invalidate groups queries
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

/**
 * Hook para actualizar un grupo
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateGroupForm> }) => {
      const response = await groupAPI.update(id, data)
      return response.data.data as Group
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['groups'] })
      await queryClient.cancelQueries({ queryKey: ['groups', id] })

      // Snapshot the previous values
      const previousGroups = queryClient.getQueryData(['groups'])
      const previousGroup = queryClient.getQueryData(['groups', id])

      // Optimistically update the group in the list
      queryClient.setQueryData(['groups'], (old: any) => {
        if (!old) return old

        // Handle array response
        if (Array.isArray(old)) {
          return old.map((g: Group) => (g.id === id ? { ...g, ...data } : g))
        }
        return old
      })

      // Optimistically update the single group cache
      queryClient.setQueryData(['groups', id], (old: any) => {
        if (!old) return old
        return { ...old, ...data }
      })

      return { previousGroups, previousGroup }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups)
      }
      if (context?.previousGroup) {
        queryClient.setQueryData(['groups', id], context.previousGroup)
      }
    },
    onSuccess: (updatedGroup) => {
      // Update the group in the cache
      queryClient.setQueryData(['groups', updatedGroup.id], updatedGroup)
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
    },
  })
}

/**
 * Hook para eliminar un grupo
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await groupAPI.delete(id)
      return id
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['groups'] })

      // Snapshot the previous value
      const previousGroups = queryClient.getQueryData(['groups'])

      // Optimistically remove the group
      queryClient.setQueryData(['groups'], (old: any) => {
        if (!old) return old

        // Handle array response
        if (Array.isArray(old)) {
          return old.filter((g: Group) => g.id !== id)
        }
        return old
      })

      return { previousGroups }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

/**
 * Hook para liquidar un balance
 */
export function useSettleBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ groupId, otherUserId, accountId }: { groupId: string; otherUserId: string; accountId?: string }) => {
      const response = await groupAPI.settleAllBalance(groupId, otherUserId, accountId)
      return response.data
    },
    onMutate: async ({ groupId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['groups'] })
      await queryClient.cancelQueries({ queryKey: ['group-balances'] })

      // Snapshot the previous values
      const previousGroups = queryClient.getQueryData(['groups'])
      const previousBalances = queryClient.getQueryData(['group-balances'])

      // Note: We don't optimistically update balances here because the calculation
      // is complex and done on the server. We just show a loading state.

      return { previousGroups, previousBalances }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups)
      }
      if (context?.previousBalances) {
        queryClient.setQueryData(['group-balances'], context.previousBalances)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}
