'use client'

import { useState, useEffect, useCallback, useId, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { TransactionType, Account, MergedCategory } from '@/types'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import { cn } from '@/lib/utils'
import { X, SlidersHorizontal, Search, ArrowUpDown, Calendar, DollarSign, Building2, Tag, Check, ChevronDown, MoreHorizontal } from 'lucide-react'

export interface TransactionFilters {
  search: string
  type: TransactionType | 'ALL'
  accountId: string
  categoryId: string
  startDate: string
  endDate: string
  minAmount: string
  maxAmount: string
  sortBy: 'date' | 'amount' | 'payee'
  sortOrder: 'asc' | 'desc'
}

interface TransactionFiltersProps {
  filters: TransactionFilters
  onFilterChange: (filters: TransactionFilters) => void
  accounts: Account[]
  categories: MergedCategory[]
}

export default function TransactionFiltersComponent({
  filters,
  onFilterChange,
  accounts,
  categories,
}: TransactionFiltersProps) {
  const t = useTranslations('filters')
  const translateCategory = useCategoryTranslation()
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Searchable dropdown states
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [showMoreAccounts, setShowMoreAccounts] = useState(false)

  // Accessibility IDs
  const searchId = useId()
  const filtersPanelId = useId()

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isAdvancedOpen &&
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsAdvancedOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAdvancedOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isAdvancedOpen) {
        setIsAdvancedOpen(false)
        setCategoryDropdownOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isAdvancedOpen])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, filters, onFilterChange])

  const handleTypeChange = useCallback((type: TransactionType | 'ALL') => {
    onFilterChange({ ...filters, type })
  }, [filters, onFilterChange])

  const handleSortChange = useCallback((sortBy: 'date' | 'amount' | 'payee', sortOrder: 'asc' | 'desc') => {
    onFilterChange({ ...filters, sortBy, sortOrder })
  }, [filters, onFilterChange])

  const handleFilterChange = useCallback((field: keyof TransactionFilters, value: string) => {
    onFilterChange({ ...filters, [field]: value })
  }, [filters, onFilterChange])

  const removeFilter = useCallback((field: keyof TransactionFilters) => {
    const defaultValues: Partial<TransactionFilters> = {
      accountId: '',
      categoryId: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    }
    onFilterChange({ ...filters, [field]: defaultValues[field] || '' })
  }, [filters, onFilterChange])

  const clearAdvancedFilters = useCallback(() => {
    onFilterChange({
      ...filters,
      accountId: '',
      categoryId: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    })
  }, [filters, onFilterChange])

  const clearAllFilters = useCallback(() => {
    onFilterChange({
      search: '',
      type: 'ALL',
      accountId: '',
      categoryId: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'date',
      sortOrder: 'desc',
    })
    setSearchInput('')
    setIsAdvancedOpen(false)
  }, [onFilterChange])

  // Get active advanced filters for chips显示
  const getActiveFilters = () => {
    const active: { key: keyof TransactionFilters; label: string; value: string }[] = []

    if (filters.accountId) {
      const account = accounts.find(a => a.id === filters.accountId)
      if (account) active.push({ key: 'accountId', label: account.name, value: filters.accountId })
    }

    if (filters.categoryId) {
      const findCategory = (cats: MergedCategory[]): MergedCategory | undefined => {
        for (const cat of cats) {
          if (cat.id === filters.categoryId) return cat
          if (cat.subcategories) {
            const found = findCategory(cat.subcategories)
            if (found) return found
          }
        }
        return undefined
      }
      const category = findCategory(categories)
      if (category) active.push({ key: 'categoryId', label: `${category.icon} ${translateCategory(category)}`, value: filters.categoryId })
    }

    if (filters.startDate) {
      active.push({ key: 'startDate', label: `Desde: ${filters.startDate}`, value: filters.startDate })
    }

    if (filters.endDate) {
      active.push({ key: 'endDate', label: `Hasta: ${filters.endDate}`, value: filters.endDate })
    }

    if (filters.minAmount) {
      active.push({ key: 'minAmount', label: `Min: $${filters.minAmount}`, value: filters.minAmount })
    }

    if (filters.maxAmount) {
      active.push({ key: 'maxAmount', label: `Max: $${filters.maxAmount}`, value: filters.maxAmount })
    }

    return active
  }

  const activeFilters = getActiveFilters()
  const hasActiveFilters = activeFilters.length > 0 || filters.type !== 'ALL'

  const typeOptions: { value: TransactionType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: t('allTypes') },
    { value: 'EXPENSE', label: t('expenses') },
    { value: 'INCOME', label: t('income') },
    { value: 'TRANSFER', label: t('transfers') },
  ]

  const sortOptions = [
    { sortBy: 'date' as const, sortOrder: 'desc' as const, label: t('newestFirst') },
    { sortBy: 'date' as const, sortOrder: 'asc' as const, label: t('oldestFirst') },
    { sortBy: 'amount' as const, sortOrder: 'desc' as const, label: t('highestAmount') },
    { sortBy: 'amount' as const, sortOrder: 'asc' as const, label: t('lowestAmount') },
  ]

  // Flatten categories for searching
  const flattenCategories = (cats: MergedCategory[]): MergedCategory[] => {
    const result: MergedCategory[] = []
    for (const cat of cats) {
      result.push(cat)
      if (cat.subcategories) {
        result.push(...cat.subcategories)
      }
    }
    return result
  }

  const allCategories = flattenCategories(categories)

  const filteredCategories = allCategories.filter(c =>
    translateCategory(c).toLowerCase().includes(categorySearch.toLowerCase())
  )

  const selectedCategory = allCategories.find(c => c.id === filters.categoryId)

  return (
    <div className="space-y-4" role="search" aria-label={t('searchPlaceholder')}>
      {/* Search Bar */}
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">{t('searchPlaceholder')}</label>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          id={searchId}
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-3 border-0 border-b border-border bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Type Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {typeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleTypeChange(option.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-full transition-all',
              filters.type === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort Dropdown */}
        <div className="relative group">
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="hidden sm:inline">
              {sortOptions.find(s => s.sortBy === filters.sortBy && s.sortOrder === filters.sortOrder)?.label || t('newestFirst')}
            </span>
          </button>
          <div className="absolute right-0 top-full mt-1 py-1 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[160px]">
            {sortOptions.map((option) => (
              <button
                key={`${option.sortBy}-${option.sortOrder}`}
                onClick={() => handleSortChange(option.sortBy, option.sortOrder)}
                className={cn(
                  'w-full px-4 py-2 text-sm text-left transition-colors',
                  filters.sortBy === option.sortBy && filters.sortOrder === option.sortOrder
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Button with Popover */}
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            aria-expanded={isAdvancedOpen}
            aria-controls={filtersPanelId}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-full transition-all',
              isAdvancedOpen || activeFilters.length > 0
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{t('advancedFilters')}</span>
            {activeFilters.length > 0 && (
              <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                {activeFilters.length}
              </span>
            )}
          </button>

          {/* Floating Popover */}
          {isAdvancedOpen && (
            <div
              ref={popoverRef}
              id={filtersPanelId}
              className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-30 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
              role="dialog"
              aria-label={t('advancedFilters')}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">{t('advancedFilters')}</h3>
                <button
                  onClick={() => setIsAdvancedOpen(false)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-4">

                {/* Account Chips */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Building2 className="w-3.5 h-3.5" />
                    {t('account')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleFilterChange('accountId', '')}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
                        !filters.accountId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {t('allAccounts')}
                    </button>
                    {accounts.slice(0, showMoreAccounts ? accounts.length : 4).map((account) => (
                      <button
                        key={account.id}
                        onClick={() => handleFilterChange('accountId', account.id)}
                        className={cn(
                          'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
                          filters.accountId === account.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {account.name}
                      </button>
                    ))}
                    {accounts.length > 4 && (
                      <button
                        onClick={() => setShowMoreAccounts(!showMoreAccounts)}
                        className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted/30 text-muted-foreground hover:bg-muted transition-all flex items-center gap-1"
                      >
                        <MoreHorizontal className="w-3 h-3" />
                        {showMoreAccounts ? 'Menos' : `+${accounts.length - 4}`}
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Searchable Dropdown */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Tag className="w-3.5 h-3.5" />
                    {t('category')}
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground hover:border-primary/50 transition-all"
                    >
                      <span className={selectedCategory ? 'text-foreground' : 'text-muted-foreground'}>
                        {selectedCategory ? `${selectedCategory.icon} ${translateCategory(selectedCategory)}` : t('allCategories')}
                      </span>
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', categoryDropdownOpen && 'rotate-180')} />
                    </button>

                    {categoryDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-40 overflow-hidden">
                        <div className="p-2 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              placeholder="Buscar categoría..."
                              className="w-full pl-8 pr-3 py-1.5 text-sm bg-muted/50 border-0 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                              autoFocus
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          <button
                            onClick={() => {
                              handleFilterChange('categoryId', '')
                              setCategoryDropdownOpen(false)
                              setCategorySearch('')
                            }}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                              !filters.categoryId && 'bg-primary/10 text-primary'
                            )}
                          >
                            {!filters.categoryId && <Check className="w-4 h-4" />}
                            <span className={!filters.categoryId ? '' : 'pl-6'}>{t('allCategories')}</span>
                          </button>
                          {filteredCategories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => {
                                handleFilterChange('categoryId', category.id)
                                setCategoryDropdownOpen(false)
                                setCategorySearch('')
                              }}
                              className={cn(
                                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                                filters.categoryId === category.id && 'bg-primary/10 text-primary'
                              )}
                            >
                              {filters.categoryId === category.id && <Check className="w-4 h-4" />}
                              <span className={filters.categoryId === category.id ? '' : 'pl-6'}>
                                {category.icon} {translateCategory(category)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Date Range */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5" />
                    {t('startDate')} / {t('endDate')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                {/* Amount Range */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <DollarSign className="w-3.5 h-3.5" />
                    {t('minAmount')} / {t('maxAmount')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={filters.minAmount}
                      onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                      placeholder="Min"
                      className="flex-1 min-w-0 px-2 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={filters.maxAmount}
                      onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                      placeholder="Max"
                      className="flex-1 min-w-0 px-2 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              {activeFilters.length > 0 && (
                <div className="px-4 py-3 border-t border-border bg-muted/30 rounded-b-xl">
                  <button
                    onClick={clearAdvancedFilters}
                    className="w-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors"
                  >
                    {t('clearAll')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clear All */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-full"
            >
              {filter.label}
              <button
                onClick={() => removeFilter(filter.key)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
