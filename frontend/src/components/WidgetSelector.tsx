'use client'

import { useState, useEffect, useMemo } from 'react'
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
  const { widgets, setPreferences } = useDashboardStore()
  const [searchInput, setSearchInput] = useState('')
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

      toast.success(`${widget.name} added to dashboard`)
      onClose()
    } catch (error) {
      console.error('Error adding widget:', error)
      toast.error(`Failed to add ${widget.name}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Widgets">
      <div className="space-y-4 max-w-2xl">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search widgets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-semibold text-gray-700 mb-3">Categories</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Widget List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {filteredWidgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWidgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => handleAddWidget(widget)}
                  disabled={isLoading}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group disabled:opacity-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                      {widget.name}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded capitalize">
                      {widget.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{widget.description}</p>
                  <div className="flex gap-2 text-xs text-gray-500">
                    {widget.resizable && (
                      <span className="px-2 py-1 bg-gray-100 rounded">Resizable</span>
                    )}
                    {widget.draggable && (
                      <span className="px-2 py-1 bg-gray-100 rounded">Draggable</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-center">
              <div>
                <p className="text-gray-500 text-lg font-medium">No widgets found</p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your search or category filter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
