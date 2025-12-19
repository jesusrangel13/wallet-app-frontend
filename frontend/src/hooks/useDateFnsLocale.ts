import { useLocale } from 'next-intl'
import { es, enUS, de, fr, it, pt } from 'date-fns/locale'
import type { Locale } from 'date-fns'

/**
 * Hook to get the appropriate date-fns locale based on the current app locale
 * @returns date-fns Locale object for use with date-fns functions
 */
export function useDateFnsLocale(): Locale {
  const locale = useLocale()

  const locales: Record<string, Locale> = {
    es,
    en: enUS,
    de,
    fr,
    it,
    pt
  }

  return locales[locale] || enUS
}
