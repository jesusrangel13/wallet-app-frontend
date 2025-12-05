import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryAPI, categoryTemplateAPI } from '@/lib/api'
import { useMemo } from 'react'
import type { CategoryTemplate, UserCategoryOverride, CustomCategory, MergedCategory, TransactionType, CreateCategoryForm } from '@/types'

/**
 * Hook para obtener todas las categorías con caching automático
 * Uses the new template-based system internally
 */
export function useCategories(type?: string) {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => categoryAPI.getAll(type),
    staleTime: 15 * 60 * 1000, // 15 minutes - categories are stable
  })
}

/**
 * Hook para obtener categorías templates (sistema nuevo)
 */
export function useTemplateCategories(type?: TransactionType) {
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['categoryTemplates', type],
    queryFn: () => categoryTemplateAPI.getTemplatesHierarchy(),
    staleTime: 30 * 60 * 1000, // 30 minutes - templates rarely change
  })

  // Filter by type if provided
  const filtered = useMemo(() => {
    if (!response) return []
    const templates = response.data.data || []
    if (!type) return templates
    return filterCategoriesByType(templates as CategoryTemplate[], type)
  }, [response, type])

  return {
    templates: filtered,
    isLoading,
    error,
  }
}

/**
 * Hook para obtener categorías personalizadas del usuario
 */
