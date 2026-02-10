import { cn } from '@/lib/utils'

interface TypographyProps {
    children: React.ReactNode
    className?: string
}

export function BalanceHero({ children, className }: TypographyProps) {
    return (
        <span className={cn('text-balance-hero font-numeric', className)}>
            {children}
        </span>
    )
}

export function BalanceLarge({ children, className }: TypographyProps) {
    return (
        <span className={cn('text-balance-large font-numeric', className)}>
            {children}
        </span>
    )
}

export function BalanceMedium({ children, className }: TypographyProps) {
    return (
        <span className={cn('text-balance-medium font-numeric', className)}>
            {children}
        </span>
    )
}

export function MetricLabel({ children, className }: TypographyProps) {
    return (
        <span className={cn('text-metric-label', className)}>
            {children}
        </span>
    )
}
