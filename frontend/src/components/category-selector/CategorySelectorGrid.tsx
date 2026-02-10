'use client'

import { useState } from 'react'
import { MergedCategory } from '@/types'
import { CategoryVariantProps } from './types'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export function CategorySelectorGrid({
    value,
    onChange,
    categories,
    onClose,
}: CategoryVariantProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const translateCategory = useCategoryTranslation()
    const t = useTranslations('transactions.category')
    const [selectedMainCategory, setSelectedMainCategory] = useState<string>('')

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

    const selectedMainCategoryData = selectedMainCategory
        ? findCategoryById(categories, selectedMainCategory)
        : null

    const handleCategoryClick = (category: MergedCategory) => {
        if (!category.subcategories || category.subcategories.length === 0 || searchQuery) {
            // Select directly if no subcategories OR if searching (flattened view)
            onChange(category.id)
            if (onClose) onClose()
        } else {
            // Has subcategories and not searching, expand
            setSelectedMainCategory(category.id)
        }
    }

    // Filter categories based on search
    const filteredCategories = searchQuery
        ? categories.flatMap(cat => {
            const matches = []
            const catName = translateCategory(cat).toLowerCase()
            if (catName.includes(searchQuery.toLowerCase())) matches.push(cat)

            if (cat.subcategories) {
                cat.subcategories.forEach(sub => {
                    const subName = translateCategory(sub).toLowerCase()
                    if (subName.includes(searchQuery.toLowerCase())) matches.push(sub)
                })
            }
            return matches
        })
        : categories

    return (
        <div className="p-2 w-full max-w-sm mx-auto sm:max-w-md space-y-3">
            {/* Search Input */}
            <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                    type="text"
                    placeholder={t('searchPlaceholder') || 'Search category...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-muted/50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    autoFocus
                />
            </div>

            {/* List/Grid View */}
            <div className="max-h-[300px] overflow-y-auto pr-1">
                {/* Search Results (Flattened) */}
                {searchQuery && (
                    <div className="grid grid-cols-1 gap-1">
                        {filteredCategories.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => handleCategoryClick(category)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 text-left transition-colors"
                            >
                                <div
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-lg shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: (category.color || '#3b82f6') + '20' }}
                                >
                                    {category.icon || '📁'}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-medium truncate">{translateCategory(category)}</span>
                                    {category.parentId && <span className="text-[10px] text-muted-foreground truncate">{translateCategory(findCategoryById(categories, category.parentId!)!)}</span>}
                                </div>
                            </button>
                        ))}
                        {filteredCategories.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No categories found</p>}
                    </div>
                )}

                {/* Main Categories Grid (Default View) */}
                {!searchQuery && !selectedMainCategory && (
                    <div className="grid grid-cols-4 gap-2">
                        {categories.map((category) => {
                            const isSelected = value === category.id

                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => handleCategoryClick(category)}
                                    className={cn(
                                        'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                                        'border border-transparent hover:bg-muted/50 hover:border-border',
                                        isSelected && 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                    )}
                                >
                                    <div
                                        className="w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-sm"
                                        style={{ backgroundColor: (category.color || '#3b82f6') + '20' }}
                                    >
                                        {category.icon || '📁'}
                                    </div>
                                    <span className="text-[10px] font-medium text-center text-foreground leading-tight line-clamp-2 w-full">
                                        {translateCategory(category)}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Subcategories Grid */}
                {!searchQuery && selectedMainCategory && selectedMainCategoryData?.subcategories && (
                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header with Back Button */}
                        <div className="flex items-center gap-2 pb-2 mb-2 border-b">
                            <button
                                type="button"
                                onClick={() => setSelectedMainCategory('')}
                                className="p-1 hover:bg-muted rounded-full"
                            >
                                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-2">
                                <span
                                    className="flex items-center justify-center w-6 h-6 rounded text-sm"
                                    style={{ backgroundColor: (selectedMainCategoryData.color || '#3b82f6') + '20' }}
                                >
                                    {selectedMainCategoryData.icon || '📁'}
                                </span>
                                <span className="font-semibold text-sm">{translateCategory(selectedMainCategoryData)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {selectedMainCategoryData.subcategories.map((subcategory) => {
                                return (
                                    <button
                                        key={subcategory.id}
                                        type="button"
                                        onClick={() => handleCategoryClick(subcategory)}
                                        className={cn(
                                            'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                                            'border border-transparent hover:bg-muted/50 hover:border-border',
                                            value === subcategory.id && 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                        )}
                                    >
                                        <div
                                            className="w-10 h-10 flex items-center justify-center rounded-xl text-xl shadow-sm"
                                            style={{ backgroundColor: (subcategory.color || '#3b82f6') + '20' }}
                                        >
                                            {subcategory.icon || '📁'}
                                        </div>
                                        <span className="text-[10px] font-medium text-center text-foreground leading-tight line-clamp-2 w-full">
                                            {translateCategory(subcategory)}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {categories.length === 0 && (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                    {t('noCategories')}
                </p>
            )}
        </div>
    )
}
