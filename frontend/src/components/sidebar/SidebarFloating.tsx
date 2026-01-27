'use client'

import { useSidebarStore } from '@/store/sidebarStore'
import { Tooltip } from '@/components/ui/Tooltip'
import { useRouter, usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useSidebarNavigation } from './useSidebarNavigation'

export function SidebarFloating() {
    const router = useRouter()
    const pathname = usePathname()
    const params = useParams()
    const locale = params.locale as string || 'es'
    const { isCollapsed, toggleCollapse } = useSidebarStore()
    const navItems = useSidebarNavigation(locale)

    const isActive = (href: string) => {
        if (href.endsWith('/dashboard')) return pathname === href
        return pathname === href || pathname.startsWith(href + '/')
    }

    // Floating width: larger when open
    const widthClass = isCollapsed ? 'w-20' : 'w-72'

    return (
        <aside
            id="sidebar-floating"
            className={`
                fixed inset-y-0 left-0 z-40 my-4 ml-4
                bg-card/80 backdrop-blur-xl
                border border-border shadow-2xl
                rounded-3xl
                transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                h-[calc(100vh-2rem)] overflow-hidden flex flex-col
                ${widthClass}
                hidden md:flex
            `}
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between h-20 px-6 shrink-0">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/30">
                            F
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-foreground tracking-tight">Finance</span>
                            <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">Premium</span>
                        </div>
                    </div>
                )}
                {isCollapsed && (
                    <button
                        onClick={toggleCollapse}
                        className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto shadow-primary/20 hover:scale-105 transition-transform"
                    >
                        F
                    </button>
                )}

                {!isCollapsed && (
                    <button
                        type="button"
                        onClick={toggleCollapse}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                        <Menu className="w-5 h-5 text-muted-foreground" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="relative flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                        <div key={item.href}>
                            {isCollapsed ? (
                                <Tooltip content={item.label} side="right">
                                    <Link
                                        href={item.href}
                                        className={`
                                            w-12 h-12 flex items-center justify-center rounded-2xl mx-auto mb-2
                                            transition-all duration-300
                                            ${active
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110'
                                                : 'text-muted-foreground hover:bg-muted hover:scale-105'}
                                        `}
                                    >
                                        <item.icon className="w-5 h-5" />
                                    </Link>
                                </Tooltip>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`
                                        group relative w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl
                                        transition-all duration-300
                                        ${active
                                            ? 'text-primary font-semibold bg-primary/10'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                                    `}
                                >
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                    )}
                                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    <span className="tracking-wide text-sm">{item.label}</span>
                                </Link>
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="relative p-6 shrink-0 border-t border-dashed border-border flex justify-center">
                {isCollapsed && (
                    <button onClick={toggleCollapse} className="p-2 hover:bg-muted rounded-xl transition-colors" aria-label="Expand">
                        <Menu className="w-5 h-5 text-muted-foreground" />
                    </button>
                )}
                {!isCollapsed && (
                    <p className="text-xs text-muted-foreground text-center w-full">v1.0.0</p>
                )}
            </div>
        </aside>
    )
}
