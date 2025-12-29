/**
 * Investment System TypeScript Types
 *
 * Tipos para el sistema de tracking de inversiones (Crypto, Stocks, ETF, Forex)
 */

// ==================== ENUMS ====================

export enum InvestmentAssetType {
  CRYPTO = 'CRYPTO',
  STOCK = 'STOCK',
  ETF = 'ETF',
  FOREX = 'FOREX',
}

export enum InvestmentTransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DIVIDEND = 'DIVIDEND',
  INTEREST = 'INTEREST',
}

// ==================== BASE MODELS ====================

export interface InvestmentHolding {
  id: string;
  userId: string;
  accountId: string;
  assetSymbol: string;
  assetName: string;
  assetType: InvestmentAssetType;
  totalQuantity: number;
  averageCostPerUnit: number;
  totalCostBasis: number;
  realizedGainLoss: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentTransaction {
  id: string;
  userId: string;
  accountId: string;
  holdingId: string;
  assetSymbol: string;
  assetType: InvestmentAssetType;
  type: InvestmentTransactionType;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  fees: number;
  exchangeRate?: number | null;
  currency: string;
  transactionDate: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentPriceCache {
  id: string;
  assetSymbol: string;
  assetType: InvestmentAssetType;
  price: number;
  currency: string;
  change24h?: number | null;
  timestamp: string;
  source: string;
}

// ==================== COMPUTED DATA ====================

export interface PriceData {
  price: number;
  currency: string;
  change24h?: number;
  isStale?: boolean;
  source: string;
  timestamp: string;
}

export interface HoldingWithMetrics extends InvestmentHolding {
  currentPrice: number;
  currentValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercentage: number;
  roi: number;
  allocationPercentage?: number;
  dateSold?: string; // Solo presente en closed positions (ISO date string)
  dividendsEarned: number; // Total de dividendos ganados de este activo
}

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalUnrealizedGainLoss: number;
  totalRealizedGainLoss: number;
  totalGainLoss: number;
  totalDividends: number; // Total de dividendos acumulados en el portafolio
  roi: number;
  currency: string;
  holdings: HoldingWithMetrics[];
  assetAllocation: {
    [key in InvestmentAssetType]?: {
      value: number;
      percentage: number;
      count: number;
    };
  };
}

export interface AssetSearchResult {
  symbol: string;
  name: string;
  assetType: InvestmentAssetType;
  currentPrice?: number;
  currency?: string;
  exchange?: string;
  description?: string;
}

// ==================== API REQUEST/RESPONSE ====================

// Tipo para transacciones BUY/SELL
export interface CreateBuyOrSellRequest {
  accountId: string;
  assetSymbol: string;
  assetName: string;
  assetType: InvestmentAssetType;
  type: 'BUY' | 'SELL';
  quantity: number;
  pricePerUnit: number;
  fees?: number;
  currency?: string;
  transactionDate?: string;
  notes?: string;
  exchangeRate?: number;
}

// Tipo para transacciones DIVIDEND/INTEREST
export interface CreateDividendOrInterestRequest {
  accountId: string;
  assetSymbol: string;
  assetName: string;
  assetType: InvestmentAssetType;
  type: 'DIVIDEND' | 'INTEREST';
  amount: number;
  fees?: number;
  currency?: string;
  transactionDate?: string;
  notes?: string;
}

// Union type que puede ser cualquiera de los dos
export type CreateInvestmentTransactionRequest =
  | CreateBuyOrSellRequest
  | CreateDividendOrInterestRequest;

export interface GetTransactionsFilters {
  accountId?: string;
  assetSymbol?: string;
  type?: InvestmentTransactionType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface TransactionsPaginatedResponse {
  success: boolean;
  data: InvestmentTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface GetBatchPricesRequest {
  symbols: Array<{
    symbol: string;
    assetType: InvestmentAssetType;
  }>;
}

export interface SearchAssetsRequest {
  query: string;
  assetType?: InvestmentAssetType;
}

// ==================== UI STATE ====================

export interface InvestmentFormData {
  accountId: string;
  assetSymbol: string;
  assetName: string;
  assetType: InvestmentAssetType;
  type: 'BUY' | 'SELL';
  quantity: string;
  pricePerUnit: string;
  fees: string;
  currency: string;
  transactionDate: Date;
  notes: string;
}

export interface AssetSearchState {
  query: string;
  results: AssetSearchResult[];
  isSearching: boolean;
  selectedAsset: AssetSearchResult | null;
}
