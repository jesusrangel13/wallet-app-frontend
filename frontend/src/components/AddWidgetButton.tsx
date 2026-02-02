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
        className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm md:px-4 md:py-2 shadow-sm"
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
