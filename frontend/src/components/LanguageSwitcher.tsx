'use client'

import { useTransition, useId } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
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

  // Accessibility IDs
  const selectId = useId()
  const helperId = useId()

  const currentLocale = params.locale as Locale

  const languageNames: Record<string, string> = {
    en: t('language.options.en'),
    es: t('language.options.es'),
  }

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return

    startTransition(() => {
      // Build the new pathname with the new locale
      // Remove current locale from pathname if it exists
      let pathWithoutLocale = pathname
      if (pathname.startsWith(`/${currentLocale}/`)) {
        pathWithoutLocale = pathname.slice(`/${currentLocale}`.length)
      } else if (pathname === `/${currentLocale}`) {
        pathWithoutLocale = '/'
      }

      // Add new locale prefix (always add it for explicit routing)
      const newPathname = `/${newLocale}${pathWithoutLocale}`
      router.push(newPathname)
      router.refresh()
    })
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2" role="radiogroup" aria-label={t('language.label')}>
        {SUPPORTED_LOCALES.map((locale) => (
          <button
            type="button"
            key={locale}
            role="radio"
            aria-checked={locale === currentLocale}
            onClick={() => handleLanguageChange(locale)}
            disabled={isPending || locale === currentLocale}
            aria-busy={isPending}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-md transition-colors
              ${locale === currentLocale
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
        {t('language.label')} <span className="text-red-500" aria-hidden="true">*</span>
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={currentLocale}
          onChange={(e) => handleLanguageChange(e.target.value as Locale)}
          disabled={isPending}
          aria-describedby={helperId}
          aria-busy={isPending}
          className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white dark:bg-card text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {SUPPORTED_LOCALES.map((locale) => (
            <option key={locale} value={locale}>
              {languageNames[locale]}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400" aria-hidden="true">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <p id={helperId} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {t('language.helperText')}
      </p>
    </div>
  )
}
