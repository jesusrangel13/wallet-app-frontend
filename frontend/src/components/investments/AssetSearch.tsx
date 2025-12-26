'use client'

/**
 * AssetSearch Component
 *
 * Autocomplete search for finding investment assets (Crypto, Stocks, ETF, Forex)
 */

import { useState, useEffect } from 'react'
import { Search, TrendingUp, DollarSign, Globe, Bitcoin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAssetSearch } from '@/hooks/useInvestments'
import { InvestmentAssetType, type AssetSearchResult } from '@/types/investment'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface AssetSearchProps {
  onSelect: (asset: AssetSearchResult) => void
  selectedAsset?: AssetSearchResult | null
  className?: string
}

const ASSET_TYPE_ICONS = {
  [InvestmentAssetType.CRYPTO]: Bitcoin,
  [InvestmentAssetType.STOCK]: TrendingUp,
  [InvestmentAssetType.ETF]: TrendingUp,
  [InvestmentAssetType.FOREX]: Globe,
}

export function AssetSearch({
  onSelect,
  selectedAsset,
  className = '',
}: AssetSearchProps) {
  const t = useTranslations('investments')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [assetType, setAssetType] = useState<InvestmentAssetType | undefined>()
  const [showResults, setShowResults] = useState(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const { data: searchResults, isLoading } = useAssetSearch(
    { query: debouncedQuery, assetType },
    debouncedQuery.length > 1
  )

  const handleSelect = (asset: AssetSearchResult) => {
    onSelect(asset)
    setQuery('')
    setShowResults(false)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Search Input */}
        <div className="md:col-span-2">
          <Label htmlFor="asset-search">{t('searchAsset')}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="asset-search"
              type="text"
              placeholder={t('searchAssetPlaceholder')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowResults(true)
              }}
              onFocus={() => setShowResults(true)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Asset Type Filter */}
        <div>
          <Label htmlFor="asset-type">{t('assetType')}</Label>
          <Select
            value={assetType}
            onValueChange={(value) =>
              setAssetType(value as InvestmentAssetType)
            }
          >
            <SelectTrigger id="asset-type">
              <SelectValue placeholder={t('allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('allTypes')}</SelectItem>
              <SelectItem value={InvestmentAssetType.CRYPTO}>
                {t('crypto')}
              </SelectItem>
              <SelectItem value={InvestmentAssetType.STOCK}>
                {t('stock')}
              </SelectItem>
              <SelectItem value={InvestmentAssetType.ETF}>
                {t('etf')}
              </SelectItem>
              <SelectItem value={InvestmentAssetType.FOREX}>
                {t('forex')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Asset Display */}
      {selectedAsset && (
        <Card className="p-3 bg-muted/50">
          <div className="flex items-center gap-3">
            {(() => {
              const Icon = ASSET_TYPE_ICONS[selectedAsset.assetType]
              return <Icon className="h-5 w-5 text-primary" />
            })()}
            <div className="flex-1">
              <p className="font-medium">
                {selectedAsset.symbol} - {selectedAsset.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(selectedAsset.assetType.toLowerCase())}
                {selectedAsset.exchange && ` • ${selectedAsset.exchange}`}
              </p>
            </div>
            {selectedAsset.currentPrice && (
              <div className="text-right">
                <p className="font-semibold">
                  {selectedAsset.currentPrice.toLocaleString('en-US', {
                    style: 'currency',
                    currency: selectedAsset.currency || 'USD',
                  })}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Search Results */}
      {showResults && debouncedQuery.length > 1 && (
        <Card className="max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map((asset) => {
                const Icon = ASSET_TYPE_ICONS[asset.assetType]
                return (
                  <button
                    key={`${asset.symbol}-${asset.assetType}`}
                    onClick={() => handleSelect(asset)}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {asset.symbol} - {asset.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t(asset.assetType.toLowerCase())}
                        {asset.exchange && ` • ${asset.exchange}`}
                      </p>
                    </div>
                    {asset.currentPrice && (
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm">
                          {asset.currentPrice.toLocaleString('en-US', {
                            style: 'currency',
                            currency: asset.currency || 'USD',
                          })}
                        </p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t('noResultsFound')}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
