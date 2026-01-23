import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ErrorFallbackProps {
    error: Error
    resetErrorBoundary: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    const t = useTranslations('errors')

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg shadow-sm border border-destructive/20 min-h-[400px] text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            <h2 className="text-xl font-semibold text-foreground mb-2">
                {t('fallback.title')}
            </h2>

            <p className="text-muted-foreground mb-6 max-w-md">
                {t('fallback.message')}
            </p>

            {process.env.NODE_ENV === 'development' && (
                <pre className="bg-muted p-4 rounded text-xs text-left text-destructive mb-6 w-full max-w-lg overflow-auto max-h-48 border border-destructive/20">
                    {error.message}
                    {error.stack}
                </pre>
            )}

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                >
                    {t('fallback.reloadPage')}
                </Button>
                <Button
                    onClick={resetErrorBoundary}
                >
                    {t('fallback.tryAgain')}
                </Button>
            </div>
        </div>
    )
}
