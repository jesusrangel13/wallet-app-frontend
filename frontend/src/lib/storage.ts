/**
 * Safe localStorage utilities with size validation and error handling
 * Part of OPT-10: Persistencia de Estado Segura
 */

// Maximum recommended size per key (in bytes) to prevent main thread blocking
const MAX_ITEM_SIZE = 100 * 1024 // 100KB per item
const WARNING_SIZE = 50 * 1024 // 50KB warning threshold

// Storage quota warning threshold (5MB is typical localStorage limit)
const STORAGE_QUOTA_WARNING = 4 * 1024 * 1024 // 4MB

export interface StorageMetrics {
  totalSize: number
  itemCount: number
  largestItem: { key: string; size: number } | null
  items: Array<{ key: string; size: number }>
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const testKey = '__storage_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Get the size of a string in bytes
 */
export function getStringSize(str: string): number {
  return new Blob([str]).size
}

/**
 * Get metrics about current localStorage usage
 */
export function getStorageMetrics(): StorageMetrics {
  if (!isLocalStorageAvailable()) {
    return { totalSize: 0, itemCount: 0, largestItem: null, items: [] }
  }

  const items: Array<{ key: string; size: number }> = []
  let totalSize = 0
  let largestItem: { key: string; size: number } | null = null

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key) || ''
      const size = getStringSize(key) + getStringSize(value)
      items.push({ key, size })
      totalSize += size

      if (!largestItem || size > largestItem.size) {
        largestItem = { key, size }
      }
    }
  }

  return {
    totalSize,
    itemCount: items.length,
    largestItem,
    items: items.sort((a, b) => b.size - a.size),
  }
}

/**
 * Check if storage is approaching quota limits
 */
export function isStorageNearQuota(): boolean {
  const metrics = getStorageMetrics()
  return metrics.totalSize > STORAGE_QUOTA_WARNING
}

/**
 * Validate item size before storing
 */
export function validateItemSize(value: string): { valid: boolean; size: number; warning: boolean } {
  const size = getStringSize(value)
  return {
    valid: size <= MAX_ITEM_SIZE,
    size,
    warning: size > WARNING_SIZE,
  }
}

/**
 * Safe localStorage setItem with size validation
 */
export function safeSetItem(key: string, value: string): { success: boolean; error?: string } {
  if (!isLocalStorageAvailable()) {
    return { success: false, error: 'localStorage not available' }
  }

  const validation = validateItemSize(value)

  if (!validation.valid) {
    console.warn(
      `[Storage] Item "${key}" exceeds max size (${(validation.size / 1024).toFixed(2)}KB > ${MAX_ITEM_SIZE / 1024}KB)`
    )
    return {
      success: false,
      error: `Item size ${(validation.size / 1024).toFixed(2)}KB exceeds limit`
    }
  }

  if (validation.warning) {
    console.warn(
      `[Storage] Item "${key}" is large (${(validation.size / 1024).toFixed(2)}KB). Consider optimizing.`
    )
  }

  try {
    localStorage.setItem(key, value)
    return { success: true }
  } catch (error) {
    // Handle QuotaExceededError
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error(`[Storage] Quota exceeded when setting "${key}"`)
      return { success: false, error: 'Storage quota exceeded' }
    }
    console.error(`[Storage] Error setting "${key}":`, error)
    return { success: false, error: 'Unknown storage error' }
  }
}

/**
 * Safe localStorage getItem
 */
export function safeGetItem(key: string): string | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.error(`[Storage] Error getting "${key}":`, error)
    return null
  }
}

/**
 * Safe localStorage removeItem
 */
export function safeRemoveItem(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false
  }

  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`[Storage] Error removing "${key}":`, error)
    return false
  }
}

/**
 * Clear all app-related storage items
 * Only clears items with known prefixes to avoid affecting other apps
 */
export function clearAppStorage(): void {
  if (!isLocalStorageAvailable()) return

  const appKeys = [
    'dashboard-store',
    'auth-storage',
    'sidebar-storage',
    'token',
  ]

  appKeys.forEach((key) => {
    safeRemoveItem(key)
  })
}

/**
 * Custom storage implementation for Zustand persist middleware
 * Provides safe operations with size validation and error handling
 * Compatible with Zustand's PersistStorage interface
 */
export const safeStorage = {
  getItem: (name: string) => {
    const value = safeGetItem(name)
    if (value === null) return null
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: unknown): void => {
    const stringValue = JSON.stringify(value)
    const result = safeSetItem(name, stringValue)
    if (!result.success) {
      // If storage fails, we log but don't throw to prevent app crashes
      // The data will be refetched from the server on next load
      console.warn(`[Storage] Failed to persist "${name}": ${result.error}`)
    }
  },
  removeItem: (name: string): void => {
    safeRemoveItem(name)
  },
}

/**
 * Storage version management for migrations
 */
export interface StorageVersion {
  version: number
  migratedAt: string
}

const STORAGE_VERSION_KEY = 'app-storage-version'
const CURRENT_STORAGE_VERSION = 1

export function getStorageVersion(): StorageVersion | null {
  const data = safeGetItem(STORAGE_VERSION_KEY)
  if (!data) return null

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function setStorageVersion(version: number): void {
  const data: StorageVersion = {
    version,
    migratedAt: new Date().toISOString(),
  }
  safeSetItem(STORAGE_VERSION_KEY, JSON.stringify(data))
}

/**
 * Run storage migrations if needed
 * Add migration logic here when storage schema changes
 */
export function runStorageMigrations(): void {
  const currentVersion = getStorageVersion()

  if (!currentVersion) {
    // First time setup
    setStorageVersion(CURRENT_STORAGE_VERSION)
    return
  }

  if (currentVersion.version < CURRENT_STORAGE_VERSION) {
    // Run migrations
    // Example migration pattern:
    // if (currentVersion.version < 2) {
    //   migrateV1toV2()
    // }
    // if (currentVersion.version < 3) {
    //   migrateV2toV3()
    // }

    setStorageVersion(CURRENT_STORAGE_VERSION)
  }
}

/**
 * Debug helper to log storage status
 */
export function logStorageStatus(): void {
  if (process.env.NODE_ENV !== 'development') return

  const metrics = getStorageMetrics()
  console.group('[Storage] Status')
  console.log(`Total size: ${(metrics.totalSize / 1024).toFixed(2)}KB`)
  console.log(`Item count: ${metrics.itemCount}`)
  if (metrics.largestItem) {
    console.log(`Largest item: ${metrics.largestItem.key} (${(metrics.largestItem.size / 1024).toFixed(2)}KB)`)
  }
  console.log('Items:', metrics.items)
  console.groupEnd()
}
