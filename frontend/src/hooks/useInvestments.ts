/**
 * Investment Hooks - React Query hooks for investment operations
 *
 * Provides hooks for managing investment transactions, holdings, and prices
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { investmentAPI } from '@/lib/api'
import type {
  CreateInvestmentTransactionRequest,
  GetTransactionsFilters,
  InvestmentAssetType,
  SearchAssetsRequest,
} from '@/types/investment'

// ==================== QUERY KEYS ====================

export const investmentKeys = {
  all: ['investments'] as const,
  transactions: (filters?: GetTransactionsFilters) =>
    ['investments', 'transactions', filters] as const,
  transaction: (id: string) =>
    ['investments', 'transaction', id] as const,
  holdings: (accountId: string) =>
    ['investments', 'holdings', accountId] as const,
  holding: (accountId: string, symbol: string) =>
    ['investments', 'holding', accountId, symbol] as const,
  portfolioSummary: (accountId: string) =>
    ['investments', 'portfolio-summary', accountId] as const,
  price: (symbol: string, assetType: string) =>
    ['investments', 'price', symbol, assetType] as const,
  search: (query: string, assetType?: InvestmentAssetType) =>
    ['investments', 'search', query, assetType] as const,
}

// ==================== HOLDINGS ====================

/**
 * Get all holdings for an investment account
 * Auto-refreshes every 5 minutes to keep prices updated
 */
export const useInvestmentHoldings = (accountId: string, enabled = true) => {
  return useQuery({
    queryKey: investmentKeys.holdings(accountId),
    queryFn: async () => {
      const response = await investmentAPI.getHoldings(accountId)
      return response.data.data
    },
    enabled: !!accountId && enabled,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Get a specific holding by symbol
 */
export const useInvestmentHolding = (
  accountId: string,
  symbol: string,
  enabled = true
) => {
  return useQuery({
    queryKey: investmentKeys.holding(accountId, symbol),
    queryFn: async () => {
      const response = await investmentAPI.getHoldingBySymbol(accountId, symbol)
      return response.data.data
    },
    enabled: !!accountId && !!symbol && enabled,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get portfolio summary with metrics
 * Auto-refreshes to keep valuations current
 */
export const usePortfolioSummary = (accountId: string, enabled = true) => {
  return useQuery({
    queryKey: investmentKeys.portfolioSummary(accountId),
    queryFn: async () => {
      const response = await investmentAPI.getPortfolioSummary(accountId)
      return response.data.data
    },
    enabled: !!accountId && enabled,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

// ==================== TRANSACTIONS ====================

/**
 * Get investment transactions with filters and pagination
 */
export const useInvestmentTransactions = (
  filters?: GetTransactionsFilters,
  enabled = true
) => {
  return useQuery({
    queryKey: investmentKeys.transactions(filters),
    queryFn: async () => {
      const response = await investmentAPI.getTransactions(filters)
      return response.data
    },
    enabled,
  })
}

/**
 * Get a specific investment transaction
 */
export const useInvestmentTransaction = (id: string, enabled = true) => {
  return useQuery({
    queryKey: investmentKeys.transaction(id),
    queryFn: async () => {
      const response = await investmentAPI.getTransactionById(id)
      return response.data.data
    },
    enabled: !!id && enabled,
  })
}

/**
 * Create a new investment transaction (BUY/SELL)
 */
export const useCreateInvestmentTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateInvestmentTransactionRequest) =>
      investmentAPI.createTransaction(data),
    onSuccess: (response, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: investmentKeys.holdings(variables.accountId),
      })
      queryClient.invalidateQueries({
        queryKey: investmentKeys.portfolioSummary(variables.accountId),
      })
      queryClient.invalidateQueries({
        queryKey: investmentKeys.transactions(),
      })
      // Invalidate accounts because balance changed
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['total-balance'] })
    },
  })
}

/**
 * Delete an investment transaction
 */
export const useDeleteInvestmentTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => investmentAPI.deleteTransaction(id),
    onSuccess: () => {
      // Invalidate all investment-related queries
      queryClient.invalidateQueries({ queryKey: investmentKeys.all })
      // Invalidate accounts because balance changed
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['total-balance'] })
    },
  })
}

// ==================== PRICES ====================

/**
 * Get current price for an asset
 * Polls every minute for real-time updates
 */
export const useAssetPrice = (
  symbol: string,
  assetType: InvestmentAssetType,
  enabled = true
) => {
  return useQuery({
    queryKey: investmentKeys.price(symbol, assetType),
    queryFn: async () => {
      const response = await investmentAPI.getCurrentPrice(symbol, assetType)
      return response.data.data
    },
    enabled: !!symbol && !!assetType && enabled,
    refetchInterval: 60 * 1000, // 1 minute
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Get multiple asset prices in batch
 */
export const useBatchPrices = (
  symbols: Array<{ symbol: string; assetType: InvestmentAssetType }>,
  enabled = true
) => {
  return useQuery({
    queryKey: ['investments', 'batch-prices', JSON.stringify(symbols)],
    queryFn: async () => {
      const response = await investmentAPI.getBatchPrices({ symbols })
      return response.data.data
    },
    enabled: symbols.length > 0 && enabled,
    refetchInterval: 60 * 1000, // 1 minute
  })
}

// ==================== SEARCH ====================

/**
 * Search for assets by name or symbol
 * Uses debounced input for better UX
 */
export const useAssetSearch = (params: SearchAssetsRequest, enabled = true) => {
  return useQuery({
    queryKey: investmentKeys.search(params.query, params.assetType),
    queryFn: async () => {
      const response = await investmentAPI.searchAssets(params)
      return response.data.data
    },
    enabled: !!params.query && params.query.length > 1 && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - search results don't change often
  })
}
