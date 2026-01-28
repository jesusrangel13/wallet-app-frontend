'use client'

import { useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
    trigger: boolean
    onComplete?: () => void
}

export function useConfetti() {
    const fire = useCallback((options?: confetti.Options) => {
        const defaults = {
            spread: 360,
            ticks: 100,
            gravity: 0.5,
            decay: 0.94,
            startVelocity: 30,
            colors: ['#1A9B8E', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899'],
        }

        confetti({
            ...defaults,
            ...options,
            particleCount: 50,
            scalar: 1.2,
            shapes: ['circle', 'square'],
        })

        confetti({
            ...defaults,
            ...options,
            particleCount: 30,
            scalar: 0.75,
            shapes: ['circle'],
        })
    }, [])

    const fireFromElement = useCallback((element: HTMLElement) => {
        const rect = element.getBoundingClientRect()
        const x = (rect.left + rect.width / 2) / window.innerWidth
        const y = (rect.top + rect.height / 2) / window.innerHeight

        fire({ origin: { x, y } })
    }, [fire])

    return { fire, fireFromElement }
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
    const { fire } = useConfetti()

    useEffect(() => {
        if (trigger) {
            fire()
            onComplete?.()
        }
    }, [trigger, fire, onComplete])

    return null
}
