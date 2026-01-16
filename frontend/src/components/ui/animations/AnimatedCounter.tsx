'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'

/**
 * AnimatedCounter Component
 * Animates numeric values counting up from 0 to target value
 * Creates premium feel like in Revolut, N26, and other modern fintech apps
 */

interface AnimatedCounterProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
  separator?: string
}

export const AnimatedCounter = ({
  value,
  duration = 1.2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  separator = ',',
}: AnimatedCounterProps) => {
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  })

  const display = useTransform(spring, (current) => {
    const formatted = current.toFixed(decimals)
    const parts = formatted.split('.')

    // Add thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator)

    return `${prefix}${parts.join('.')}${suffix}`
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span className={className}>{display}</motion.span>
}
