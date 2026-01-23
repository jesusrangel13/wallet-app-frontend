'use client'

import { useState, useEffect, useMemo, useId } from 'react'
import { useTranslations } from 'next-intl'
import { getAllWidgets, type WidgetDefinition } from '@/config/widgets'
import { useDashboardStore } from '@/store/dashboardStore'
import { Modal } from '@/components/ui/Modal'
import { Search } from 'lucide-react'
import { dashboardPreferenceAPI } from '@/lib/api'
import { toast } from 'sonner'

interface WidgetSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export const WidgetSelector = ({ isOpen, onClose }: WidgetSelectorProps) => {
  const t = useTranslations('widgets')
  const { widgets, setPreferences } = useDashboardStore()
  const [searchInput, setSearchInput] = useState('')
  const searchId = useId()
  const categoryGroupId = useId()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const allWidgets = getAllWidgets()

  // Debounce search input - only trigger filtering after 300ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Memoize filtered widgets - expensive operation
  const filteredWidgets = useMemo(() => {
    return allWidgets.filter((widget) => {
      const matchesSearch =
        widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        widget.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = !selectedCategory || widget.category === selectedCategory

      // Don't show already added widgets (except for ones that can be multiple instances)
      const isAlreadyAdded = widgets.some((w) => w.type === widget.id)

      // Hide account-balances widget as it's now fixed
      const isFixed = widget.id === 'account-balances'

      return matchesSearch && matchesCategory && !isAlreadyAdded && !isFixed
    })
  }, [allWidgets, searchTerm, selectedCategory, widgets])

  // Memoize unique categories
  const categories = useMemo(
    () => Array.from(new Set(allWidgets.map((w) => w.category))),
    [allWidgets]
  )

  const handleAddWidget = async (widget: WidgetDefinition) => {
    try {
      setIsLoading(true)
      const newWidget = {
        id: `widget-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        type: widget.id,
        settings: {},
      }

      // Save to backend
      await dashboardPreferenceAPI.addWidget(newWidget)

      // Refetch complete preferences from backend to get the layout item
      const res = await dashboardPreferenceAPI.getPreferences()
      const updatedPreferences = res.data.data as any
      setPreferences(updatedPreferences)

      toast.success(t('selector.toasts.added', { name: widget.name }))
      onClose()
    } catch (error) {
      console.error('Error adding widget:', error)
      toast.error(t('selector.toasts.failedToAdd', { name: widget.name }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('selector.title')}>
      <div className="space-y-4 max-w-2xl">
        {/* Search */}
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">{t('selector.searchPlaceholder')}</label>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
          <input
            id={searchId}
            type="search"
            placeholder={t('selector.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Category Filter */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <p id={categoryGroupId} className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('selector.categoriesLabel')}</p>
          <div className="flex gap-2 flex-wrap" role="group" aria-labelledby={categoryGroupId}>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              aria-pressed={selectedCategory === null}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedCategory === null
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
            >
              {t('selector.all')}
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Widget List */}
        <div className="max-h-[60vh] overflow-y-auto" role="region" aria-label="Available widgets" aria-busy={isLoading}>
          {filteredWidgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
              {filteredWidgets.map((widget) => (
                <button
                  type="button"
                  key={widget.id}
                  onClick={() => handleAddWidget(widget)}
                  disabled={isLoading}
                  aria-label={`Add ${widget.name} widget`}
                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary dark:hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all text-left group disabled:opacity-50"
                  role="listitem"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary">
                      {widget.name}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded capitalize">
                      {widget.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{widget.description}</p>
                  <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {widget.resizable && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">{t('selector.features.resizable')}</span>
                    )}
                    {widget.draggable && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">{t('selector.features.draggable')}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-center" role="status">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">{t('selector.noWidgetsFound')}</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                  {t('selector.tryAdjusting')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
