'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PulseAnimationProps {
    children: ReactNode
    pulse: boolean
    color?: string
    className?: string
}

export function PulseAnimation({
    children,
    pulse,
    color = 'currentColor', // Use current text color by default, or allow override
    className = ''
}: PulseAnimationProps) {
    return (
        <div className={`relative ${className}`}>
            {pulse && (
                <motion.span
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ backgroundColor: color }}
                />
            )}
            {children}
        </div>
    )
}