export function useCustomCategories() {
  return useQuery({
    queryKey: ['customCategories'],
    queryFn: async () => {
      const response = await categoryTemplateAPI.getCustomCategories()
      return response.data.data || []
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Hook para obtener todas las categorías fusionadas (templates + overrides + custom)
 * Este es el hook principal a usar en componentes
 */
export function useMergedCategories(type?: TransactionType) {
  // Fetch user's merged categories directly from backend
  const { data: response, isLoading, error, isFetching } = useQuery({
    queryKey: ['userCategories', type],
    queryFn: () => categoryTemplateAPI.getUserCategories(),
    staleTime: 15 * 60 * 1000, // 15 minutes - categories are stable
  })

  // Filter by type if provided
  const filtered = useMemo(() => {
    if (!response) return []
    const categories = response.data?.data || []
    if (!type) return categories
    return filterCategoriesByType(categories as CategoryTemplate[], type)
  }, [response, type])

  return {
    categories: filtered,
    isLoading,
    isFetching,
    error,
  }
}

/**
 * Helper function to filter categories by type
 */
function filterCategoriesByType(categories: CategoryTemplate[], type: TransactionType): CategoryTemplate[] {
  return categories.filter((cat) => {
    if (cat.type !== type) return false
    // Keep parent categories if they have children of the right type
    if (cat.subcategories) {
      cat.subcategories = filterCategoriesByType(cat.subcategories, type)
    }
    return true
  })
}

/**
 * Helper function to merge all category sources into a unified view
 */
function mergeCategories(
  templates: CategoryTemplate[],
  overrides: UserCategoryOverride[],
  customCategories: CustomCategory[],
  type?: TransactionType
): MergedCategory[] {
  const overrideMap = new Map(overrides.map(o => [o.templateId, o]))
  const result: MergedCategory[] = []

  // Process templates with overrides
  templates.forEach((template) => {
    if (type && template.type !== type) return

    const override = overrideMap.get(template.id)
    const merged: MergedCategory = {
      id: template.id,
      name: override?.name || template.name,
      icon: override?.icon || template.icon,
      color: override?.color || template.color,
      type: template.type,
      source: override ? 'OVERRIDE' : 'TEMPLATE',
      templateId: template.id,
      overrideId: override?.id,
      hasOverride: !!override,
      isCustom: false,
      isEditable: !!override,
      parentId: template.parentId || undefined,
      subcategories: template.subcategories
        ? mergeCategories(template.subcategories, overrides, customCategories, type)
        : undefined,
    }
    result.push(merged)
  })

  // Add custom categories
  customCategories.forEach((custom) => {
    if (type && custom.type !== type) return
    if (!custom.isActive) return

    const merged: MergedCategory = {
      id: custom.id,
      name: custom.name,
      icon: custom.icon,
      color: custom.color,
      type: custom.type,
      source: 'CUSTOM',
      customId: custom.id,
      hasOverride: false,
      isCustom: true,
      isEditable: true,
    }
    result.push(merged)
  })

  return result
}

/**
 * Hook para crear una nueva categoría personalizada
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCategoryForm) => {
      const response = await categoryTemplateAPI.createCustom(data)
      return response.data.data
    },
    onMutate: async (newCategory) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['userCategories'] })
      await queryClient.cancelQueries({ queryKey: ['customCategories'] })

      // Snapshot the previous values
      const previousUserCategories = queryClient.getQueryData(['userCategories'])
      const previousCustomCategories = queryClient.getQueryData(['customCategories'])

      // Optimistically add the new category
      queryClient.setQueryData(['customCategories'], (old: any) => {
        if (!old) return old

        const optimisticCategory = {
          ...newCategory,
          id: `temp-${Date.now()}`,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        return [...old, optimisticCategory]
      })

      return { previousUserCategories, previousCustomCategories }
    },
    onError: (err, newCategory, context) => {
      // Rollback on error
      if (context?.previousUserCategories) {
        queryClient.setQueryData(['userCategories'], context.previousUserCategories)
      }
      if (context?.previousCustomCategories) {
        queryClient.setQueryData(['customCategories'], context.previousCustomCategories)
      }
    },
    onSuccess: () => {
      // Invalidate all category queries
      queryClient.invalidateQueries({ queryKey: ['userCategories'] })
      queryClient.invalidateQueries({ queryKey: ['customCategories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/**
 * Hook para actualizar una categoría
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCategoryForm> }) => {
      const response = await categoryTemplateAPI.updateOverride(id, data)
      return response.data.data
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['userCategories'] })
      await queryClient.cancelQueries({ queryKey: ['customCategories'] })

      // Snapshot the previous values
      const previousUserCategories = queryClient.getQueryData(['userCategories'])
      const previousCustomCategories = queryClient.getQueryData(['customCategories'])

      // Optimistically update the category
      queryClient.setQueryData(['customCategories'], (old: any) => {
        if (!old) return old
        return old.map((cat: any) => (cat.id === id ? { ...cat, ...data } : cat))
      })

      return { previousUserCategories, previousCustomCategories }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousUserCategories) {
        queryClient.setQueryData(['userCategories'], context.previousUserCategories)
      }
      if (context?.previousCustomCategories) {
        queryClient.setQueryData(['customCategories'], context.previousCustomCategories)
      }
    },
    onSuccess: () => {
      // Invalidate all category queries
      queryClient.invalidateQueries({ queryKey: ['userCategories'] })
      queryClient.invalidateQueries({ queryKey: ['customCategories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/**
 * Hook para eliminar una categoría
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await categoryTemplateAPI.deleteOverride(id)
      return id
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['userCategories'] })
      await queryClient.cancelQueries({ queryKey: ['customCategories'] })

      // Snapshot the previous values
      const previousUserCategories = queryClient.getQueryData(['userCategories'])
      const previousCustomCategories = queryClient.getQueryData(['customCategories'])

      // Optimistically remove the category
      queryClient.setQueryData(['customCategories'], (old: any) => {
        if (!old) return old
        return old.filter((cat: any) => cat.id !== id)
      })

      return { previousUserCategories, previousCustomCategories }
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousUserCategories) {
        queryClient.setQueryData(['userCategories'], context.previousUserCategories)
      }
      if (context?.previousCustomCategories) {
        queryClient.setQueryData(['customCategories'], context.previousCustomCategories)
      }
    },
    onSuccess: () => {
      // Invalidate all category queries
      queryClient.invalidateQueries({ queryKey: ['userCategories'] })
      queryClient.invalidateQueries({ queryKey: ['customCategories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
