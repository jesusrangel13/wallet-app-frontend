'use client'

import { useState } from 'react'
import { getAllWidgets, getWidgetsByCategory, type WidgetDefinition } from '@/config/widgets'
import { useDashboardStore } from '@/store/dashboardStore'
import { Modal } from '@/components/ui/Modal'
import { X, Search } from 'lucide-react'
import { dashboardPreferenceAPI } from '@/lib/api'
import { toast } from 'sonner'

interface WidgetSelectorProps {
  isOpen: boolean
  onClose: () => void
}

export const WidgetSelector = ({ isOpen, onClose }: WidgetSelectorProps) => {
  const { addWidget, widgets, setPreferences } = useDashboardStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const allWidgets = getAllWidgets()

  // Filter widgets based on search and category
  const filteredWidgets = allWidgets.filter((widget) => {
    const matchesSearch =
      widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = !selectedCategory || widget.category === selectedCategory

    // Don't show already added widgets (except for ones that can be multiple instances)
    const isAlreadyAdded = widgets.some((w) => w.type === widget.id)

    return matchesSearch && matchesCategory && !isAlreadyAdded
  })

  // Get unique categories
  const categories = Array.from(new Set(allWidgets.map((w) => w.category)))

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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Add Widgets</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search widgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700 mb-3">Categories</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
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
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                  selectedCategory === category
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
        <div className="overflow-y-auto flex-1 p-6">
          {filteredWidgets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWidgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => handleAddWidget(widget)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
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

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
