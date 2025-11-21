import { useQuery } from '@tanstack/react-query'
import { groupAPI } from '@/lib/api'
import type { Group } from '@/types'

/**
 * Hook para obtener todos los grupos con caching automático
 */
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await groupAPI.getAll()
      return response.data.data as Group[]
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
