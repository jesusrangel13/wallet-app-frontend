'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ShakeAnimationProps {
    children: ReactNode
    shake: boolean
    className?: string
}

const shakeVariants = {
    shake: {
        x: [0, -4, 4, -4, 4, -2, 2, 0],
        transition: { duration: 0.4 }
    },
    idle: {
        x: 0
    }
}

export function ShakeAnimation({ children, shake, className = '' }: ShakeAnimationProps) {
    return (
        <motion.div
            animate={shake ? 'shake' : 'idle'}
            variants={shakeVariants}
            className={className}
        >
            {children}
        </motion.div>
    )
}
