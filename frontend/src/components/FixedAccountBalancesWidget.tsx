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
        setMaxWidth(parentWidth)
      }
    }

    calculateMaxWidth()
    window.addEventListener('resize', calculateMaxWidth)
    return () => window.removeEventListener('resize', calculateMaxWidth)
  }, [])

  return (
    <div ref={containerRef} className="mb-6 w-full overflow-hidden">
      {/* Premium style container with max width */}
      <div
        className="w-full overflow-hidden"
        style={{ maxWidth: `${maxWidth}px` }}
      >
        <AccountBalancesWidget />
      </div>
    </div>
  )
}
