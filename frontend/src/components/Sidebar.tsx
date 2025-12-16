'use client'

import { useSidebarStore } from '@/store/sidebarStore'
import { Tooltip } from '@/components/ui/Tooltip'
import { useRouter, usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Home, CreditCard, TrendingUp, Users, Upload, Settings, HandCoins } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'

interface NavItem {
  labelKey: string
  icon: React.ReactNode
  path: string
  descriptionKey: string
}

const baseNavItems: NavItem[] = [
  { labelKey: 'dashboard', icon: <Home className="w-6 h-6" />, path: 'dashboard', descriptionKey: 'dashboardDescription' },
  { labelKey: 'accounts', icon: <CreditCard className="w-6 h-6" />, path: 'dashboard/accounts', descriptionKey: 'accountsDescription' },
  { labelKey: 'transactions', icon: <TrendingUp className="w-6 h-6" />, path: 'dashboard/transactions', descriptionKey: 'transactionsDescription' },
  { labelKey: 'loans', icon: <HandCoins className="w-6 h-6" />, path: 'dashboard/loans', descriptionKey: 'loansDescription' },
  { labelKey: 'groups', icon: <Users className="w-6 h-6" />, path: 'dashboard/groups', descriptionKey: 'groupsDescription' },
  { labelKey: 'import', icon: <Upload className="w-6 h-6" />, path: 'dashboard/import', descriptionKey: 'importDescription' },
  { labelKey: 'settings', icon: <Settings className="w-6 h-6" />, path: 'dashboard/settings', descriptionKey: 'settingsDescription' },
]

export function Sidebar() {
  const t = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string || 'es'
  const { isCollapsed, isMobileOpen, toggleCollapse, setMobileOpen } = useSidebarStore()
  const [mounted, setMounted] = useState(false)

  // Create nav items with locale prefix and translations
  const navItems = useMemo(() => {
    return baseNavItems.map(item => ({
      ...item,
      label: t(item.labelKey as any),
      description: t(item.descriptionKey as any),
      href: `/${locale}/${item.path}`
    }))
  }, [locale, t])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNavigate = (href: string) => {
    router.push(href)
    setMobileOpen(false)
  }

  const isActive = (href: string) => {
    // Exact match for dashboard home
    if (href.endsWith('/dashboard')) {
      return pathname === href
    }
    // For other routes, check if pathname starts with href
    return pathname === href || pathname.startsWith(href + '/')
  }

  if (!mounted) return null

  return (
    <>
      {/* Mobile Menu Button - Only visible on small screens */}
      <button
        onClick={() => setMobileOpen(!isMobileOpen)}
        className="md:hidden fixed bottom-24 right-6 z-50 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label={t('toggleMenu')}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay - Only visible on small screens */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          h-screen overflow-y-auto
          ${isCollapsed ? 'md:w-16' : 'md:w-64'}
          ${isMobileOpen ? 'w-64' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                💰
              </div>
              <span className="font-bold text-gray-900">{t('appName')}</span>
            </div>
          )}
          {isCollapsed && <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">💰</div>}
          {/* Desktop collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('toggleSidebar')}
            title={t('toggleSidebar')}
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          {navItems.map((item) => (
            <div key={item.href}>
              {isCollapsed ? (
                <Tooltip content={item.label} side="right">
                  <Link
                    href={item.href}
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      w-full flex items-center justify-center p-3 rounded-lg
                      transition-colors duration-200
                      ${isActive(item.href)
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                    title={item.label}
                  >
                    {item.icon}
                  </Link>
                </Tooltip>
              ) : (
                <Link
                  href={item.href}
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200 text-sm font-medium
                    ${isActive(item.href)
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer - Only visible when expanded */}
        {!isCollapsed && (
          <div className="border-t border-gray-200 p-4 text-xs text-gray-500 text-center">
            <p>{t('version')}</p>
          </div>
        )}
      </aside>

    </>
  )
}
