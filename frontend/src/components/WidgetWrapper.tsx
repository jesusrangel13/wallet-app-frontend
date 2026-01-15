'use client'

import { Trash2, GripHorizontal } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { dashboardPreferenceAPI } from '@/lib/api'
import { toast } from 'sonner'
import { WidgetErrorBoundary } from '@/components/ui/WidgetErrorBoundary'

interface WidgetWrapperProps {
  widgetId: string
  widgetName?: string
  children: React.ReactNode
}

export const WidgetWrapper = ({ widgetId, widgetName, children }: WidgetWrapperProps) => {
  const { removeWidget, widgets, layout, setPreferences } = useDashboardStore()

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


  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Overlay for widget controls - positioned absolute over the CardHeader */}
      <div className="absolute top-0 right-0 h-16 flex items-center gap-1 px-6 py-4 z-10 pointer-events-none">
        {/* Widget Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Drag Handle - Hidden on mobile since drag and drop is disabled on small screens */}
          <div className="drag-handle cursor-grab active:cursor-grabbing hidden md:flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900">
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

      {/* Widget content wrapped in Error Boundary */}
      <div className="flex-1 overflow-auto">
        <WidgetErrorBoundary widgetName={widgetName}>
          {children}
        </WidgetErrorBoundary>
      </div>
    </div>
  )
}
