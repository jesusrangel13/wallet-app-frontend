import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tagAPI } from '@/lib/api'
import type { Tag, CreateTagForm } from '@/types'

/**
 * Hook para obtener todos los tags con caching automático
 * @param params - Parámetros de paginación opcionales
 */
export function useTags(params?: { page?: number; limit?: number }) {
  return useQuery<Tag[]>({
    queryKey: ['tags', params],
    queryFn: async () => {
      // If no params provided, request a large limit to get all tags
      const requestParams = params || { limit: 500 }
      const response = await tagAPI.getAll(requestParams)
      // Siempre devolver solo el array de tags con fallback
      return response.data.data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - tags are relatively stable
  })
}

/**
 * Hook para crear un nuevo tag
 */
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTagForm) => {
      const response = await tagAPI.create(data)
      return response.data.data as Tag
    },
    onSuccess: (newTag) => {
      // Invalidate all tags queries to refetch with new tag
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
    onError: () => {
      // On error, invalidate to refetch
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

/**
 * Hook para actualizar un tag
 */
export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTagForm> }) => {
      const response = await tagAPI.update(id, data)
      return response.data.data as Tag
    },
    onSuccess: () => {
      // Invalidate all tags queries to refetch with updated tag
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

/**
 * Hook para eliminar un tag
 */
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await tagAPI.delete(id)
      return id
    },
    onSuccess: () => {
      // Invalidate all tags queries to refetch after delete
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
