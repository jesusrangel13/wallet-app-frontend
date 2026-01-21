const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Optimización para deployment en Vercel (solo en producción)
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Optimizaciones de producción
  compress: true,
  poweredByHeader: false,

  // OPT-8: Bundle splitting optimizations
  // Optimize imports for heavy libraries to enable better tree-shaking
  // This tells Next.js to only import the specific exports used, not the entire library
  experimental: {
    optimizePackageImports: [
      'recharts',           // ~200KB - Chart library used in widgets
      'lucide-react',       // Icon library - only import used icons
      'date-fns',           // Date utilities - only import used functions
      'framer-motion',      // Animation library
    ],
  },

  // OPT-9: Configuración segura de imágenes remotas
  // Restricted to specific trusted domains for security (avoid '**' wildcard)
  images: {
    remotePatterns: [
      // Google OAuth avatars (Google accounts profile pictures)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      // Gravatar (common avatar service)
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        pathname: '/avatar/**',
      },
      {
        protocol: 'https',
        hostname: 'secure.gravatar.com',
        pathname: '/avatar/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/avatar/**',
      },
      // UI Avatars (generated avatars service)
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
        pathname: '/api/**',
      },
      // Cloudinary (if used for image hosting)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      // AWS S3 (if used for file uploads)
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
    ],
    // Modern formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Responsive image sizes optimized for avatars and UI elements
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache optimization
    minimumCacheTTL: 60 * 60 * 24, // 24 hours cache for avatars
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

module.exports = withNextIntl(withBundleAnalyzer(withPWA(nextConfig)))
