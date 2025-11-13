import { useQuery, useQueries } from '@tanstack/react-query'
import { categoryAPI, categoryTemplateAPI } from '@/lib/api'
import { useMemo } from 'react'
import type { CategoryTemplate, UserCategoryOverride, CustomCategory, MergedCategory, TransactionType } from '@/types'

/**
 * Hook para obtener todas las categorías con caching automático (Legacy)
 */
export function useCategories(type?: string) {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => categoryAPI.getAll(type),
    staleTime: 15 * 60 * 1000, // 15 minutes - categories are stable
  })
}

/**
 * Hook para obtener una categoría específica (Legacy)
 */
export function useCategory(id: string) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => categoryAPI.getById(id),
    staleTime: 15 * 60 * 1000, // 15 minutes
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
 * Hook para obtener overrides de usuario
 */
export function useUserCategoryOverrides() {
  return useQuery({
    queryKey: ['userCategoryOverrides'],
    queryFn: async () => {
      // Get all overrides - we'll create an endpoint that returns all
      const response = await categoryTemplateAPI.getOverride('')
      return response.data
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
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
  // Fetch all three sources in parallel
  const results = useQueries({
    queries: [
      {
        queryKey: ['categoryTemplates', type],
        queryFn: () => categoryTemplateAPI.getTemplatesHierarchy(),
        staleTime: 30 * 60 * 1000,
      },
      {
        queryKey: ['userCategoryOverrides'],
        queryFn: async () => {
          const response = await categoryTemplateAPI.getCustomCategories() // Placeholder
          return response.data
        },
        staleTime: 15 * 60 * 1000,
      },
      {
        queryKey: ['customCategories'],
        queryFn: async () => {
          const response = await categoryTemplateAPI.getCustomCategories()
          return response.data
        },
        staleTime: 15 * 60 * 1000,
      },
    ],
  })

  const isLoading = results.some(r => r.isLoading)
  const error = results.find(r => r.error)?.error

  // Merge and transform data
  const merged = useMemo(() => {
    const templatesResponse = results[0].data
    const overridesResponse = results[1].data
    const customResponse = results[2].data

    const templates = templatesResponse?.data?.data || []
    const overrides = overridesResponse?.data || []
    const customCategories = customResponse?.data || []

    return mergeCategories(templates as CategoryTemplate[], overrides, customCategories, type)
  }, [results, type])

  return {
    categories: merged,
    isLoading,
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
