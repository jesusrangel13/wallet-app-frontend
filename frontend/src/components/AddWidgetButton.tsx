'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { WidgetSelector } from '@/components/WidgetSelector'

export const AddWidgetButton = () => {
  const [showWidgetSelector, setShowWidgetSelector] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowWidgetSelector(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm md:px-4 md:py-2"
        title="Add widget"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Widget</span>
      </button>

      {/* Widget selector modal */}
      <WidgetSelector
        isOpen={showWidgetSelector}
        onClose={() => setShowWidgetSelector(false)}
      />
    </>
  )
}
