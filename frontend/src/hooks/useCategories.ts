import { useQuery } from '@tanstack/react-query'
import { categoryAPI } from '@/lib/api'

/**
 * Hook para obtener todas las categorías con caching automático
 */
export function useCategories(type?: string) {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => categoryAPI.getAll(type),
    staleTime: 15 * 60 * 1000, // 15 minutes - categories are stable
  })
}

/**
 * Hook para obtener una categoría específica
 */
export function useCategory(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => categoryAPI.getById(id),
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}
