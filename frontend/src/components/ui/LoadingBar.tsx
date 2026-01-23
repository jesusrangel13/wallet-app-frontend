/**
 * LoadingBar Component
 * Minimal top progress bar for indicating loading states
 * Used by professional fintech apps like Mercury, Brex, Stripe
 */

interface LoadingBarProps {
  isLoading: boolean
  /** Accessible label for the loading bar */
  label?: string
}

export const LoadingBar = ({ isLoading, label = 'Loading content' }: LoadingBarProps) => {
  if (!isLoading) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-700"
      role="progressbar"
      aria-label={label}
      aria-busy="true"
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-primary animate-loading-bar"
        aria-hidden="true"
      />
    </div>
  )
}
