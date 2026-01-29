'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const t = useTranslations('common.actions')
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-ring',
      outline: 'border border-input bg-background hover:bg-muted text-foreground focus:ring-ring',
      ghost: 'hover:bg-muted hover:text-foreground text-foreground focus:ring-ring',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      icon: 'h-10 w-10',
    }

    const MotionButton = motion.button

    return (
      <MotionButton
        ref={ref}
        whileHover={disabled || isLoading ? undefined : { scale: 1.02 }}
        whileTap={disabled || isLoading ? undefined : { scale: 0.98 }}
        transition={{ duration: 0.15, ease: 'easeInOut' }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        aria-disabled={disabled || isLoading || undefined}
        {...(props as any)}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('loading')}
          </>
        ) : (
          children
        )}
      </MotionButton>
    )
  }
)

Button.displayName = 'Button'
