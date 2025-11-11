'use client'

import { Trash2, GripHorizontal, ChevronDown } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { dashboardPreferenceAPI } from '@/lib/api'
import { toast } from 'sonner'
import { useState } from 'react'

interface WidgetWrapperProps {
  widgetId: string
  children: React.ReactNode
}

const HEIGHT_OPTIONS = [
  { label: 'Compact', value: 1 },
  { label: 'Normal', value: 2 },
  { label: 'Large', value: 3 },
  { label: 'Extra Large', value: 4 },
]

export const WidgetWrapper = ({ widgetId, children }: WidgetWrapperProps) => {
  const { removeWidget, widgets, layout, setPreferences, updateWidgetHeight } = useDashboardStore()
  const [showHeightMenu, setShowHeightMenu] = useState(false)

  // Get current height of the widget
  const currentHeight = layout.find((l) => l.i === widgetId)?.h || 2

  const handleRemoveWidget = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      // Remove from local state
      removeWidget(widgetId)

      // Get updated state after removal
      const updatedWidgets = widgets.filter((w) => w.id !== widgetId)
      const updatedLayout = layout.filter((l) => l.i !== widgetId)

      // Save to backend
      await dashboardPreferenceAPI.savePreferences(updatedWidgets, updatedLayout)

      // Refetch complete preferences from backend to ensure consistency
      const res = await dashboardPreferenceAPI.getPreferences()
      const updatedPreferences = res.data.data as any
      setPreferences(updatedPreferences)

      toast.success('Widget removed')
    } catch (error) {
      console.error('Error removing widget:', error)
      toast.error('Failed to remove widget')
    }
  }

  const handleHeightChange = async (newHeight: number) => {
    try {
      // Update local state first
      updateWidgetHeight(widgetId, newHeight)
      setShowHeightMenu(false)

      // Update layout array with new height
      const updatedLayout = layout.map((item) =>
        item.i === widgetId ? { ...item, h: newHeight } : item
      )

      // Save to backend
      await dashboardPreferenceAPI.updateLayout(updatedLayout)

      toast.success(`Height adjusted to ${HEIGHT_OPTIONS.find((o) => o.value === newHeight)?.label}`)
    } catch (error) {
      console.error('Error updating widget height:', error)
      toast.error('Failed to update widget height')
    }
  }

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Overlay for widget controls - positioned absolute over the widget header */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 py-4 z-10 pointer-events-none">
        {/* Left: Empty space for widget title */}
        <div />

        {/* Right: Widget Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Height selector */}
          <div className="relative">
            <button
              onClick={() => setShowHeightMenu(!showHeightMenu)}
              className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
              title="Adjust height"
              type="button"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Height menu dropdown */}
            {showHeightMenu && (
              <div className="absolute right-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-max">
                {HEIGHT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleHeightChange(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      currentHeight === option.value
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drag Handle */}
          <div className="drag-handle cursor-grab active:cursor-grabbing flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
            <GripHorizontal className="w-4 h-4" />
          </div>

          {/* Remove button */}
          <button
            onClick={handleRemoveWidget}
            className="flex items-center justify-center w-8 h-8 rounded hover:bg-red-50 transition-colors text-gray-600 hover:text-red-600"
            title="Remove widget"
            type="button"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Widget content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}
