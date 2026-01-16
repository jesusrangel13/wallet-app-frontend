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
        console.log("🐛 [useGroups] Raw Response:", JSON.stringify(response?.data, null, 2));

        // Verificar si ya es un array o tiene estructura paginada
        if (Array.isArray(response?.data)) {
          console.log("🐛 [useGroups] Is Array directly");
          return response.data as Group[]
        }
        // Si tiene estructura paginada o envuelta en { data: ... }, extraer el array
        // La respuesta de axios esta en response.data, y nuestra API envuelve en { data: ... }
        const extracted = (response?.data as any)?.data as Group[];
        console.log("🐛 [useGroups] Extracted Data type:", Array.isArray(extracted) ? "Array" : typeof extracted);
        console.log("🐛 [useGroups] Extracted Count:", Array.isArray(extracted) ? extracted.length : "N/A");

        return extracted || []
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
 * Hook para liquidar un balance con optimistic update
 */
export function useSettleBalance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ groupId, otherUserId, accountId }: { groupId: string; otherUserId: string; accountId?: string }) => {
      const response = await groupAPI.settleAllBalance(groupId, otherUserId, accountId)
      return response.data
    },
    onMutate: async ({ groupId, otherUserId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['groups'] })
      await queryClient.cancelQueries({ queryKey: ['group-balances'] })
      await queryClient.cancelQueries({ queryKey: ['shared-expenses'] })

      // Snapshot the previous values
      const previousGroups = queryClient.getQueryData(['groups'])
      const previousBalances = queryClient.getQueryData(['group-balances'])
      const previousSharedExpenses = queryClient.getQueryData(['shared-expenses'])

      // Optimistically update: mark expenses as paid for this user
      // This provides instant visual feedback while server processes the settlement
      queryClient.setQueryData(['shared-expenses'], (old: any) => {
        if (!old || !Array.isArray(old)) return old

        return old.map((expense: any) => {
          // Only update expenses for this group where the other user is involved
          if (expense.groupId === groupId) {
            const updatedParticipants = expense.participants?.map((p: any) => {
              // Mark as paid if this is the participant we're settling with
              if (p.userId === otherUserId && !p.isPaid) {
                return { ...p, isPaid: true, paidDate: new Date().toISOString() }
              }
              return p
            })
            return { ...expense, participants: updatedParticipants }
          }
          return expense
        })
      })

      return { previousGroups, previousBalances, previousSharedExpenses }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups)
      }
      if (context?.previousBalances) {
        queryClient.setQueryData(['group-balances'], context.previousBalances)
      }
      if (context?.previousSharedExpenses) {
        queryClient.setQueryData(['shared-expenses'], context.previousSharedExpenses)
      }
    },
    onSuccess: () => {
      // Invalidate all related queries to get fresh server data
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })
}

/**
 * Hook para agregar un miembro a un grupo con optimistic update
 */
export function useAddMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ groupId, email }: { groupId: string; email: string }) => {
      const response = await groupAPI.addMember(groupId, email)
      return response.data
    },
    onMutate: async ({ groupId, email }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['group', groupId] })
      await queryClient.cancelQueries({ queryKey: ['groups'] })

      // Snapshot the previous values
      const previousGroup = queryClient.getQueryData(['group', groupId])
      const previousGroups = queryClient.getQueryData(['groups'])

      // Optimistically add the member (we'll get real data after success)
      // Note: We don't know the new member's full details yet, so just invalidate

      return { previousGroup, previousGroups }
    },
    onError: (err, { groupId }, context) => {
      // Rollback on error
      if (context?.previousGroup) {
        queryClient.setQueryData(['group', groupId], context.previousGroup)
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups)
      }
    },
    onSuccess: (response, { groupId }) => {
      // Invalidate to get fresh data with the new member
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

/**
 * Hook para remover un miembro de un grupo con optimistic update
 */
export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ groupId, memberId }: { groupId: string; memberId: string }) => {
      const response = await groupAPI.removeMember(groupId, memberId)
      return response.data
    },
    onMutate: async ({ groupId, memberId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['group', groupId] })
      await queryClient.cancelQueries({ queryKey: ['groups'] })

      // Snapshot the previous values
      const previousGroup = queryClient.getQueryData(['group', groupId])
      const previousGroups = queryClient.getQueryData(['groups'])

      // Optimistically remove the member from the group
      queryClient.setQueryData(['group', groupId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            members: old.data.members?.filter((m: any) => m.id !== memberId),
          },
        }
      })

      return { previousGroup, previousGroups }
    },
    onError: (err, { groupId }, context) => {
      // Rollback on error
      if (context?.previousGroup) {
        queryClient.setQueryData(['group', groupId], context.previousGroup)
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups)
      }
    },
    onSuccess: (response, { groupId }) => {
      // Invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
    },
  })
}

/**
 * Hook para salir de un grupo con optimistic update
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await groupAPI.leave(groupId)
      return response.data
    },
    onMutate: async (groupId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['groups'] })

      // Snapshot the previous value
      const previousGroups = queryClient.getQueryData(['groups'])

      // Optimistically remove the group from the list
      queryClient.setQueryData(['groups'], (old: any) => {
        if (!old) return old
        if (Array.isArray(old)) {
          return old.filter((group: any) => group.id !== groupId)
        }
        if (old.data?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              data: old.data.data.filter((group: any) => group.id !== groupId),
            },
          }
        }
        return old
      })

      return { previousGroups }
    },
    onError: (err, groupId, context) => {
      // Rollback on error
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups)
      }
    },
    onSuccess: () => {
      // Invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-balances'] })
      queryClient.invalidateQueries({ queryKey: ['shared-expenses'] })
    },
  })
}

/**
 * Hook para actualizar el split por defecto de un grupo con optimistic update
 */
export function useUpdateDefaultSplit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ groupId, defaultSplit }: { groupId: string; defaultSplit: any }) => {
      const response = await groupAPI.updateDefaultSplit(groupId, defaultSplit)
      return response.data
    },
    onMutate: async ({ groupId, defaultSplit }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['group', groupId] })
      await queryClient.cancelQueries({ queryKey: ['groups'] })

      // Snapshot the previous values
      const previousGroup = queryClient.getQueryData(['group', groupId])
      const previousGroups = queryClient.getQueryData(['groups'])

      // Optimistically update the default split
      queryClient.setQueryData(['group', groupId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            defaultSplit,
          },
        }
      })

      return { previousGroup, previousGroups }
    },
    onError: (err, { groupId }, context) => {
      // Rollback on error
      if (context?.previousGroup) {
        queryClient.setQueryData(['group', groupId], context.previousGroup)
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups)
      }
    },
    onSuccess: (response, { groupId }) => {
      // Invalidate to get fresh data
      queryClient.invalidateQueries({ queryKey: ['group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}
