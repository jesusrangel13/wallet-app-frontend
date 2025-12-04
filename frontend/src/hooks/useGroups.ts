import { useQuery } from '@tanstack/react-query'
import { groupAPI } from '@/lib/api'
import type { Group } from '@/types'

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
