import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white rounded-lg shadow-md border border-gray-200 h-full flex flex-col', className)}
        {...props}
      />
    )
  }
)

Card.displayName = 'Card'

export const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4', className)}
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
        className={cn('text-lg font-semibold text-gray-900 flex items-center gap-2 flex-1', className)}
        {...props}
      />
    )
  }
)

CardTitle.displayName = 'CardTitle'

export const CardHeaderActions = forwardRef<HTMLDivElement, CardProps>(
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

export const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 flex-1 flex flex-col', className)}
        {...props}
      />
    )
  }
)

CardContent.displayName = 'CardContent'
