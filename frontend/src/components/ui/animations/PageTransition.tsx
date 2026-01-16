'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * PageTransition Component
 * Provides smooth fade-in/fade-out animations when navigating between pages
 * Used by professional fintech apps like Revolut, N26, Mercury
 */

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const, // Custom easing for smooth feel
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: [0.55, 0.055, 0.675, 0.19] as const,
    },
  },
}

export const PageTransition = ({ children, className }: PageTransitionProps) => {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}
