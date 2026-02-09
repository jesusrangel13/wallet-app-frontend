'use client'

import { motion } from 'framer-motion'
import {
    Wallet,
    TrendingUp,
    Users,
    PiggyBank,
    FileText,
    Plus,
    Search,
    LayoutGrid,
    Tags
} from 'lucide-react'
import { Button } from './Button'

export type EmptyStateType = 'transactions' | 'accounts' | 'groups' | 'loans' | 'widgets' | 'search' | 'categories' | 'tags'

interface EmptyStateProps {
    type: EmptyStateType
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
    icon?: React.ElementType
    children?: React.ReactNode
}

const illustrations = {
    transactions: {
        icon: TrendingUp,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        iconColor: 'text-blue-500 dark:text-blue-400',
    },
    accounts: {
        icon: Wallet,
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        iconColor: 'text-green-500 dark:text-green-400',
    },
    groups: {
        icon: Users,
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        iconColor: 'text-purple-500 dark:text-purple-400',
    },
    loans: {
        icon: PiggyBank,
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        iconColor: 'text-amber-500 dark:text-amber-400',
    },
    widgets: {
        icon: LayoutGrid,
        bgColor: 'bg-gray-50 dark:bg-gray-800/50',
        iconColor: 'text-gray-500 dark:text-gray-400',
    },
    search: {
        icon: Search,
        bgColor: 'bg-gray-50 dark:bg-gray-800/50',
        iconColor: 'text-gray-400 dark:text-gray-500',
    },
    categories: {
        icon: FileText,
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        iconColor: 'text-indigo-500 dark:text-indigo-400',
    },
    tags: {
        icon: Tags,
        bgColor: 'bg-pink-50 dark:bg-pink-900/20',
        iconColor: 'text-pink-500 dark:text-pink-400',
    }
}

export function EmptyState({
    type,
    title,
    description,
    actionLabel,
    onAction,
    icon,
    children
}: EmptyStateProps) {
    const defaultStyles = illustrations[type]
    const Icon = icon || defaultStyles.icon
    const { bgColor, iconColor } = defaultStyles

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 text-center w-full"
            role="region"
            aria-label={title}
        >
            {/* Ilustración animada */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className={`w-24 h-24 rounded-full ${bgColor} flex items-center justify-center mb-6`}
            >
                <motion.div
                    animate={{
                        y: [0, -5, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                >
                    <Icon className={`w-12 h-12 ${iconColor}`} />
                </motion.div>
            </motion.div>

            {/* Texto */}
            <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
                {title}
            </motion.h3>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-500 dark:text-gray-400 max-w-sm mb-6 leading-relaxed"
            >
                {description}
            </motion.p>

            {/* Reference for children or CTA */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                {children ? (
                    children
                ) : actionLabel && onAction ? (
                    <Button onClick={onAction} size="lg" className="shadow-lg hover:shadow-xl transition-all">
                        <Plus className="w-5 h-5 mr-2" />
                        {actionLabel}
                    </Button>
                ) : null}
            </motion.div>
        </motion.div>
    )
}
