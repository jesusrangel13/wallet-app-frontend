import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tagAPI } from '@/lib/api'
import type { Tag, CreateTagForm } from '@/types'

/**
 * Hook para obtener todos los tags con caching automático
 */
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await tagAPI.getAll()
      return response.data.data as Tag[]
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
      // Optimistically update the cache
      queryClient.setQueryData<Tag[]>(['tags'], (oldTags = []) => {
        return [...oldTags, newTag]
      })
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
    onSuccess: (updatedTag) => {
      // Update the tag in the cache
      queryClient.setQueryData<Tag[]>(['tags'], (oldTags = []) => {
        return oldTags.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag))
      })
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
    onSuccess: (deletedId) => {
      // Remove the tag from the cache
      queryClient.setQueryData<Tag[]>(['tags'], (oldTags = []) => {
        return oldTags.filter((tag) => tag.id !== deletedId)
      })
    },
  })
}
