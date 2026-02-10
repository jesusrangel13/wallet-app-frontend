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
import { Card } from '@/components/ui/Card'
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
        <Card className="p-0 overflow-hidden h-full dark:bg-card dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Insights Inteligentes
                </h3>
            </div>

            <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[300px] overflow-y-auto scrollbar-hide">
                {insights.map((insight, index) => {
                    const isAi = insight.isAi;
                    const isExpanded = expandedIds.includes(insight.id);

                    // Si es IA, forzamos estilos especiales, si no, usamos el tipo normal
                    const style = isAi ? {
                        icon: Sparkles,
                        iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                        iconColor: 'text-indigo-600 dark:text-indigo-400',
                        borderColor: 'border-l-indigo-500',
                    } : (insightStyles[insight.type] || insightStyles.tip)

                    const Icon = style.icon
                    const hoverClass = isAi
                        ? 'hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50';

                    return (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => toggleExpand(insight.id, !!isAi)}
                            className={`p-4 border-l-4 ${style.borderColor} ${hoverClass} transition-colors cursor-pointer group`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${style.iconBg} dark:bg-gray-800 flex-shrink-0`}>
                                    <Icon className={`w-4 h-4 ${style.iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 dark:text-gray-200 text-sm">{insight.title}</p>
                                            {isAi && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                    IA
                                                </span>
                                            )}
                                        </div>
                                        {/* Chevron helper only visible on hover or if expanded, for AI mainly as they are long */}
                                        <div className={`text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ${isExpanded ? 'rotate-90 opacity-100' : ''}`}>
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </div>

                                    <p className={`text-sm text-gray-600 dark:text-gray-400 mt-0.5 ${isExpanded ? '' : 'line-clamp-2'}`}>
                                        {insight.description}
                                    </p>

                                    {insight.action && (
                                        <Link
                                            href={insight.action.href}
                                            onClick={(e) => e.stopPropagation()} // Prevent expand when clicking link
                                        >
                                            <button className="mt-2 text-xs text-primary dark:text-primary-foreground font-medium flex items-center gap-1 hover:gap-2 transition-all">
                                                {insight.action.label}
                                                <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </Card>
    )
}
