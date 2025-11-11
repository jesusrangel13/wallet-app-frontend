'use client'

import { useDashboardStore } from '@/store/dashboardStore'
import { dashboardPreferenceAPI } from '@/lib/api'
import { toast } from 'sonner'
import { Edit3, Save, RotateCcw, X, Plus } from 'lucide-react'
import { useState } from 'react'

interface EditDashboardButtonsProps {
  onAddWidget?: () => void
}

export const EditDashboardButtons = ({ onAddWidget }: EditDashboardButtonsProps) => {
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
      <button
        onClick={toggleEditMode}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm md:px-4 md:py-2"
        title="Edit dashboard"
      >
        <Edit3 className="w-4 h-4" />
        <span className="hidden sm:inline">Edit</span>
      </button>
    )
  }

  // Edit mode - show toolbar buttons (compact for navbar)
  return (
    <div className="flex items-center gap-1">
      {/* Add Widget Button */}
      {onAddWidget && (
        <button
          onClick={onAddWidget}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-xs md:text-sm md:px-3 md:py-2"
          title="Add widget"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium text-xs md:text-sm md:px-3 md:py-2"
        title="Save changes"
      >
        <Save className="w-4 h-4" />
        <span className="hidden sm:inline">Save</span>
      </button>

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium text-xs md:text-sm md:px-3 md:py-2"
        title="Reset to default layout"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden sm:inline">Reset</span>
      </button>

      {/* Cancel Button */}
      <button
        onClick={handleCancel}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors font-medium text-xs md:text-sm md:px-3 md:py-2"
        title="Cancel editing"
      >
        <X className="w-4 h-4" />
        <span className="hidden sm:inline">Cancel</span>
      </button>
    </div>
  )
}
