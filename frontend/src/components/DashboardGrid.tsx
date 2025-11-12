'use client'

import { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import GridLayout, { Layout } from 'react-grid-layout'
import { useDashboardStore } from '@/store/dashboardStore'
import { dashboardPreferenceAPI } from '@/lib/api'
import { toast } from 'sonner'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

interface DashboardGridProps {
  children: React.ReactNode
}

export const DashboardGrid = ({ children }: DashboardGridProps) => {
  const { layout, saveLayout } = useDashboardStore()
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [containerWidth, setContainerWidth] = useState(1200)
  const containerRef = useRef<HTMLDivElement>(null)

  // Convert layout to React Grid Layout format
  const gridLayout: Layout[] = useMemo(
    () =>
      layout
        .filter((item) => item.x !== undefined && item.y !== undefined && item.w !== undefined && item.h !== undefined)
        .map((item) => ({
          i: item.i,
          x: Number(item.x),
          y: Number(item.y),
          w: Number(item.w),
          h: Number(item.h),
          minW: item.minW ? Number(item.minW) : 1,
          minH: item.minH ? Number(item.minH) : 1,
          maxW: item.maxW ? Number(item.maxW) : undefined,
          maxH: item.maxH ? Number(item.maxH) : undefined,
          static: false,
        })),
    [layout]
  )

  // Handle layout change with debouncing
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      // Clear previous timer
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      // Convert back to our format and save locally first
      const convertedLayout = newLayout.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
      }))

      saveLayout(convertedLayout)

      // Debounce saving to backend (1 second)
      const timer = setTimeout(async () => {
        try {
          setIsSaving(true)
          await dashboardPreferenceAPI.updateLayout(convertedLayout)
          // toast.success('Layout saved')
        } catch (error) {
          console.error('Error saving layout:', error)
          toast.error('Failed to save layout')
        } finally {
          setIsSaving(false)
        }
      }, 1000)

      setDebounceTimer(timer)
    },
    [debounceTimer, saveLayout]
  )

  // Handle container resize for responsive width
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        setContainerWidth(Math.max(width, 300)) // Min width of 300px
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return (
    <div
      ref={containerRef}
      className="dashboard-grid-wrapper w-full"
    >
      <GridLayout
        className="dashboard-grid"
        layout={gridLayout}
        cols={4}
        rowHeight={100}
        width={containerWidth}
        isResizable={true}
        isDraggable={true}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        containerPadding={[16, 16]}
        margin={[16, 16]}
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms={true}
      >
        {children}
      </GridLayout>

      {/* Saving indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
          Saving layout...
        </div>
      )}
    </div>
  )
}
