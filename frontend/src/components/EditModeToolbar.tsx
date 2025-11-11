'use client'

import { useDashboardStore } from '@/store/dashboardStore'
import { dashboardPreferenceAPI } from '@/lib/api'
import { toast } from 'sonner'
import { Edit3, Save, RotateCcw, X, Plus } from 'lucide-react'
import { useState } from 'react'

interface EditModeToolbarProps {
  onAddWidget?: () => void
}

export const EditModeToolbar = ({ onAddWidget }: EditModeToolbarProps) => {
  const { isEditMode, toggleEditMode, layout, widgets, resetToDefaults } = useDashboardStore()
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await dashboardPreferenceAPI.savePreferences(widgets, layout)
      toast.success('Dashboard saved successfully')
      toggleEditMode()
    } catch (error) {
      console.error('Error saving dashboard:', error)
      toast.error('Failed to save dashboard')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    toggleEditMode()
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default layout? This cannot be undone.')) {
      dashboardPreferenceAPI.resetToDefaults()
        .then((res) => {
          resetToDefaults(res.data.data)
          toast.success('Dashboard reset to default')
          toggleEditMode()
        })
        .catch((error) => {
          console.error('Error resetting dashboard:', error)
          toast.error('Failed to reset dashboard')
        })
    }
  }

  // View mode - show edit button
  if (!isEditMode) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggleEditMode}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Edit3 className="w-4 h-4" />
          Edit Dashboard
        </button>
      </div>
    )
  }

  // Edit mode - show toolbar with multiple buttons
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 flex items-center gap-2">
        {/* Add Widget Button */}
        {onAddWidget && (
          <button
            onClick={onAddWidget}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium text-sm"
            title="Add widget"
          >
            <Plus className="w-4 h-4" />
            Add Widget
          </button>
        )}

        {/* Divider */}
        {onAddWidget && <div className="w-px h-6 bg-gray-300"></div>}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-sm"
          title="Save changes"
        >
          <Save className="w-4 h-4" />
          Save
        </button>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-medium text-sm"
          title="Reset to default layout"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors font-medium text-sm"
          title="Cancel editing"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 text-center mt-2">
        Drag to move • Resize corners to resize • Click X to remove
      </p>
    </div>
  )
}
