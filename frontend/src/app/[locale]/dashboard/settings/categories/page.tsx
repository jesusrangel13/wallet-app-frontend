'use client'

import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { TransactionType } from '@/types'
import { useMergedCategories } from '@/hooks/useCategories'
import { categoryTemplateAPI } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ColorPicker } from '@/components/ui/ColorPicker'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { Trash2, Edit2, Plus, Sparkles, ChevronDown, Loader2 } from 'lucide-react'
import { LoadingSpinner, SkeletonCard, LoadingMessages } from '@/components/ui/Loading'

const EMOJIS = [
  '🍽️', '🚗', '🛒', '🎮', '🏠', '💊', '✈️', '📚', '👔', '💰',
  '🍔', '🚕', '🛍️', '🎬', '🏋️', '💅', '🎨', '📱', '⚡', '🔧',
  '💼', '💵', '🎁', '📈', '💳', '🏆', '💎', '🎯', '📊', '💸'
]

interface CategoryFormData {
  name: string
  icon: string
  color: string
  type: TransactionType
  parentId?: string | null
}

interface CategoryItem {
  id: string
  name: string
  icon?: string
  color?: string
  type: TransactionType
  isCustom?: boolean
  source?: string
  subcategories?: CategoryItem[]
}

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const { categories: allCategories, isLoading, isFetching } = useMergedCategories()

  const [selectedType, setSelectedType] = useState<TransactionType>('EXPENSE')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    icon: EMOJIS[0],
    color: '#EF4444',
    type: 'EXPENSE',
    parentId: null,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) =>
      categoryTemplateAPI.createCustom({
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
        parentId: data.parentId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCategories'] })
      queryClient.invalidateQueries({ queryKey: ['customCategories'] })
      toast.success('Categoría creada exitosamente')
      closeModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al crear la categoría')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; name: string; icon: string; color: string }) =>
      categoryTemplateAPI.updateOverride(data.id, {
        name: data.name,
        icon: data.icon,
        color: data.color,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCategories'] })
      queryClient.invalidateQueries({ queryKey: ['customCategories'] })
      toast.success('Categoría actualizada exitosamente')
      closeModal()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al actualizar la categoría')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryTemplateAPI.deleteOverride(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCategories'] })
      queryClient.invalidateQueries({ queryKey: ['customCategories'] })
      toast.success('Categoría eliminada exitosamente')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Error al eliminar la categoría')
    },
  })

  // Filter categories by type - merged list (templates and custom)
  const filteredCategories = useMemo(() => {
    return allCategories
      .filter(cat => cat.type === selectedType)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allCategories, selectedType])

  // Helper to count total subcategories recursively
  const countSubcategories = (category: CategoryItem): number => {
    let count = category.subcategories?.length || 0
    category.subcategories?.forEach(sub => {
      count += countSubcategories(sub)
    })
    return count
  }

  // Helper to find a category by ID in the entire hierarchy
  const findCategoryById = (categories: CategoryItem[], id: string): CategoryItem | null => {
    for (const cat of categories) {
      if (cat.id === id) return cat
      if (cat.subcategories) {
        const found = findCategoryById(cat.subcategories, id)
        if (found) return found
      }
    }
    return null
  }

  // Toggle expand/collapse for a category
  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const openNewCategoryModal = (parentId?: string | null) => {
    setEditingCategory(null)
    setSelectedParentId(parentId || null)
    setFormData({
      name: '',
      icon: EMOJIS[0],
      color: '#EF4444',
      type: selectedType,
      parentId: parentId || null,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (category: CategoryItem) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      icon: category.icon || '📦',
      color: category.color || '#EF4444',
      type: category.type,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setSelectedParentId(null)
    setFormData({
      name: '',
      icon: EMOJIS[0],
      color: '#EF4444',
      type: selectedType,
      parentId: null,
    })
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    if (editingCategory) {
      updateMutation.mutate({
        id: editingCategory.id,
        name: formData.name,
        icon: formData.icon,
        color: formData.color,
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (categoryId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      deleteMutation.mutate(categoryId)
    }
  }

  // Render subcategories recursively
  const renderSubcategories = (subcategories: CategoryItem[] | undefined, parentId: string, level: number = 1) => {
    if (!subcategories || subcategories.length === 0) return null

    return (
      <div className="ml-4 sm:ml-6 space-y-2 border-l-2 border-gray-200 pl-3 sm:pl-4">
        {subcategories.map((subCat) => {
          const isExpanded = expandedCategories.has(subCat.id)
          const hasSubcategories = (subCat.subcategories?.length || 0) > 0

          return (
            <div key={subCat.id} className="space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
                {/* Icon + Name row */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {hasSubcategories && (
                    <button
                      onClick={() => toggleExpanded(subCat.id)}
                      className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          isExpanded ? 'rotate-0' : '-rotate-90'
                        }`}
                      />
                    </button>
                  )}
                  {!hasSubcategories && <div className="w-6 flex-shrink-0" />}

                  <span className="text-xl sm:text-2xl flex-shrink-0">{subCat.icon || '📁'}</span>
                  <span className="text-sm font-medium text-gray-700 truncate">{subCat.name}</span>
                </div>

                {/* Action buttons - responsive */}
                <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                  {subCat.isCustom ? (
                    <>
                      <button
                        onClick={() => openEditModal(subCat)}
                        disabled={isSubmitting}
                        className="p-1.5 sm:px-2 sm:py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition disabled:opacity-50"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(subCat.id)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 sm:px-2 sm:py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition disabled:opacity-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleDelete(subCat.id)}
                      disabled={deleteMutation.isPending}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition disabled:opacity-50 whitespace-nowrap"
                      title="Ocultar subcategoría"
                    >
                      <span className="hidden sm:inline">Ocultar</span>
                      <span className="sm:hidden">👁️</span>
                    </button>
                  )}
                </div>
              </div>

              {hasSubcategories && isExpanded && (
                renderSubcategories(subCat.subcategories, subCat.id, level + 1)
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Mis Categorías</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Categorías</h1>
        <p className="text-gray-600 mt-1">
          Crea y personaliza tus categorías de gastos e ingresos
        </p>
      </div>

      {/* Type Filter */}
      <div className="flex gap-3">
        {(['EXPENSE', 'INCOME'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedType === type
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'EXPENSE' ? '💸 Gastos' : '💰 Ingresos'}
          </button>
        ))}
      </div>

      {/* Add Custom Category Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => openNewCategoryModal()}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      {/* Categories Section - Unified List */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📂 Todas mis Categorías
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Aquí están tus categorías por defecto y personalizadas. Haz clic en el icono de flecha para expandir las subcategorías.
          </p>
        </div>

        {filteredCategories.length > 0 ? (
          <Card className="bg-white relative">
            {isFetching && !isLoading && (
              <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-gray-500">
                <LoadingSpinner size="sm" />
                <span>{LoadingMessages.updating}</span>
              </div>
            )}
            <CardContent className="p-6">
              <div className="space-y-3">
                {filteredCategories.map((category) => {
                  const isExpanded = expandedCategories.has(category.id)
                  const hasSubcategories = (category.subcategories?.length || 0) > 0
                  const subCatCount = countSubcategories(category)

                  return (
                    <div key={category.id} className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 px-3 rounded-lg hover:bg-gray-50 transition">
                        {/* Top row: Chevron + Icon + Name + Subcategory count + Color */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {hasSubcategories && (
                            <button
                              onClick={() => toggleExpanded(category.id)}
                              className="p-1 hover:bg-gray-200 rounded transition flex-shrink-0"
                            >
                              <ChevronDown
                                className={`w-5 h-5 transition-transform text-gray-600 ${
                                  isExpanded ? 'rotate-0' : '-rotate-90'
                                }`}
                              />
                            </button>
                          )}
                          {!hasSubcategories && <div className="w-7 flex-shrink-0" />}

                          <span className="text-2xl sm:text-3xl flex-shrink-0">{category.icon || '📁'}</span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 truncate">{category.name}</h3>
                              {hasSubcategories && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                                  {subCatCount} {subCatCount === 1 ? 'subcat' : 'subcats'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 hidden sm:block"
                            style={{ backgroundColor: category.color || '#FF6B6B' }}
                          />
                        </div>

                        {/* Action buttons - responsive */}
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto sm:ml-0">
                          {/* Add subcategory button */}
                          <button
                            onClick={() => {
                              openNewCategoryModal(category.id)
                            }}
                            disabled={isSubmitting}
                            className="p-2 sm:px-3 sm:py-1 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition disabled:opacity-50"
                            title="Agregar subcategoría"
                          >
                            <Plus className="w-4 h-4 sm:w-3 sm:h-3" />
                          </button>
                          {category.isCustom ? (
                            <>
                              <button
                                onClick={() => openEditModal(category)}
                                disabled={isSubmitting}
                                className="p-2 sm:px-3 sm:py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition disabled:opacity-50"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4 sm:w-3 sm:h-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(category.id)}
                                disabled={deleteMutation.isPending}
                                className="p-2 sm:px-3 sm:py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition disabled:opacity-50"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4 sm:w-3 sm:h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDelete(category.id)}
                              disabled={deleteMutation.isPending}
                              className="px-2 py-1 sm:px-3 text-xs sm:text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition disabled:opacity-50 whitespace-nowrap"
                              title="Ocultar categoría"
                            >
                              <span className="hidden sm:inline">Ocultar</span>
                              <span className="sm:hidden">👁️</span>
                            </button>
                          )}
                          <div
                            className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0 sm:hidden"
                            style={{ backgroundColor: category.color || '#FF6B6B' }}
                          />
                        </div>
                      </div>

                      {hasSubcategories && isExpanded && (
                        renderSubcategories(category.subcategories, category.id)
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-1">No hay categorías para este tipo</p>
            <p className="text-sm mb-4">
              Crea tu primera categoría personalizada para organizarte mejor
            </p>
            <Button
              onClick={() => openNewCategoryModal()}
              className="bg-green-600 hover:bg-green-700 text-white mx-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Categoría
            </Button>
          </div>
        )}
      </div>

      {/* Modal for Creating/Editing Custom Category */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        >
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}>
            {/* Parent Category Selector - only show if not editing and parent exists */}
            {!editingCategory && selectedParentId && (() => {
              const parentCategory = findCategoryById(allCategories, selectedParentId)
              return parentCategory ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Crear subcategoría en:</strong><br/>
                    {parentCategory.icon} {parentCategory.name}
                  </p>
                </div>
              ) : null
            })()}

            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={selectedParentId ? 'Ej: Subcategoría específica' : 'Ej: Cine, Supermercado, etc.'}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Icon Selector */}
            <EmojiPicker
              value={formData.icon}
              onChange={(icon) => setFormData({ ...formData, icon })}
              label="Icono"
            />

            {/* Color Selector */}
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
              label="Color"
            />

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" className="text-current" />
                    {LoadingMessages.saving}
                  </span>
                ) : editingCategory ? (
                  'Actualizar'
                ) : (
                  'Crear'
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
