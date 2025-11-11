'use client'

import { createContext, useContext, useState } from 'react'

interface DashboardContextType {
  onAddWidget: (() => void) | null
  setOnAddWidget: (callback: (() => void) | null) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [onAddWidget, setOnAddWidget] = useState<(() => void) | null>(null)

  return (
    <DashboardContext.Provider value={{ onAddWidget, setOnAddWidget }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within DashboardProvider')
  }
  return context
}
