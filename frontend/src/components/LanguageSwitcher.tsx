'use client'

import { useTransition } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { type Locale } from '@/i18n/config'

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact'
}

// Only support en and es for now (Phase 6)
const SUPPORTED_LOCALES: Locale[] = ['en', 'es']

export function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const t = useTranslations('settings')
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const currentLocale = params.locale as Locale

  const languageNames: Record<string, string> = {
    en: t('language.options.en'),
    es: t('language.options.es'),
  }

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return

    startTransition(() => {
      // Replace the locale in the pathname
      const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
      router.push(newPathname)
      router.refresh()
    })
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            disabled={isPending || locale === currentLocale}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-colors
              ${
                locale === currentLocale
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
              ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {t('language.label')} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          value={currentLocale}
          onChange={(e) => handleLanguageChange(e.target.value as Locale)}
          disabled={isPending}
          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {languageNames[locale]}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {t('language.helperText')}
      </p>
    </div>
  )
}
