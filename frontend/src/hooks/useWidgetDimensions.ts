import { useMemo } from 'react'

// Grid constants from DashboardGrid.tsx
const ROW_HEIGHT = 140
const MARGIN = 16
const CONTAINER_PADDING = 16
const GRID_COLS = 4

// Standard card padding and header sizes
const CARD_PADDING_Y = 24 // pt-6 on CardContent
const CARD_HEADER_HEIGHT = 60 // Approximate header height with title

export interface WidgetDimensions {
  // Pixel dimensions
  width: number
  height: number

  // Content area (excluding card padding)
  contentHeight: number
  contentWidth: number

  // Size classification
  isSmall: boolean
  isMedium: boolean
  isLarge: boolean
  isNarrow: boolean
  isWide: boolean

  // Grid units
  gridWidth: number
  gridHeight: number
}

interface UseWidgetDimensionsOptions {
  hasHeader?: boolean
  customPadding?: number
}

/**
 * Hook to calculate widget dimensions and size classifications
 * from grid layout units
 *
 * @param gridWidth - Width in grid units (1-4)
 * @param gridHeight - Height in grid units (typically 1-10)
 * @param options - Additional options for dimension calculation
 */
export function useWidgetDimensions(
  gridWidth: number = 2,
  gridHeight: number = 2,
  options: UseWidgetDimensionsOptions = {}
): WidgetDimensions {
  const { hasHeader = true, customPadding } = options

  return useMemo(() => {
    // Calculate actual height in pixels
    // Formula: (gridHeight × rowHeight) + ((gridHeight - 1) × margin)
    const height = (gridHeight * ROW_HEIGHT) + ((gridHeight - 1) * MARGIN)

    // Calculate actual width in pixels
    // This is approximate since actual width depends on container width
    // Using a reasonable estimate for typical screen sizes
    const estimatedContainerWidth = 1200 // Typical dashboard width
    const columnWidth = (estimatedContainerWidth - (2 * CONTAINER_PADDING) - ((GRID_COLS - 1) * MARGIN)) / GRID_COLS
    const width = (gridWidth * columnWidth) + ((gridWidth - 1) * MARGIN)

    // Calculate content area (excluding card chrome)
    const padding = customPadding ?? CARD_PADDING_Y
    const headerSize = hasHeader ? CARD_HEADER_HEIGHT : 0
    const contentHeight = height - headerSize - (padding * 2)
    const contentWidth = width - (padding * 2)

    // Size classification
    const isSmall = gridHeight <= 2
    const isMedium = gridHeight >= 3 && gridHeight <= 4
    const isLarge = gridHeight >= 5
    const isNarrow = gridWidth <= 2
    const isWide = gridWidth >= 3

    return {
      width,
      height,
      contentHeight,
      contentWidth,
      isSmall,
      isMedium,
      isLarge,
      isNarrow,
      isWide,
      gridWidth,
      gridHeight,
    }
  }, [gridWidth, gridHeight, hasHeader, customPadding])
}

/**
 * Calculate optimal chart height based on available content height
 * Leaves room for legends, labels, and padding
 */
export function calculateChartHeight(contentHeight: number, options: { hasLegend?: boolean } = {}): number {
  const { hasLegend = false } = options
  const legendSpace = hasLegend ? 40 : 0
  const labelsSpace = 40 // Space for axis labels and padding

  return Math.max(contentHeight - legendSpace - labelsSpace, 100) // Minimum 100px
}

/**
 * Calculate how many list items can fit in the available content height
 */
export function calculateMaxListItems(contentHeight: number, itemHeight: number = 60): number {
  return Math.max(Math.floor((contentHeight) / (itemHeight+20)), 1) // Minimum 1 item
}

/**
 * Get responsive font size based on widget size
 */
export function getResponsiveFontSizes(dimensions: WidgetDimensions) {
  if (dimensions.isSmall) {
    return {
      title: 'text-lg',
      value: 'text-xl',
      label: 'text-xs',
    }
  }

  if (dimensions.isLarge) {
    return {
      title: 'text-2xl',
      value: 'text-4xl',
      label: 'text-base',
    }
  }

  // Medium (default)
  return {
    title: 'text-xl',
    value: 'text-2xl',
    label: 'text-sm',
  }
}
