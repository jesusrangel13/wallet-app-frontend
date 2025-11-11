// Currency types and utilities

export type Currency = 'CLP' | 'USD' | 'EUR'

export interface CurrencyInfo {
  code: Currency
  symbol: string
  name: string
  locale: string
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  CLP: {
    code: 'CLP',
    symbol: '$',
    name: 'Chilean Peso',
    locale: 'es-CL',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'es-ES',
  },
}

export const formatCurrency = (amount: number, currency: Currency = 'CLP'): string => {
  const currencyInfo = CURRENCIES[currency]

  // For CLP, we don't want decimals
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
    maximumFractionDigits: currency === 'CLP' ? 0 : 2,
  }

  return new Intl.NumberFormat(currencyInfo.locale, options).format(amount)
}

export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCIES[currency].symbol
}

export const getCurrencyName = (currency: Currency): string => {
  return CURRENCIES[currency].name
}
