'use client'

import { AccountBalancesWidget } from './widgets/AccountBalancesWidget'
import { useEffect, useState, useRef } from 'react'

export const FixedAccountBalancesWidget = () => {
  const [maxWidth, setMaxWidth] = useState<number>(1200)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const calculateMaxWidth = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.parentElement?.offsetWidth || 1200
        // Subtract the horizontal padding (16px on each side = 32px total)
        setMaxWidth(parentWidth - 32)
      }
    }

    calculateMaxWidth()
    window.addEventListener('resize', calculateMaxWidth)
    return () => window.removeEventListener('resize', calculateMaxWidth)
  }, [])

  return (
    <div ref={containerRef} className="mb-6 w-full overflow-hidden px-4">
      {/* Premium style container with max width */}
      <div
        className="bg-gradient-to-r from-gray-50 to-white dark:from-card dark:to-card border border-gray-200 dark:border-border shadow-lg dark:shadow-none rounded-lg overflow-hidden"
        style={{ maxWidth: `${maxWidth}px` }}
      >
        <AccountBalancesWidget />
      </div>
    </div>
  )
}
