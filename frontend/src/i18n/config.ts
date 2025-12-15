/**
 * i18n Configuration
 * Defines supported locales, default locale, and locale metadata
 */

export const locales = ['es', 'en', 'fr', 'pt', 'it', 'de'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

/**
 * Human-readable names for each locale
 */
export const localeNames: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
  pt: 'Português',
  it: 'Italiano',
  de: 'Deutsch',
};

/**
 * Flag emojis for each locale
 */
export const localeFlags: Record<Locale, string> = {
  es: '🇪🇸',
  en: '🇺🇸',
  fr: '🇫🇷',
  pt: '🇵🇹',
  it: '🇮🇹',
  de: '🇩🇪',
};
