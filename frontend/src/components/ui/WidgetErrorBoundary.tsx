'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ClairCard } from '@/components/ui/ClairCard'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  children?: ReactNode
  widgetName?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * WidgetErrorBoundary - Granular Error Boundary para Widgets individuales
 *
 * Este componente implementa OPT-2 del plan de optimización frontend.
 * Envuelve widgets individuales para prevenir que un error en un widget
 * colapse todo el dashboard.
 *
 * Características:
 * - Aislamiento de errores: Un widget fallido no afecta a otros widgets
 * - UI de error compacta: Mantiene el tamaño del Card para evitar layout shift
 * - Retry funcional: Permite reintentar la carga del widget
 * - Dev-friendly: Muestra stack trace en desarrollo
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error(`Widget Error [${this.props.widgetName || 'Unknown'}]:`, error, errorInfo)

    // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { tags: { widget: this.props.widgetName } })
  }

  public reset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ClairCard>
          <div className="px-6 py-4 border-b border-white/10 flex items-start justify-between gap-4">
            <h3 className="text-sm font-medium text-red-600 flex items-center gap-2 flex-1">
              <AlertTriangle className="h-4 w-4" />
              Error en Widget
            </h3>
          </div>
          <div className="px-6 py-6 flex-1 flex flex-col items-center justify-center min-h-[120px] text-center">
            <p className="text-sm text-gray-600 mb-4 dark:text-gray-300">
              {this.props.widgetName
                ? `No se pudo cargar "${this.props.widgetName}"`
                : 'No se pudo cargar este widget'}
            </p>

            {/* Show error message in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-4 w-full max-w-full">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 mb-2 dark:text-gray-400 dark:hover:text-gray-200">
                  Ver detalles técnicos
                </summary>
                <pre className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-xs text-left text-red-600 dark:text-red-400 overflow-x-auto max-h-32 border border-red-200 dark:border-red-800 whitespace-pre-wrap break-words max-w-full">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={this.reset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Reintentar
            </Button>
          </div>
        </ClairCard>
      )
    }

    return this.props.children
  }
}
