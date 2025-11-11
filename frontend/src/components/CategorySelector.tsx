'use client'

import { useState, useEffect } from 'react'
import { Category, TransactionType } from '@/types'
import { categoryAPI } from '@/lib/api'
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
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [type])

  useEffect(() => {
    // When value changes, find the main category
    if (value && categories.length > 0) {
      const selectedCategory = findCategoryById(categories, value)
      if (selectedCategory) {
        const mainCategoryId = selectedCategory.parentId || selectedCategory.id
        setSelectedMainCategory(mainCategoryId)
      }
    }
  }, [value, categories])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const response = await categoryAPI.getAll(type)
      setCategories(response.data.data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const findCategoryById = (cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat
      if (cat.subcategories) {
        const found = cat.subcategories.find((sub) => sub.id === id)
        if (found) return found
      }
    }
    return null
  }

  const handleMainCategoryClick = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
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

  const selectedCategoryData = value ? findCategoryById(categories, value) : null
  const selectedMainCategoryData = categories.find((c) => c.id === selectedMainCategory)

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
              style={{ backgroundColor: selectedCategoryData.color + '20' }}
            >
              {selectedCategoryData.icon}
            </span>
            <span className="font-medium text-gray-900">{selectedCategoryData.name}</span>
          </div>
        ) : (
          <span className="text-gray-500">Select a category...</span>
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
              {categories.map((category) => (
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
                    backgroundColor: value === category.id ? undefined : category.color + '10',
                  }}
                >
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                    {category.name}
                  </span>
                  {category.subcategories && category.subcategories.length > 0 && (
                    <span className="text-xs text-gray-500">→</span>
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
                Back to categories
              </button>

              {/* Selected Main Category Display */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-lg"
                  style={{ backgroundColor: selectedMainCategoryData.color + '20' }}
                >
                  {selectedMainCategoryData.icon}
                </span>
                <span className="font-semibold text-gray-900">{selectedMainCategoryData.name}</span>
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
                        value === subcategory.id ? undefined : subcategory.color + '10',
                    }}
                  >
                    <span className="text-2xl">{subcategory.icon}</span>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                      {subcategory.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {categories.length === 0 && (
            <p className="text-sm text-gray-500 italic text-center py-4">
              No categories available. Create your first category to get started.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}
