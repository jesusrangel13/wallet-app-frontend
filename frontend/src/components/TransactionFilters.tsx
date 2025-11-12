'use client'

import { useState, useEffect } from 'react'
import { TransactionType, Account, Category } from '@/types'
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
  categories: Category[]
}

export default function TransactionFiltersComponent({
  filters,
  onFilterChange,
  accounts,
  categories,
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search)

  // Debounce search input - only trigger API call after 300ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ ...filters, search: searchInput })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput, filters, onFilterChange])

  const handleChange = (field: keyof TransactionFilters, value: string) => {
    if (field === 'search') {
      setSearchInput(value) // Update local state for debouncing
    } else {
      onFilterChange({ ...filters, [field]: value })
    }
  }

  const clearFilters = () => {
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
    setIsExpanded(false)
  }

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
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleChange('search', e.target.value)}
          placeholder="Search by description, payee, or amount..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
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
      <div className="flex flex-wrap gap-2 items-center">
        {/* Type Filter */}
        <select
          value={filters.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ALL">All Types</option>
          <option value="EXPENSE">Expenses</option>
          <option value="INCOME">Income</option>
          <option value="TRANSFER">Transfers</option>
        </select>

        {/* Sort */}
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-')
            handleChange('sortBy', sortBy)
            handleChange('sortOrder', sortOrder)
          }}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
          <option value="payee-asc">Payee A-Z</option>
          <option value="payee-desc">Payee Z-A</option>
        </select>

        {/* Advanced Filters Toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2',
            isExpanded || activeFiltersCount > 0
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
              : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:border-gray-300'
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Advanced Filters
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <select
                value={filters.accountId}
                onChange={(e) => handleChange('accountId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <optgroup key={category.id} label={category.name}>
                    <option value={category.id}>
                      {category.icon} {category.name} (All)
                    </option>
                    {category.subcategories?.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        &nbsp;&nbsp;{sub.icon} {sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                step="0.01"
                value={filters.minAmount}
                onChange={(e) => handleChange('minAmount', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
              <input
                type="number"
                step="0.01"
                value={filters.maxAmount}
                onChange={(e) => handleChange('maxAmount', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
