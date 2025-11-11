'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WidgetConfig, GridLayoutItem } from '@/types/dashboard'

export interface DashboardPreference {
  id: string
  userId: string
  widgets: WidgetConfig[]
  layout: GridLayoutItem[]
  createdAt: string
  updatedAt: string
}

interface DashboardState {
  // Data
  preferences: DashboardPreference | null
  widgets: WidgetConfig[]
  layout: GridLayoutItem[]

  // UI State
  isLoading: boolean
  error: string | null

  // Actions
  setPreferences: (prefs: DashboardPreference) => void
  setWidgets: (widgets: WidgetConfig[]) => void
  setLayout: (layout: GridLayoutItem[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Widget operations
  addWidget: (widget: WidgetConfig) => void
  removeWidget: (widgetId: string) => void
  updateWidgetSettings: (widgetId: string, settings: Record<string, any>) => void
  updateWidgetHeight: (widgetId: string, height: number) => void

  // Preferences operations
  loadPreferences: (prefs: DashboardPreference) => void
  saveLayout: (layout: GridLayoutItem[]) => void
  resetToDefaults: (defaultPrefs: DashboardPreference) => void

  // Clear
  clear: () => void
}

const defaultPreferences: DashboardPreference = {
  id: '',
  userId: '',
  widgets: [],
  layout: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      // Initial state
      preferences: null,
      widgets: [],
      layout: [],
      isLoading: false,
      error: null,

      // Setters
      setPreferences: (prefs) =>
        set({
          preferences: prefs,
          widgets: prefs.widgets,
          layout: prefs.layout,
        }),

      setWidgets: (widgets) => set({ widgets }),

      setLayout: (layout) => set({ layout }),

      setIsLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      // Widget operations
      addWidget: (widget) =>
        set((state) => ({
          widgets: [...state.widgets, widget],
        })),

      removeWidget: (widgetId) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== widgetId),
          layout: state.layout.filter((l) => l.i !== widgetId),
        })),

      updateWidgetSettings: (widgetId, settings) =>
        set((state) => ({
          widgets: state.widgets.map((w) => {
            if (w.id === widgetId) {
              return {
                ...w,
                settings: {
                  ...w.settings,
                  ...settings,
                },
              }
            }
            return w
          }),
        })),

      updateWidgetHeight: (widgetId, height) =>
        set((state) => ({
          layout: state.layout.map((item) => {
            if (item.i === widgetId) {
              return {
                ...item,
                h: height,
              }
            }
            return item
          }),
          preferences: state.preferences
            ? {
                ...state.preferences,
                layout: state.layout.map((item) => {
                  if (item.i === widgetId) {
                    return {
                      ...item,
                      h: height,
                    }
                  }
                  return item
                }),
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      // Preferences operations
      loadPreferences: (prefs) =>
        set({
          preferences: prefs,
          widgets: prefs.widgets,
          layout: prefs.layout,
        }),

      saveLayout: (layout) =>
        set((state) => ({
          layout,
          preferences: state.preferences
            ? {
                ...state.preferences,
                layout,
                updatedAt: new Date().toISOString(),
              }
            : null,
        })),

      resetToDefaults: (defaultPrefs) =>
        set({
          preferences: defaultPrefs,
          widgets: defaultPrefs.widgets,
          layout: defaultPrefs.layout,
        }),

      // Clear
      clear: () =>
        set({
          preferences: null,
          widgets: [],
          layout: [],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        preferences: state.preferences,
        widgets: state.widgets,
        layout: state.layout,
      }),
    }
  )
)
