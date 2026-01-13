/**
 * API Response Types
 * Generic types for API responses to improve type safety
 */

import type { Account, Transaction, Tag, Group } from './index'

// Generic API response wrapper
export interface APIResponse<T> {
  data: T
  message?: string
}

// Specific API response types for common endpoints
export type AccountsResponse = APIResponse<Account[]>
export type AccountResponse = APIResponse<Account>
export type TransactionsResponse = APIResponse<Transaction[]>
export type TransactionResponse = APIResponse<Transaction>
export type TagsResponse = APIResponse<Tag[]>
export type TagResponse = APIResponse<Tag>
export type GroupsResponse = APIResponse<Group[]>
export type GroupResponse = APIResponse<Group>

// Paginated response
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Query cache data structure
export interface QueryCacheData<T> {
  data: APIResponse<T>
}

export interface PaginatedQueryCacheData<T> {
  data: APIResponse<PaginatedResponse<T>>
}

// Helper type for setQueryData callbacks
export type QueryDataUpdater<T> = (old: QueryCacheData<T> | undefined) => QueryCacheData<T> | undefined

export type PaginatedQueryDataUpdater<T> = (
  old: PaginatedQueryCacheData<T> | undefined
) => PaginatedQueryCacheData<T> | undefined
