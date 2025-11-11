'use client'

import { X, GripHorizontal, ChevronUp, ChevronDown } from 'lucide-react'
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
    <div className="relative h-full w-full">
      {/* Drag handle */}
      <div className="drag-handle absolute top-2 left-2 cursor-grab z-20 p-1 hover:bg-gray-200 rounded">
        <GripHorizontal className="w-4 h-4 text-gray-400" />
      </div>

      {/* Height selector */}
      <div className="absolute bottom-2 left-2 z-20">
        <div className="relative">
          <button
            onClick={() => setShowHeightMenu(!showHeightMenu)}
            className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
            title="Adjust height"
            type="button"
          >
            <span>H: {currentHeight}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Height menu dropdown */}
          {showHeightMenu && (
            <div className="absolute left-0 bottom-full mb-2 bg-white border border-gray-300 rounded shadow-lg z-30">
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
                  {option.label} ({option.value}x)
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={handleRemoveWidget}
        className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 z-20 transition-colors hover:scale-110"
        title="Remove widget"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Widget content with padding for controls */}
      <div className="pt-10 px-2 pb-2 h-full">
        {children}
      </div>
    </div>
  )
}
