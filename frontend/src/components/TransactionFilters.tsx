'use client'

import { useState, useEffect, useCallback, useId } from 'react'
import { useTranslations } from 'next-intl'
import { TransactionType, Account, MergedCategory } from '@/types'
import { useCategoryTranslation } from '@/hooks/useCategoryTranslation'
import { cn } from '@/lib/utils'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search)

  // Accessibility IDs
  const searchId = useId()
  const typeFilterId = useId()
  const sortFilterId = useId()
  const accountFilterId = useId()
  const categoryFilterId = useId()
  const startDateId = useId()
  const endDateId = useId()
  const minAmountId = useId()
  const maxAmountId = useId()
  const filtersPanelId = useId()

  // Debounce search input - only trigger API call after 300ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput, filters, onFilterChange])

  // Memoize event handlers to prevent child re-renders
  const handleChange = useCallback((field: keyof TransactionFilters, value: string) => {
    if (field === 'search') {
      setSearchInput(value) // Update local state for debouncing
    } else {
      onFilterChange({ ...filters, [field]: value })
    }
  }, [filters, onFilterChange])

  const clearFilters = useCallback(() => {
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
    setIsExpanded(false)
  }, [onFilterChange])

  const activeFiltersCount = [
    filters.type !== 'ALL',
    filters.accountId,
    filters.categoryId,
    filters.startDate,
    filters.endDate,
    filters.minAmount,
    filters.maxAmount,
  ].filter(Boolean).length

  return (
    <div className="space-y-3" role="search" aria-label={t('searchPlaceholder')}>
      {/* Search Bar */}
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">{t('searchPlaceholder')}</label>
        <input
          id={searchId}
          type="text"
          value={searchInput}
          onChange={(e) => handleChange('search', e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Quick Filters & Sort */}
      <div className="flex flex-wrap gap-2 items-center" role="group" aria-label={t('advancedFilters')}>
        {/* Type Filter */}
        <label htmlFor={typeFilterId} className="sr-only">{t('allTypes')}</label>
        <select
          id={typeFilterId}
          value={filters.type}
          onChange={(e) => handleChange('type', e.target.value)}
          aria-label={t('allTypes')}
          className="px-3 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="ALL">{t('allTypes')}</option>
          <option value="EXPENSE">{t('expenses')}</option>
          <option value="INCOME">{t('income')}</option>
          <option value="TRANSFER">{t('transfers')}</option>
        </select>

        {/* Sort */}
        <label htmlFor={sortFilterId} className="sr-only">Sort by</label>
        <select
          id={sortFilterId}
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-')
            handleChange('sortBy', sortBy)
            handleChange('sortOrder', sortOrder)
          }}
          aria-label="Sort by"
          className="px-3 py-1.5 text-sm border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="date-desc">{t('newestFirst')}</option>
          <option value="date-asc">{t('oldestFirst')}</option>
          <option value="amount-desc">{t('highestAmount')}</option>
          <option value="amount-asc">{t('lowestAmount')}</option>
          <option value="payee-asc">{t('payeeAZ')}</option>
          <option value="payee-desc">{t('payeeZA')}</option>
        </select>

        {/* Advanced Filters Toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={filtersPanelId}
          aria-label={`${t('advancedFilters')}${activeFiltersCount > 0 ? `, ${activeFiltersCount} active` : ''}`}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
            isExpanded || activeFiltersCount > 0
              ? 'bg-primary/10 text-primary border-2 border-primary'
              : 'bg-muted text-muted-foreground border-2 border-transparent hover:border-input'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {t('advancedFilters')}
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full" aria-hidden="true">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            aria-label={t('clearAll')}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            {t('clearAll')}
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div
          id={filtersPanelId}
          className="border border-border rounded-lg p-4 bg-muted/30 space-y-4"
          role="region"
          aria-label={t('advancedFilters')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Filter */}
            <div>
              <label htmlFor={accountFilterId} className="block text-sm font-medium text-foreground mb-1">{t('account')}</label>
              <select
                id={accountFilterId}
                value={filters.accountId}
                onChange={(e) => handleChange('accountId', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">{t('allAccounts')}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor={categoryFilterId} className="block text-sm font-medium text-foreground mb-1">{t('category')}</label>
              <select
                id={categoryFilterId}
                value={filters.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">{t('allCategories')}</option>
                {categories.map((category) => (
                  <optgroup key={category.id} label={translateCategory(category)}>
                    <option value={category.id}>
                      {category.icon} {translateCategory(category)} {t('categoryAll')}
                    </option>
                    {category.subcategories?.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        &nbsp;&nbsp;{sub.icon} {translateCategory(sub)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label htmlFor={startDateId} className="block text-sm font-medium text-foreground mb-1">{t('startDate')}</label>
              <input
                id={startDateId}
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor={endDateId} className="block text-sm font-medium text-foreground mb-1">{t('endDate')}</label>
              <input
                id={endDateId}
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Amount Range */}
            <div>
              <label htmlFor={minAmountId} className="block text-sm font-medium text-foreground mb-1">{t('minAmount')}</label>
              <input
                id={minAmountId}
                type="number"
                step="0.01"
                value={filters.minAmount}
                onChange={(e) => handleChange('minAmount', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor={maxAmountId} className="block text-sm font-medium text-foreground mb-1">{t('maxAmount')}</label>
              <input
                id={maxAmountId}
                type="number"
                step="0.01"
                value={filters.maxAmount}
                onChange={(e) => handleChange('maxAmount', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
