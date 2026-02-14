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
                bg-white/5 dark:bg-black/20 backdrop-blur-2xl
                border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
                rounded-[2.5rem]
                transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                h-[calc(100vh-2rem)] overflow-hidden flex flex-col
                ${widthClass}
                hidden md:flex
            `}
        >
            {/* Header */}
            <div className={`relative flex items-center justify-center h-24 shrink-0 transition-all duration-500 ${isCollapsed ? 'px-0' : 'px-6'}`}>
                {!isCollapsed && (
                    <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-300">
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <img src="/clair_logo.png" alt="Clair Logo" className="w-full h-full object-cover block dark:hidden" />
                            <img src="/clair_logo_darkmode.png" alt="Clair Logo" className="w-full h-full object-cover hidden dark:block" />
                        </div>
                        <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-400 tracking-tight">Clair</span>
                    </div>
                )}
                {isCollapsed && (
                    <button
                        onClick={toggleCollapse}
                        className="relative w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:scale-105 transition-transform"
                    >
                        <img src="/clair_logo.png" alt="Clair Logo" className="w-full h-full object-cover block dark:hidden" />
                        <img src="/clair_logo_darkmode.png" alt="Clair Logo" className="w-full h-full object-cover hidden dark:block" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="relative flex-1 px-4 py-4 space-y-3 overflow-y-auto scrollbar-hide flex flex-col items-center">
                {navItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                        <div key={item.href} className="w-full flex justify-center px-2">
                            {isCollapsed ? (
                                <Tooltip content={item.label} side="right">
                                    <Link
                                        href={item.href}
                                        className={`
                                            relative flex items-center justify-center
                                            w-12 h-12 rounded-2xl
                                            transition-all duration-300 ease-out
                                            group
                                            ${active
                                                ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 text-white shadow-[0_0_25px_rgba(129,140,248,0.6)] scale-110'
                                                : 'text-slate-600 dark:text-slate-400 hover:scale-110'}
                                        `}
                                    >
                                        <item.icon className={`w-5 h-5 relative z-10 transition-colors duration-300 ${!active && 'group-hover:text-indigo-600 dark:group-hover:text-cyan-400'}`} />

                                        {/* Active State Background/Glow */}
                                        {active && (
                                            <div className="absolute inset-0 rounded-2xl bg-white/20 blur-md -z-10 animate-pulse" />
                                        )}

                                        {/* Hover State - Glass (Light) & Neon (Dark) */}
                                        {!active && (
                                            <>
                                                {/* Light Mode: Glassy white background */}
                                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/60 dark:bg-transparent shadow-lg dark:shadow-none border border-white/40 dark:border-none -z-10" />

                                                {/* Dark Mode: Neon Glow */}
                                                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-cyan-500/10 dark:shadow-[0_0_20px_rgba(34,211,238,0.5)] -z-10 hidden dark:block" />
                                            </>
                                        )}
                                    </Link>
                                </Tooltip>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={`
                                        group relative w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl
                                        transition-all duration-300 ease-out overflow-hidden
                                        ${active
                                            ? 'text-white shadow-[0_0_30px_rgba(99,102,241,0.4)] ring-1 ring-white/20'
                                            : 'text-slate-600 dark:text-slate-400'}
                                    `}
                                >
                                    {active && (
                                        <>
                                            {/* Active Indicator Bar */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 bg-indigo-600 dark:bg-cyan-400 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.6)] dark:shadow-[0_0_12px_cyan] z-20" />

                                            {/* Gradient Background */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 opacity-100" />

                                            {/* Glow Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-300 blur-xl opacity-40" />

                                            {/* Shine Effect */}
                                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                                        </>
                                    )}

                                    {/* Hover Effect for Inactive */}
                                    {!active && (
                                        <>
                                            {/* Light Mode: Glass Effect */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/60 dark:bg-transparent -z-10 border border-white/50 dark:border-none shadow-sm dark:shadow-none" />

                                            {/* Dark Mode: Neon Gradient/Glow */}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 blur-md dark:shadow-[0_0_15px_rgba(34,211,238,0.3)] -z-10 hidden dark:block" />
                                        </>
                                    )}

                                    <item.icon className={`w-5 h-5 relative z-10 transition-transform duration-300 
                                        ${active ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110'} 
                                        ${!active && 'group-hover:text-indigo-600 dark:group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] dark:group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'}
                                    `} />

                                    <span className={`tracking-wide text-sm relative z-10 font-medium transition-colors duration-300
                                        ${active ? 'text-white' : 'group-hover:text-indigo-900 dark:group-hover:text-cyan-100'}
                                    `}>
                                        {item.label}
                                    </span>
                                </Link>
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="relative p-6 shrink-0 flex flex-col items-center gap-4">
                <button
                    onClick={toggleCollapse}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-300 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:scale-105"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <Menu className="w-5 h-5" />
                </button>
            </div>
        </aside>
    )
}
