/**
 * Request-scoped i18n configuration for Next.js App Router
 * This file loads the appropriate messages for each locale
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  // The middleware already validates locales, so we just need to load the messages
  // If locale is not provided, default to the default locale
  const validLocale = (locale && locales.includes(locale as Locale)) ? locale : 'es';

  return {
    locale: validLocale as string,
    messages: (await import(`../../messages/${validLocale}.json`)).default
  };
});
