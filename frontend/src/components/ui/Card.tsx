import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export type CardVariant = 'default' | 'elevated' | 'gradient' | 'glass' | 'highlight'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

const cardVariants: Record<CardVariant, string> = {
  default: 'bg-card border-subtle shadow-sm widget-hover',
  elevated: 'bg-card border-subtle shadow-lg hover:shadow-xl transition-all duration-200',
  gradient: 'bg-gradient-to-br from-card to-muted/50 border-subtle shadow-md widget-hover',
  glass: 'bg-card/80 backdrop-blur-lg border-subtle shadow-lg',
  highlight: 'bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-md widget-hover',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl h-full flex flex-col transition-all duration-200',
          cardVariants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { }

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-border flex items-start justify-between gap-4', className)}
        {...props}
      />
    )
  }
)

CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold text-foreground flex items-center gap-2 flex-1', className)}
        {...props}
      />
    )
  }
)

CardTitle.displayName = 'CardTitle'

interface CardHeaderActionsProps extends HTMLAttributes<HTMLDivElement> { }

export const CardHeaderActions = forwardRef<HTMLDivElement, CardHeaderActionsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-1.5 flex-shrink-0', className)}
        {...props}
      />
    )
  }
)

CardHeaderActions.displayName = 'CardHeaderActions'

interface CardContentProps extends HTMLAttributes<HTMLDivElement> { }

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-6 flex-1 flex flex-col', className)}
        {...props}
      />
    )
  }
)

CardContent.displayName = 'CardContent'
