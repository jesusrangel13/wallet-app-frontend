'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Settings } from 'lucide-react'

const getSettingsTabs = (locale: string) => [
  {
    id: 'general',
    translationKey: 'tabs.general',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    href: `/${locale}/dashboard/settings`,
  },
  {
    id: 'categories',
    translationKey: 'tabs.categories',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
        />
      </svg>
    ),
    href: `/${locale}/dashboard/settings/categories`,
  },
  {
    id: 'tags',
    translationKey: 'tabs.tags',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
        />
      </svg>
    ),
    href: `/${locale}/dashboard/settings/tags`,
  },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string
  const t = useTranslations('settings')

  const SETTINGS_TABS = getSettingsTabs(locale)

  return (
    <div className="h-full">
      {/* Header with Title */}
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <Settings className="h-8 w-8 text-blue-600" />
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('description')}</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {SETTINGS_TABS.map((tab) => {
            const isActive = pathname === tab.href
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`group inline-flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span
                  className={`transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                >
                  {tab.icon}
                </span>
                {t(tab.translationKey)}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="pb-6">
        {children}
      </div>
    </div>
  )
}
