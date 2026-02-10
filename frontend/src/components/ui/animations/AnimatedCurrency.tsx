'use client'

import { AnimatedCounter } from './AnimatedCounter'

/**
 * AnimatedCurrency Component
 * Specialized AnimatedCounter for currency values
 * Handles currency formatting with proper separators and symbols
 */

interface AnimatedCurrencyProps {
  amount: number
  currency?: 'CLP' | 'USD' | 'EUR'
  className?: string
  duration?: number
  showDecimals?: boolean
}

const currencyConfig = {
  CLP: {
    symbol: '$',
    decimals: 0,
    separator: '.',
  },
  USD: {
    symbol: '$',
    decimals: 2,
    separator: ',',
  },
  EUR: {
    symbol: '€',
    decimals: 2,
    separator: ',',
  },
}

export const AnimatedCurrency = ({
  amount,
  currency = 'CLP',
  className = '',
  duration = 1.2,
  showDecimals,
}: AnimatedCurrencyProps) => {
  const config = currencyConfig[currency]
  const decimals = showDecimals !== undefined ? (showDecimals ? config.decimals : 0) : config.decimals

  return (
    <AnimatedCounter
      value={amount}
      duration={duration}
      decimals={decimals}
      prefix={config.symbol}
      suffix=""
      separator={config.separator}
      className={`font-numeric ${className}`}
    />
  )
}
