/**
 * Next.js Middleware for i18n routing
 * Handles locale detection and URL-based routing for internationalization
 */

import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Only show locale in URL for non-default locales (e.g., /dashboard for Spanish, /en/dashboard for English)
  localePrefix: 'as-needed',

  // Auto-detect user's preferred locale from browser settings
  localeDetection: true,
});

export const config = {
  // Match all pathnames except for:
  // - /api (API routes)
  // - /_next (Next.js internals)
  // - Static files (with file extensions)
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
