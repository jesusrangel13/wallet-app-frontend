'use client'

import { useState } from 'react'

import { motion } from 'framer-motion'
import {
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    PiggyBank,
    ArrowRight,
    Sparkles
} from 'lucide-react'
import { ClairCard } from '@/components/ui/ClairCard'
import Link from 'next/link'

export interface Insight {
    id: string
    type: 'positive' | 'warning' | 'tip' | 'achievement'
    title: string
    description: string
    isAi?: boolean
    action?: {
        label: string
        href: string
    }
}

const insightStyles = {
    positive: {
        icon: TrendingUp,
        iconBg: 'bg-green-100',
        iconColor: 'text-income',
        borderColor: 'border-l-green-500',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        borderColor: 'border-l-amber-500',
    },
    tip: {
        icon: Lightbulb,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        borderColor: 'border-l-blue-500',
    },
    achievement: {
        icon: PiggyBank,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        borderColor: 'border-l-purple-500',
    },
}

interface SmartInsightsWidgetProps {
    insights: Insight[]
}

export function SmartInsightsWidget({ insights }: SmartInsightsWidgetProps) {
    const [expandedIds, setExpandedIds] = useState<string[]>([])

    if (!insights || insights.length === 0) return null

    const toggleExpand = (id: string, isAi: boolean) => {
        // Option 1: Only allow AI to expand? User said "the AI ones are long". 
        // But good UX is to allow any to expand if desired. Let's allow all.
        setExpandedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        )
    }

    return (
        <ClairCard className="h-full flex flex-col group">
            {/* Background decorations handled by ClairCard internally or we can override if needed */}

            <div className="px-6 py-4 border-b border-white/20 dark:border-white/10 relative z-10">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500 drop-shadow-lg" />
                    Insights Inteligentes
                </h3>
            </div>

            <div className="divide-y divide-white/20 dark:divide-white/10 max-h-[300px] overflow-y-auto scrollbar-hide relative z-10">
                {insights.map((insight, index) => {
                    const isAi = insight.isAi;
                    const isExpanded = expandedIds.includes(insight.id);

                    // Si es IA, forzamos estilos especiales, si no, usamos el tipo normal
                    const style = isAi ? {
                        icon: Sparkles,
                        iconBg: 'bg-indigo-100/50 dark:bg-indigo-900/40 backdrop-blur-md',
                        iconColor: 'text-indigo-600 dark:text-indigo-400',
                        borderColor: 'border-l-indigo-500',
                    } : (insightStyles[insight.type] || insightStyles.tip)

                    const Icon = style.icon
                    const hoverClass = isAi
                        ? 'hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'
                        : 'hover:bg-white/40 dark:hover:bg-white/10';

                    return (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => toggleExpand(insight.id, !!isAi)}
                            className={`p-4 border-l-4 ${style.borderColor} ${hoverClass} transition-colors cursor-pointer group backdrop-blur-sm`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${style.iconBg} ${!isAi ? 'bg-white/50 dark:bg-black/40' : ''} flex-shrink-0 backdrop-blur-md shadow-sm`}>
                                    <Icon className={`w-4 h-4 ${style.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-slate-900 dark:text-gray-100 text-sm shadow-sm">{insight.title}</p>
                                            {isAi && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 backdrop-blur-sm">
                                                    IA
                                                </span>
                                            )}
                                        </div>
                                        {/* Chevron helper */}
                                        <div className={`text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-all ${isExpanded ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'}`}>
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </div>

                                    <p className={`text-sm text-slate-600 dark:text-slate-300 mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                        {insight.description}
                                    </p>

                                    {insight.action && isExpanded && (
                                        <div className="mt-3 flex justify-end">
                                            <Link
                                                href={insight.action.href}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button className="px-3 py-1.5 rounded-lg bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 border border-white/20 text-xs font-medium text-primary dark:text-white transition-all shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                                                    {insight.action.label}
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </ClairCard>
    )
}
