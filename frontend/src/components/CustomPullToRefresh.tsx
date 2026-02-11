'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import { LoadingSpinner } from './ui/Loading'

interface CustomPullToRefreshProps {
    onRefresh: () => Promise<void>
    children: ReactNode
}

export function CustomPullToRefresh({ onRefresh, children }: CustomPullToRefreshProps) {
    const [pullDistance, setPullDistance] = useState(0)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const touchStartY = useRef(0)
    const pullThreshold = 80

    useEffect(() => {
        let startY = 0
        let currentY = 0

        const handleTouchStart = (e: TouchEvent) => {
            // Only activate if at top of page
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY
                touchStartY.current = startY
            }
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (window.scrollY === 0 && touchStartY.current > 0) {
                currentY = e.touches[0].clientY
                const distance = currentY - touchStartY.current

                // Only allow pulling down
                if (distance > 0) {
                    setPullDistance(Math.min(distance, 120))
                    // Prevent default scroll when pulling
                    if (distance > 10) {
                        e.preventDefault()
                    }
                }
            }
        }

        const handleTouchEnd = async () => {
            if (pullDistance >= pullThreshold && !isRefreshing) {
                setIsRefreshing(true)
                try {
                    await onRefresh()
                } finally {
                    setIsRefreshing(false)
                }
            }
            setPullDistance(0)
            touchStartY.current = 0
        }

        window.addEventListener('touchstart', handleTouchStart, { passive: true })
        window.addEventListener('touchmove', handleTouchMove, { passive: false })
        window.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            window.removeEventListener('touchstart', handleTouchStart)
            window.removeEventListener('touchmove', handleTouchMove)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [pullDistance, isRefreshing, onRefresh])

    const opacity = Math.min(pullDistance / pullThreshold, 1)
    const scale = Math.min(0.5 + (pullDistance / pullThreshold) * 0.5, 1)

    return (
        <>
            {/* Pull indicator */}
            <div
                className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center pointer-events-none"
                style={{
                    transform: `translateY(${Math.min(pullDistance - 40, 40)}px)`,
                    opacity,
                    transition: pullDistance === 0 ? 'all 0.3s ease-out' : 'none',
                }}
            >
                <div
                    className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg"
                    style={{
                        transform: `scale(${scale}) rotate(${pullDistance * 2}deg)`,
                    }}
                >
                    {isRefreshing ? (
                        <LoadingSpinner size="sm" />
                    ) : (
                        <svg
                            className="w-6 h-6 text-gray-600 dark:text-gray-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                        </svg>
                    )}
                </div>
            </div>

            {children}
        </>
    )
}
