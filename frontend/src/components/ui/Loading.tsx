'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
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
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-blue-600', sizeClasses[size], className)}
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
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] gap-3',
        className
      )}
    >
      <LoadingSpinner size={size} />
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
      className={cn(
        'absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10 rounded-lg gap-2',
        className
      )}
    >
      <LoadingSpinner size={size} />
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
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <LoadingSpinner size={size} />
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
    <span className="inline-flex items-center gap-2">
      <LoadingSpinner size="sm" className="text-current" />
      {displayMessage}
    </span>
  )
}

interface SkeletonProps {
  className?: string
}

/**
 * Skeleton loader para placeholders de contenido
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse bg-gray-200 rounded', className)}
    />
  )
}

/**
 * Skeleton para una fila de tabla
 */
export function SkeletonRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  )
}

/**
 * Skeleton para una tarjeta
 */
export function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}
