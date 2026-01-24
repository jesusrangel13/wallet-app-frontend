'use client'

import { useSidebarStore } from '@/store/sidebarStore'
import { Tooltip } from '@/components/ui/Tooltip'
import { useRouter, usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, Home, CreditCard, TrendingUp, Users, Upload, Settings, HandCoins } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/ThemeToggle'

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
        type="button"
        onClick={() => setMobileOpen(!isMobileOpen)}
        className="md:hidden fixed bottom-24 right-6 z-50 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover transition-colors"
        aria-label={t('toggleMenu')}
        aria-expanded={isMobileOpen}
        aria-controls="sidebar-nav"
      >
        {isMobileOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
      </button>

      {/* Mobile Overlay - Only visible on small screens */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-nav"
        role="navigation"
        aria-label={t('appName')}
        className={`
          fixed inset-y-0 left-0 z-40
          bg-card border-r border-border
          transition-all duration-300 ease-in-out
          h-screen overflow-y-auto
          ${isCollapsed ? 'md:w-16' : 'md:w-64'}
          ${isMobileOpen ? 'w-64' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                💰
              </div>
              <span className="font-bold text-foreground">{t('appName')}</span>
            </div>
          )}
          {isCollapsed && <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white text-sm">💰</div>}
          {/* Desktop collapse button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 hover:bg-muted rounded-lg transition-colors"
            aria-label={t('toggleSidebar')}
            aria-expanded={!isCollapsed}
            title={t('toggleSidebar')}
          >
            <Menu className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-2" aria-label="Main navigation">
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
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted'
                      }
                    `}
                    title={item.label}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </Tooltip>
              ) : (
                <Link
                  href={item.href}
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200 text-sm font-medium
                    ${isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted'
                    }
                  `}
                >
                  <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="border-t border-border p-4">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{t('version')}</p>
              <ThemeToggle size="sm" />
            </div>
          ) : (
            <div className="flex justify-center">
              <ThemeToggle size="sm" />
            </div>
          )}
        </div>
      </aside>

    </>
  )
}
