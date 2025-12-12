import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

interface ErrorFallbackProps {
    error: Error
    resetErrorBoundary: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-red-100 min-h-[400px] text-center">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
            </h2>

            <p className="text-gray-500 mb-6 max-w-md">
                We encountered an unexpected error. Our team has been notified.
                You can try reloading the page or checking your connection.
            </p>

            {process.env.NODE_ENV === 'development' && (
                <pre className="bg-gray-50 p-4 rounded text-xs text-left text-red-600 mb-6 w-full max-w-lg overflow-auto max-h-48 border border-red-100">
                    {error.message}
                    {error.stack}
                </pre>
            )}

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                >
                    Reload Page
                </Button>
                <Button
                    onClick={resetErrorBoundary}
                >
                    Try Again
                </Button>
            </div>
        </div>
    )
}
