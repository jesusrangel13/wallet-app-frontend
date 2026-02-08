'use client'

import { motion } from 'framer-motion'
import {
    ShoppingBag,
    Coffee,
    Car,
    Home,
    Briefcase,
    MoreVertical,
    ChevronRight,
    ShoppingCart,
    Zap,
    Film,
    Heart,
    GraduationCap,
    Plane,
    Laptop,
    TrendingUp,
    DollarSign,
    ArrowLeftRight,
    PiggyBank
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface TransactionCardProps {
    id: string
    type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
    amount: number
    currency: 'CLP' | 'USD' | 'EUR'
    category: string
    categoryIcon?: string
    categoryColor?: string
    description?: string
    payee?: string
    date: Date
    isShared?: boolean
    onEdit?: () => void
    onDelete?: () => void
}

// Mapa de iconos por categoría
const categoryIcons: Record<string, any> = {
    // Gastos
    'food': Coffee,
    'groceries': ShoppingCart,
    'transport': Car,
    'housing': Home,
    'utilities': Zap,
    'entertainment': Film,
    'health': Heart,
    'shopping': ShoppingBag,
    'education': GraduationCap,
    'travel': Plane,

    // Ingresos
    'salary': Briefcase,
    'freelance': Laptop,
    'investment': TrendingUp,
    'other_income': DollarSign,

    // Transferencias
    'transfer': ArrowLeftRight,
    'savings': PiggyBank,
}

export function TransactionCard({
    type,
    amount,
    currency,
    category,
    categoryIcon,
    categoryColor = '#6B7280',
    description,
    payee,
    date,
    isShared,
    onEdit,
}: TransactionCardProps) {
    // Determine the content to render as icon
    const iconKey = categoryIcon || ''
    const LucideIcon = categoryIcons[iconKey]
    const isEmoji = !LucideIcon && iconKey

    const amountColor = {
        EXPENSE: 'text-red-600',
        INCOME: 'text-green-600',
        TRANSFER: 'text-blue-600',
    }[type]

    const amountPrefix = {
        EXPENSE: '-',
        INCOME: '+',
        TRANSFER: '',
    }[type]

    const formattedAmount = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'CLP' ? 0 : 2,
    }).format(amount)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            title="Ver detalles"
            whileHover={{ backgroundColor: 'var(--hover-bg, rgba(0,0,0,0.02))' }}
            className="flex items-center gap-4 p-4 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
            onClick={onEdit}
        >
            {/* Icono de categoría con color */}
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${categoryColor}15` }}
            >
                {LucideIcon ? (
                    <LucideIcon
                        className="w-6 h-6"
                        style={{ color: categoryColor }}
                    />
                ) : (
                    <span className="text-xl leading-none">{isEmoji ? iconKey : <ShoppingBag className="w-6 h-6" style={{ color: categoryColor }} />}</span>
                )}
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {payee || category}
                    </p>
                    {isShared && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full">
                            Compartido
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {description || category}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })}
                </p>
            </div>

            {/* Monto */}
            <div className="text-right flex-shrink-0">
                <p className={`font-semibold ${amountColor}`}>
                    {amountPrefix}{formattedAmount}
                </p>
            </div>

            {/* Chevron (visible on hover) */}
            <ChevronRight className="w-5 h-5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    )
}
