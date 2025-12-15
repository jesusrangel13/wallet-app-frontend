/**
 * Request-scoped i18n configuration for Next.js App Router
 * This file loads the appropriate messages for each locale
 */

import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from './config';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: {
      // Load all namespaces for the given locale
      ...(await import(`./messages/${locale}/common.json`)).default,
      ...(await import(`./messages/${locale}/navigation.json`)).default,
      ...(await import(`./messages/${locale}/auth.json`)).default,
      ...(await import(`./messages/${locale}/widgets.json`)).default,
      ...(await import(`./messages/${locale}/forms.json`)).default,
      ...(await import(`./messages/${locale}/validation.json`)).default,
      ...(await import(`./messages/${locale}/notifications.json`)).default,
      ...(await import(`./messages/${locale}/transactions.json`)).default,
      ...(await import(`./messages/${locale}/accounts.json`)).default,
      ...(await import(`./messages/${locale}/categories.json`)).default,
      ...(await import(`./messages/${locale}/groups.json`)).default,
      ...(await import(`./messages/${locale}/loans.json`)).default,
      ...(await import(`./messages/${locale}/settings.json`)).default,
      ...(await import(`./messages/${locale}/errors.json`)).default,
    },
  };
});
