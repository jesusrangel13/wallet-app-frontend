import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeStorage } from '@/lib/storage'

interface SidebarState {
  isCollapsed: boolean
  isMobileOpen: boolean
  toggleCollapse: () => void
  setCollapsed: (collapsed: boolean) => void
  toggleMobileOpen: () => void
  setMobileOpen: (open: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setCollapsed: (collapsed: boolean) => set({ isCollapsed: collapsed }),
      toggleMobileOpen: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
      setMobileOpen: (open: boolean) => set({ isMobileOpen: open }),
    }),
    {
      name: 'sidebar-storage',
      storage: safeStorage,
      partialize: (state) => ({ isCollapsed: state.isCollapsed }),
    }
  )
)
