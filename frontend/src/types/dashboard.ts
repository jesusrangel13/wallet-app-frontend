import type { WidgetType } from '@/config/widgets'

export interface WidgetConfig {
  id: string // unique widget instance ID
  type: WidgetType // widget type (e.g., 'cash-flow')
  settings?: {
    [key: string]: any
  }
}

export interface GridLayoutItem {
  i: string // widget instance ID
  x: number // grid x position
  y: number // grid y position
  w: number // width in grid units
  h: number // height in grid units
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
}

export interface DashboardBreakpoints {
  lg: number
  md: number
  sm: number
  xs: number
}

export interface DashboardLayout {
  layout: GridLayoutItem[]
  widgets: WidgetConfig[]
  cols: number
  rowHeight: number
  containerPadding: [number, number]
  margin: [number, number]
}
