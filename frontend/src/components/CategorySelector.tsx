'use client'

import { useState, useMemo, useId } from 'react'
import { TransactionType, MergedCategory } from '@/types'
import { useMergedCategories } from '@/hooks/useCategories'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { CategorySelectorGrid } from './category-selector/CategorySelectorGrid'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const t = useTranslations('transactions.category')
  const labelId = useId()
  const listboxId = useId()
  const errorId = useId()

  const mainCategories = useMemo(() => {
    return categories.filter(cat => !cat.parentId)
  }, [categories])

  // Helper to find category data for display
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

  const selectedCategoryData = value ? findCategoryById(categories, value) : null

  if (isLoading) {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="animate-pulse bg-muted h-12 rounded-lg" role="status" aria-label="Loading categories"></div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      {label && (
        <label id={labelId} className="block text-sm font-medium text-foreground mb-1">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      {/* Selected Category Display / Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-haspopup="dialog"
          aria-controls={isExpanded ? listboxId : undefined}
          aria-labelledby={label ? labelId : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full p-2 border rounded-xl text-left flex items-center justify-between transition-all duration-200 group bg-background',
            'hover:bg-muted/30 hover:border-primary/50',
            error ? 'border-destructive ring-1 ring-destructive/20' : 'border-input',
            isExpanded && 'ring-2 ring-primary/20 border-primary shadow-sm'
          )}
        >
          {selectedCategoryData ? (
            <div className="flex items-center gap-3 w-full overflow-hidden">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg text-xl shadow-sm transition-transform group-hover:scale-105 flex-shrink-0"
                style={{ backgroundColor: (selectedCategoryData.color || '#3b82f6') + '20' }}
              >
                {selectedCategoryData.icon || '📁'}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold text-sm truncate text-foreground">{translateCategory(selectedCategoryData)}</span>
                <span className="text-xs text-muted-foreground truncate opacity-80">
                  {selectedCategoryData.source !== 'TEMPLATE'
                    ? (selectedCategoryData.source === 'CUSTOM' ? 'Personalizado' : 'Modificado')
                    : t('placeholder').replace('Select a category...', 'Categoría General')}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 011 12V7a4 4 0 014-4z" /></svg>
              </div>
              <span className="text-muted-foreground text-sm font-medium">{t('placeholder')}</span>
            </div>
          )}
          <div className="pl-2">
            <svg
              className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Popover Content */}
        {isExpanded && (
          <div
            id={listboxId}
            className="absolute z-50 w-full mt-2 border border-border rounded-xl bg-popover shadow-xl shadow-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top"
          >
            <div className="bg-popover">
              <CategorySelectorGrid
                value={value}
                onChange={(val) => {
                  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
                  onChange(val);
                  setIsExpanded(false);
                }}
                categories={mainCategories}
                type={type}
                onClose={() => setIsExpanded(false)}
              />
            </div>
          </div>
        )}
      </div>

      {error && <p id={errorId} className="text-destructive text-sm mt-1 animate-in slide-in-from-top-1" role="alert">{error}</p>}
    </div>
  )
}
