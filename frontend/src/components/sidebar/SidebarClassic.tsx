'use client'

import { useSidebarStore } from '@/store/sidebarStore'
import { Tooltip } from '@/components/ui/Tooltip'
import { useRouter, usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useSidebarNavigation } from './useSidebarNavigation'

export function SidebarClassic() {
    const router = useRouter()
    const pathname = usePathname()
    const params = useParams()
    const locale = params.locale as string || 'es'
    const { isCollapsed, toggleCollapse, setMobileOpen } = useSidebarStore()
    const navItems = useSidebarNavigation(locale)

    const isActive = (href: string) => {
        if (href.endsWith('/dashboard')) return pathname === href
        return pathname === href || pathname.startsWith(href + '/')
    }

    return (
        <aside
            id="sidebar-classic"
            className={`
                fixed inset-y-0 left-0 z-40
                bg-card border-r border-border
                transition-all duration-300 ease-in-out
                h-screen overflow-y-auto w-64
                ${isCollapsed ? 'md:w-16' : 'md:w-64'}
                hidden md:flex flex-col
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
                {!isCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                            <img src="/clair_logo.png" alt="Clair Logo" className="w-full h-full object-cover block dark:hidden" />
                            <img src="/clair_logo_darkmode.png" alt="Clair Logo" className="w-full h-full object-cover hidden dark:block" />
                        </div>
                        <span className="font-bold text-foreground">Clair</span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center mx-auto">
                        <img src="/clair_logo.png" alt="Clair Logo" className="w-full h-full object-cover block dark:hidden" />
                        <img src="/clair_logo_darkmode.png" alt="Clair Logo" className="w-full h-full object-cover hidden dark:block" />
                    </div>
                )}

                <button
                    type="button"
                    onClick={toggleCollapse}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                    aria-label="Toggle Sidebar"
                >
                    <Menu className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <div key={item.href}>
                        {isCollapsed ? (
                            <Tooltip content={item.label} side="right">
                                <Link
                                    href={item.href}
                                    className={`
                                        w-full flex items-center justify-center p-3 rounded-lg
                                        transition-colors duration-200
                                        ${isActive(item.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}
                                    `}
                                >
                                    <item.icon className="w-5 h-5" />
                                </Link>
                            </Tooltip>
                        ) : (
                            <Link
                                href={item.href}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                                    transition-colors duration-200 text-sm font-medium
                                    ${isActive(item.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}
                                `}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-border p-4 shrink-0">
                {!isCollapsed && <p className="text-xs text-muted-foreground text-center">v1.0.0</p>}
            </div>
        </aside>
    )
}
