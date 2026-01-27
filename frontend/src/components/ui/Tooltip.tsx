'use client'

import { useState, useId, cloneElement, isValidElement, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
}

export function Tooltip({ content, children, side = 'right', delay = 0 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const calculatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()

    // Default coords
    let top = 0
    let left = 0
    const offset = 10 // margin from element

    // Calculate center points
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    switch (side) {
      case 'right':
        top = centerY
        left = rect.right + offset
        break
      case 'left':
        top = centerY
        left = rect.left - offset
        break
      case 'top':
        top = rect.top - offset
        left = centerX
        break
      case 'bottom':
        top = rect.bottom + offset
        left = centerX
        break
    }

    setCoords({ top, left })
  }

  const showTooltip = () => {
    calculatePosition()
    // Clear any pending hide timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  // Handle scroll or resize to update position or hide
  useEffect(() => {
    if (!isVisible) return

    const handleScroll = () => {
      // Hiding on scroll is safer than recalculating in real-time for simple tooltips
      setIsVisible(false)
    }

    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isVisible])

  // Clone child to add accessibility attributes
  const childWithProps = isValidElement(children)
    ? cloneElement(children as React.ReactElement<any>, {
      'aria-describedby': isVisible ? tooltipId : undefined,
      onFocus: (e: React.FocusEvent) => {
        showTooltip()
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

  // Transform style based on side to center the tooltip relative to the coordinate
  const transformMap = {
    right: 'translate(0, -50%)',
    left: 'translate(-100%, -50%)',
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)'
  }

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {childWithProps}
      </div>

      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: transformMap[side],
            zIndex: 9999
          }}
          className="px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 dark:bg-zinc-800 rounded-lg shadow-xl border border-white/10 whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100"
        >
          {content}
        </div>,
        document.body
      )}
    </>
  )
}
