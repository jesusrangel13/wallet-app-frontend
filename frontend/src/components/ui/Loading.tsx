'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  /** Accessible label for the spinner */
  label?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

/**
 * Spinner de carga unificado usando Loader2 de lucide-react
 */
export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-blue-600', sizeClasses[size], className)}
      aria-hidden={!label}
      aria-label={label}
    />
  )
}

interface LoadingPageProps {
  message?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * Loading para páginas completas - centrado vertical y horizontal
 */
export function LoadingPage({
  message,
  size = 'lg',
  className,
}: LoadingPageProps) {
  const t = useTranslations('loading')
  const displayMessage = message || t('default')

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] gap-3',
        className
      )}
    >
      <LoadingSpinner size={size} aria-hidden="true" />
      <p className="text-gray-500 text-sm">{displayMessage}</p>
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * Overlay de carga sobre contenido existente
 */
export function LoadingOverlay({
  message,
  size = 'md',
  className,
}: LoadingOverlayProps) {
  const t = useTranslations('loading')
  const displayMessage = message || t('updating')

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10 rounded-lg gap-2',
        className
      )}
    >
      <LoadingSpinner size={size} aria-hidden="true" />
      {displayMessage && <p className="text-gray-600 text-sm font-medium">{displayMessage}</p>}
    </div>
  )
}

interface LoadingInlineProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Loading inline para badges o indicadores pequeños
 */
export function LoadingInline({
  message,
  size = 'sm',
  className,
}: LoadingInlineProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex items-center gap-1.5', className)}
    >
      <LoadingSpinner size={size} aria-hidden="true" />
      {message && <span className="text-gray-600 text-sm">{message}</span>}
    </span>
  )
}

interface LoadingButtonTextProps {
  message?: string
}

/**
 * Texto de loading para botones - usar con el prop isLoading del Button
 */
export function LoadingButtonText({ message }: LoadingButtonTextProps) {
  const t = useTranslations('loading')
  const displayMessage = message || t('saving')

  return (
    <span className="inline-flex items-center gap-2" role="status">
      <LoadingSpinner size="sm" className="text-current" aria-hidden="true" />
      {displayMessage}
    </span>
  )
}

interface SkeletonProps {
  className?: string
  /** Accessible label for the skeleton */
  label?: string
}

/**
 * Skeleton loader para placeholders de contenido
 */
export function Skeleton({ className, label }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label || 'Loading'}
      className={cn('animate-pulse bg-gray-200 rounded', className)}
    />
  )
}

/**
 * Skeleton para una fila de tabla
 */
export function SkeletonRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4" role="status" aria-label="Loading row">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 rounded h-4 flex-1" aria-hidden="true" />
      ))}
    </div>
  )
}

/**
 * Skeleton para una tarjeta
 */
export function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4" role="status" aria-label="Loading card">
      <div className="animate-pulse bg-gray-200 rounded h-6 w-1/3" aria-hidden="true" />
      <div className="animate-pulse bg-gray-200 rounded h-4 w-2/3" aria-hidden="true" />
      <div className="animate-pulse bg-gray-200 rounded h-4 w-1/2" aria-hidden="true" />
    </div>
  )
}
