import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n/config'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import '../globals.css'
import '@/styles/dashboard-grid.css'

// OPT-9: Optimized font loading configuration
// - display: 'swap' ensures text is visible immediately with fallback font
// - preload: true (default) ensures font is preloaded for faster LCP
// - variable: CSS variable for flexible font usage
// - fallback: explicit fallback fonts for better CLS
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })

  return {
    title: t('app.title'),
    description: t('app.description'),
    manifest: '/manifest.json',
    icons: {
      icon: '/icon-192x192.png',
      apple: '/icon-192x192.png',
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Load messages for the locale
  const messages = await getMessages({ locale })

  return (
    <html lang={locale}>
      <body className={`${inter.variable} ${inter.className}`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <ErrorBoundary>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white text-blue-600 px-4 py-2 rounded-md shadow-lg"
              >
                Skip to main content
              </a>
              <div id="main-content">{children}</div>
            </ErrorBoundary>
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
