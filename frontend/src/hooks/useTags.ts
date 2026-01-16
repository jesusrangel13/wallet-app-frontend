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
 * Hook para crear un nuevo tag con optimistic update
 */
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTagForm) => {
      const response = await tagAPI.create(data)
      return response.data.data as Tag
    },
    onMutate: async (newTag) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tags'] })

      // Snapshot the previous value
      const previousTags = queryClient.getQueryData(['tags'])

      // Optimistically add the new tag
      queryClient.setQueryData(['tags'], (old: any) => {
        if (!old) return old

        const optimisticTag: Tag = {
          ...newTag,
          id: `temp-${Date.now()}`,
          userId: 'current-user',
          createdAt: new Date().toISOString(),
        }

        if (Array.isArray(old)) {
          return [optimisticTag, ...old]
        }
        return old
      })

      return { previousTags }
    },
    onError: (err, newTag, context) => {
      // Rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData(['tags'], context.previousTags)
      }
    },
    onSuccess: () => {
      // Invalidate to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

/**
 * Hook para actualizar un tag con optimistic update
 */
export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTagForm> }) => {
      const response = await tagAPI.update(id, data)
      return response.data.data as Tag
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tags'] })

      // Snapshot the previous value
      const previousTags = queryClient.getQueryData(['tags'])

      // Optimistically update the tag
      queryClient.setQueryData(['tags'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.map((tag: Tag) => (tag.id === id ? { ...tag, ...data } : tag))
      })

      return { previousTags }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData(['tags'], context.previousTags)
      }
    },
    onSuccess: () => {
      // Invalidate to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

/**
 * Hook para eliminar un tag con optimistic update
 */
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await tagAPI.delete(id)
      return id
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tags'] })

      // Snapshot the previous value
      const previousTags = queryClient.getQueryData(['tags'])

      // Optimistically remove the tag
      queryClient.setQueryData(['tags'], (old: any) => {
        if (!old || !Array.isArray(old)) return old
        return old.filter((tag: Tag) => tag.id !== id)
      })

      return { previousTags }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData(['tags'], context.previousTags)
      }
    },
    onSuccess: () => {
      // Invalidate to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}
