'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { WidgetSelector } from '@/components/WidgetSelector'

export const AddWidgetButton = () => {
  const t = useTranslations('common');
  const [showWidgetSelector, setShowWidgetSelector] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowWidgetSelector(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium text-sm md:px-4 md:py-2"
        title={t('addWidget')}
        aria-label={t('addWidget')}
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('widget')}</span>
      </button>

      {/* Widget selector modal */}
      <WidgetSelector
        isOpen={showWidgetSelector}
        onClose={() => setShowWidgetSelector(false)}
      />
    </>
  )
}
