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
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200"
      role="progressbar"
      aria-label={label}
      aria-busy="true"
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-blue-600 animate-loading-bar"
        style={{
          animation: 'loading-bar 1.5s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 70%;
            margin-left: 15%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  )
}
