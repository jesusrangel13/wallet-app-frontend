'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * StaggeredEntry Component
 * Animates children entering in cascade (one after another)
 * Creates premium dashboard loading experience like Stripe, Mercury, Brex
 */

interface StaggeredEntryProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  itemDelay?: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08, // Delay between each child
      delayChildren: 0.1, // Delay before starting
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
}

export const StaggeredEntry = ({
  children,
  className,
  staggerDelay,
  itemDelay,
}: StaggeredEntryProps) => {
  // Override default values if provided
  const customContainerVariants = staggerDelay
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: itemDelay || 0.1,
          },
        },
      }
    : containerVariants

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={customContainerVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggeredItem Component
 * Individual item wrapper for use with StaggeredEntry
 */

interface StaggeredItemProps {
  children: ReactNode
  className?: string
}

export const StaggeredItem = ({ children, className }: StaggeredItemProps) => {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}
