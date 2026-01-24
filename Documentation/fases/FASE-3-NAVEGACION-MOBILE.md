# Fase 3: Navegación Mobile-First

> **Objetivo**: Implementar bottom navigation para mejorar la experiencia mobile
> **Referencia**: Revolut, Nubank, N26 - todas usan bottom nav con 5 items máximo

---

## Problema Actual

```tsx
/* ACTUAL: Sidebar.tsx - Botón flotante en mobile */
<button
  onClick={() => setMobileOpen(!isMobileOpen)}
  className="md:hidden fixed bottom-24 right-6 z-50 p-3 bg-blue-600..."
>
```

El sidebar slide-in no es intuitivo. **Todas las fintechs top usan bottom navigation en mobile**.

---

## Solución: Bottom Navigation Bar

### Diagrama Visual de la Navegación

```
┌─────────────────────────────────────────────────────────────────┐
│                      MOBILE (< 768px)                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │                    CONTENIDO                             │   │
│  │                                                          │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🏠      📊      [+]      💳      ⋯                     │   │
│  │ Inicio  Movs   ──●──   Cuentas  Más                     │   │
│  │                  │                                       │   │
│  │         FAB elevado (como Revolut)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                      DESKTOP (≥ 768px)                          │
│  ┌────────┬────────────────────────────────────────────────┐   │
│  │        │                                                 │   │
│  │  SIDE  │              CONTENIDO                         │   │
│  │  BAR   │                                                 │   │
│  │        │                                                 │   │
│  │        │     (Sin bottom nav, sidebar visible)          │   │
│  └────────┴────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Código de Implementación

### BottomNav.tsx

```tsx
// NUEVO: frontend/src/components/navigation/BottomNav.tsx

'use client'

import { Home, CreditCard, Plus, TrendingUp, MoreHorizontal } from 'lucide-react'
import { usePathname, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { QuickAddModal } from './QuickAddModal'

const navItems = [
  { icon: Home, label: 'Inicio', path: 'dashboard' },
  { icon: TrendingUp, label: 'Movimientos', path: 'dashboard/transactions' },
  { icon: Plus, label: 'Agregar', path: null, isAction: true }, // Acción especial
  { icon: CreditCard, label: 'Cuentas', path: 'dashboard/accounts' },
  { icon: MoreHorizontal, label: 'Más', path: 'dashboard/settings' },
]

export function BottomNav() {
  const pathname = usePathname()
  const params = useParams()
  const locale = params.locale as string
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const isActive = (path: string | null) => {
    if (!path) return false
    const fullPath = `/${locale}/${path}`
    if (path === 'dashboard') return pathname === fullPath
    return pathname.startsWith(fullPath)
  }

  return (
    <>
      {/* Bottom Navigation - Solo visible en mobile */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb"
        aria-label="Navegación principal"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item, index) => {
            // Botón central de agregar (FAB style)
            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  onClick={() => setShowQuickAdd(true)}
                  className="relative -top-4"
                  aria-label="Agregar transacción"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30"
                  >
                    <Plus className="w-7 h-7" />
                  </motion.div>
                </button>
              )
            }

            const active = isActive(item.path)

            return (
              <Link
                key={item.label}
                href={`/${locale}/${item.path}`}
                className="flex flex-col items-center justify-center flex-1 py-2"
                aria-current={active ? 'page' : undefined}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: active ? 1.1 : 1,
                    color: active ? 'hsl(var(--primary))' : '#6b7280'
                  }}
                >
                  <item.icon className="w-6 h-6" />
                </motion.div>
                <span className={`text-xs mt-1 ${active ? 'text-primary font-medium' : 'text-gray-500'}`}>
                  {item.label}
                </span>

                {/* Indicador activo */}
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 w-12 h-1 bg-primary rounded-full"
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Modal de Quick Add */}
      <QuickAddModal
        isOpen={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
      />
    </>
  )
}
```

---

### QuickAddModal.tsx

```tsx
// NUEVO: frontend/src/components/navigation/QuickAddModal.tsx

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Users } from 'lucide-react'
import { useState } from 'react'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
}

const quickActions = [
  {
    icon: ArrowDownLeft,
    label: 'Gasto',
    color: 'bg-red-500',
    type: 'EXPENSE'
  },
  {
    icon: ArrowUpRight,
    label: 'Ingreso',
    color: 'bg-green-500',
    type: 'INCOME'
  },
  {
    icon: ArrowLeftRight,
    label: 'Transferencia',
    color: 'bg-blue-500',
    type: 'TRANSFER'
  },
  {
    icon: Users,
    label: 'Gasto Compartido',
    color: 'bg-purple-500',
    type: 'SHARED'
  },
]

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal desde abajo */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 pb-safe"
          >
            {/* Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Agregar</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    // TODO: Abrir modal de transacción con tipo preseleccionado
                    onClose()
                  }}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className={`p-4 rounded-full ${action.color} text-white`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium text-gray-900">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

## Modificar Layout para incluir BottomNav

```tsx
// MODIFICAR: frontend/src/app/[locale]/dashboard/layout.tsx

import { BottomNav } from '@/components/navigation/BottomNav'

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen">
      <Sidebar /> {/* Se oculta en mobile automáticamente */}

      <main className="md:ml-64 pb-20 md:pb-0"> {/* Padding bottom para BottomNav */}
        {children}
      </main>

      <BottomNav /> {/* Solo visible en mobile */}
    </div>
  )
}
```

---

## CSS para Safe Area (iPhone notch)

```css
/* Agregar a globals.css */

.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.pb-safe {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
}
```

---

## Checklist de Implementación

- [ ] Crear `BottomNav.tsx`
- [ ] Crear `QuickAddModal.tsx`
- [ ] Agregar CSS para safe-area
- [ ] Modificar `dashboard/layout.tsx`
- [ ] Ocultar botón flotante del Sidebar en mobile
- [ ] Agregar padding-bottom al contenido principal
- [ ] Probar en diferentes tamaños de pantalla
- [ ] Probar en dispositivos iOS (notch)
- [ ] Agregar traducciones para labels

---

## Prioridad

| Aspecto | Valor |
|---------|-------|
| Impacto | Alto |
| Esfuerzo | Medio |
| Prioridad | P0 |
| Tiempo Estimado | 4h |

---

*Parte del documento [UX-UI-MEJORAS.md](../UX-UI-MEJORAS.md)*
