'use client'

import { motion } from 'framer-motion'
import {
    ShoppingBag,
    Coffee,
    Car,
    Home,
    Briefcase,
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
    isSelected?: boolean
    onToggleSelection?: () => void
    className?: string
}

// ... (keep icon map)

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

import { Check, Circle } from 'lucide-react'

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
    isSelected,
    onToggleSelection,
    className,
}: TransactionCardProps) {
    // Determine the content to render as icon
    const iconKey = categoryIcon || ''
    const MappedIcon = categoryIcons[iconKey]
    const isEmoji = !MappedIcon && iconKey.trim().length > 0

    const amountColor = {
        EXPENSE: 'text-expense',
        INCOME: 'text-income',
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
            className={`
                relative group flex items-center pr-4 transition-all duration-200
                ${className || ''}
                h-[80px]
                ${isSelected ? 'bg-primary/5 border-primary/20' : ''}
                pl-0
                item-glow rounded-2xl
                cursor-pointer
            `}
            onClick={(e) => {
                // For Glass variant, clicking anywhere selects if in selection mode, or opens edit
                // For now, let's keep edit as default click, unless we want selection
                onEdit?.()
            }}
        >
            {/* Icono de categoría con color */}
            <div
                className={`
                    w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer
                    transition-all duration-200
                    mr-4
                `}
                style={{ backgroundColor: `${categoryColor}15` }}
            >
                {MappedIcon ? (
                    <MappedIcon
                        className="w-5 h-5"
                        style={{ color: categoryColor }}
                    />
                ) : (
                    <span className="text-xl leading-none">{isEmoji ? iconKey : <ShoppingBag className="w-5 h-5" style={{ color: categoryColor }} />}</span>
                )}
            </div>

            {/* Info principal */}
            <div className="flex-1 min-w-0 flex flex-col justify-center px-1">
                <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate leading-tight ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-gray-100'}`}>
                        {payee || category}
                    </p>
                    {isShared && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full flex-shrink-0">
                            Compartido
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {description || category} • {date && !isNaN(new Date(date).getTime())
                        ? formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
                        : ''}
                </p>
            </div>

            {/* Monto */}
            <div className="text-right flex-shrink-0 flex flex-col justify-center">
                <p className={`text-base font-semibold ${amountColor}`}>
                    {amountPrefix}{formattedAmount}
                </p>
            </div>

            {/* Chevron (visible on hover) */}
            <ChevronRight className="w-5 h-5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
        </motion.div>
    )
}
