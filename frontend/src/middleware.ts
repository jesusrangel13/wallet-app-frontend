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

  // Always show locale in URL (e.g., /es/dashboard, /en/dashboard)
  localePrefix: 'always',

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
