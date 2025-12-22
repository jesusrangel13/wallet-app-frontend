'use client'

import { useState, useMemo } from 'react'
import { MergedCategory, TransactionType } from '@/types'
import { useMergedCategories } from '@/hooks/useCategories'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface CategorySelectorProps {
  value?: string
  onChange: (categoryId: string | undefined) => void
  type: TransactionType
  error?: string
  label?: string
  required?: boolean
}

export default function CategorySelector({
  value,
  onChange,
  type,
  error,
  label = 'Category',
  required = false,
}: CategorySelectorProps) {
  const { categories, isLoading } = useMergedCategories(type)
  const translateCategory = useCategoryTranslation()
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)
  const t = useTranslations('transactions.category')

  // Find a category by ID in the nested structure
  const findCategoryById = (cats: MergedCategory[], id: string): MergedCategory | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat
      if (cat.subcategories) {
        const found = findCategoryById(cat.subcategories, id)
        if (found) return found
      }
    }
    return null
  }

  // Get main categories (those without parents)
  const mainCategories = useMemo(() => {
    return categories.filter(cat => !cat.parentId)
  }, [categories])

  // Get subcategories for selected main category
  const selectedMainCategoryData = selectedMainCategory
    ? findCategoryById(categories, selectedMainCategory)
    : null

  const selectedCategoryData = value ? findCategoryById(categories, value) : null

  const handleMainCategoryClick = (categoryId: string) => {
    const category = findCategoryById(categories, categoryId)
    if (!category?.subcategories || category.subcategories.length === 0) {
      // No subcategories, select directly
      onChange(categoryId)
      setSelectedMainCategory(categoryId)
      setIsExpanded(false)
    } else {
      // Has subcategories, expand to show them
      setSelectedMainCategory(categoryId)
    }
  }

  const handleSubcategoryClick = (categoryId: string) => {
    onChange(categoryId)
    setIsExpanded(false)
  }

  if (isLoading) {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="animate-pulse bg-gray-200 h-12 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selected Category Display / Trigger */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between transition-colors',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
          error ? 'border-red-500' : 'border-gray-300',
          isExpanded && 'ring-2 ring-blue-500 border-blue-500'
        )}
      >
        {selectedCategoryData ? (
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center w-8 h-8 rounded-lg text-lg"
              style={{ backgroundColor: (selectedCategoryData.color || '#3b82f6') + '20' }}
            >
              {selectedCategoryData.icon || '📁'}
            </span>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{translateCategory(selectedCategoryData)}</span>
              {selectedCategoryData.source !== 'TEMPLATE' && (
                <span className="text-xs text-gray-500">
                  {selectedCategoryData.source === 'CUSTOM' ? '(Custom)' : '(Override)'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-gray-500">{t('placeholder')}</span>
        )}
        <svg
          className={cn('w-5 h-5 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Category Grid - Expanded View */}
      {isExpanded && (
        <div className="border border-gray-200 rounded-lg p-3 bg-white shadow-lg">
          {/* Main Categories Grid */}
          {!selectedMainCategory && (
            <div className="grid grid-cols-3 gap-2">
              {mainCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleMainCategoryClick(category.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
                    'hover:shadow-md border-2',
                    value === category.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:border-gray-300'
                  )}
                  style={{
                    backgroundColor: value === category.id ? undefined : (category.color || '#3b82f6') + '10',
                  }}
                >
                  <span className="text-2xl">{category.icon || '📁'}</span>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                    {translateCategory(category)}
                  </span>
                  {category.subcategories && category.subcategories.length > 0 && (
                    <span className="text-xs text-gray-500">→</span>
                  )}
                  {category.source !== 'TEMPLATE' && (
                    <span className="text-xs text-gray-500">
                      {category.source === 'CUSTOM' ? '✨' : '✏️'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Subcategories Grid */}
          {selectedMainCategory && selectedMainCategoryData?.subcategories && (
            <div className="space-y-3">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => setSelectedMainCategory('')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {t('backToCategories')}
              </button>

              {/* Selected Main Category Display */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-lg"
                  style={{ backgroundColor: (selectedMainCategoryData.color || '#3b82f6') + '20' }}
                >
                  {selectedMainCategoryData.icon || '📁'}
                </span>
                <span className="font-semibold text-gray-900">{translateCategory(selectedMainCategoryData)}</span>
              </div>

              {/* Subcategories Grid */}
              <div className="grid grid-cols-3 gap-2">
                {selectedMainCategoryData.subcategories.map((subcategory) => (
                  <button
                    key={subcategory.id}
                    type="button"
                    onClick={() => handleSubcategoryClick(subcategory.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg transition-all',
                      'hover:shadow-md border-2',
                      value === subcategory.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent hover:border-gray-300'
                    )}
                    style={{
                      backgroundColor:
                        value === subcategory.id ? undefined : (subcategory.color || '#3b82f6') + '10',
                    }}
                  >
                    <span className="text-2xl">{subcategory.icon || '📁'}</span>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                      {translateCategory(subcategory)}
                    </span>
                    {subcategory.source !== 'TEMPLATE' && (
                      <span className="text-xs text-gray-500">
                        {subcategory.source === 'CUSTOM' ? '✨' : '✏️'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mainCategories.length === 0 && (
            <p className="text-sm text-gray-500 italic text-center py-4">
              {t('noCategories')}
            </p>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
