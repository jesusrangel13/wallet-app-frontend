'use client'

import { useState, useId, cloneElement, isValidElement, useCallback } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
}

export function Tooltip({ content, children, side = 'right', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const tooltipId = useId()

  const showTooltip = useCallback(() => {
    const id = setTimeout(() => setIsVisible(true), delay)
    setTimeoutId(id)
  }, [delay])

  const hideTooltip = useCallback(() => {
    if (timeoutId) clearTimeout(timeoutId)
    setIsVisible(false)
  }, [timeoutId])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible) {
      hideTooltip()
    }
  }, [isVisible, hideTooltip])

  const positionClasses = {
    top: 'bottom-full mb-2 -left-1/2 translate-x-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    bottom: 'top-full mt-2 -left-1/2 translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  }

  const arrowClasses = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-gray-900',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-gray-900',
  }

  // Clone child to add accessibility attributes
  const childWithProps = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
        'aria-describedby': isVisible ? tooltipId : undefined,
        onFocus: (e: React.FocusEvent) => {
          showTooltip()
          // Call original onFocus if exists
          const originalProps = (children as React.ReactElement<any>).props
          if (originalProps?.onFocus) originalProps.onFocus(e)
        },
        onBlur: (e: React.FocusEvent) => {
          hideTooltip()
          const originalProps = (children as React.ReactElement<any>).props
          if (originalProps?.onBlur) originalProps.onBlur(e)
        },
      })
    : children

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onKeyDown={handleKeyDown}
    >
      {childWithProps}

      <div
        id={tooltipId}
        role="tooltip"
        aria-hidden={!isVisible}
        className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md whitespace-nowrap pointer-events-none ${positionClasses[side]} ${
          isVisible ? 'animate-in fade-in duration-200' : 'invisible'
        }`}
      >
        {content}
        <div className={`absolute ${arrowClasses[side]}`} />
      </div>
    </div>
  )
}
