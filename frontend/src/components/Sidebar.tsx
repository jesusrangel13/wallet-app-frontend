'use client'

import { useSidebarStore } from '@/store/sidebarStore'
import { Tooltip } from '@/components/ui/Tooltip'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, Home, CreditCard, TrendingUp, Users, Upload, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  description: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <Home className="w-6 h-6" />, href: '/dashboard', description: 'View your financial overview' },
  { label: 'Accounts', icon: <CreditCard className="w-6 h-6" />, href: '/dashboard/accounts', description: 'Manage your accounts' },
  { label: 'Transactions', icon: <TrendingUp className="w-6 h-6" />, href: '/dashboard/transactions', description: 'View transactions' },
  { label: 'Groups', icon: <Users className="w-6 h-6" />, href: '/dashboard/groups', description: 'Manage shared expenses' },
  { label: 'Import', icon: <Upload className="w-6 h-6" />, href: '/dashboard/import', description: 'Import transactions' },
  { label: 'Settings', icon: <Settings className="w-6 h-6" />, href: '/dashboard/settings', description: 'Manage preferences' },
]

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { isCollapsed, isMobileOpen, toggleCollapse, setMobileOpen } = useSidebarStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNavigate = (href: string) => {
    router.push(href)
    setMobileOpen(false)
  }

  const isActive = (href: string) => {
    // Exact match for dashboard home
    if (href === '/dashboard') {
      return pathname === '/dashboard'
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
        aria-label="Toggle menu"
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
          fixed md:static inset-y-0 left-0 z-40
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
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
              <span className="font-bold text-gray-900">Finance</span>
            </div>
          )}
          {isCollapsed && <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">💰</div>}
          {/* Desktop collapse button */}
          <button
            onClick={toggleCollapse}
            className="hidden md:flex p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
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
                  <button
                    onClick={() => handleNavigate(item.href)}
                    className={`
                      w-full flex items-center justify-center p-3 rounded-lg
                      transition-colors duration-200
                      ${
                        isActive(item.href)
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }
                    `}
                    title={item.label}
                  >
                    {item.icon}
                  </button>
                </Tooltip>
              ) : (
                <button
                  onClick={() => handleNavigate(item.href)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200 text-sm font-medium
                    ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* Footer - Only visible when expanded */}
        {!isCollapsed && (
          <div className="border-t border-gray-200 p-4 text-xs text-gray-500 text-center">
            <p>v1.0.0</p>
          </div>
        )}
      </aside>

    </>
  )
}
