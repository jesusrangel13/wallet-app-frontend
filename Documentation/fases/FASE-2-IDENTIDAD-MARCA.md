# Fase 2: Identidad de Marca y Colores

> **Objetivo**: Crear una paleta de colores distintiva y premium que diferencie la app
> **Referencia**: Nubank usa púrpura (#820AD1), Revolut usa dark mode sofisticado

---

## Problema Actual

```css
/* ACTUAL: globals.css - Colores genéricos */
:root {
  --primary: 221.2 83.2% 53.3%;  /* Azul estándar #3B82F6 */
}
```

Este azul es el mismo que usan miles de apps. No es memorable.

---

## Solución: Paleta Premium Distintiva

### ANTES vs DESPUÉS - globals.css

```css
/* ❌ ANTES: frontend/src/app/globals.css */
:root {
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
}

/* ✅ DESPUÉS: Paleta Premium para Fintech */
:root {
  /* Primary: Teal Profundo - Profesional pero distintivo */
  --primary: 172 66% 40%;           /* #1A9B8E - Teal distintivo */
  --primary-foreground: 0 0% 100%;
  --primary-hover: 172 66% 35%;     /* Hover más oscuro */

  /* Colores semánticos financieros */
  --income: 142 76% 36%;            /* Verde para ingresos */
  --income-light: 142 76% 95%;      /* Fondo verde claro */
  --expense: 0 84% 60%;             /* Rojo para gastos */
  --expense-light: 0 84% 95%;       /* Fondo rojo claro */
  --transfer: 217 91% 60%;          /* Azul para transferencias */
  --transfer-light: 217 91% 95%;

  /* Acentos para highlights */
  --accent-gold: 43 96% 56%;        /* Dorado para logros/premium */
  --accent-purple: 262 83% 58%;     /* Púrpura para insights */

  /* Superficies con gradientes sutiles */
  --surface-elevated: 0 0% 100%;
  --surface-sunken: 220 14% 96%;

  /* Sombras premium */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -1px rgb(0 0 0 / 0.04);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -2px rgb(0 0 0 / 0.03);
  --shadow-glow: 0 0 20px 0 hsl(var(--primary) / 0.15);
}

/* Dark Mode Premium (estilo Revolut) */
.dark {
  --background: 222 47% 6%;         /* Casi negro sofisticado */
  --foreground: 210 40% 98%;
  --card: 222 47% 8%;               /* Cards ligeramente elevadas */
  --primary: 172 66% 50%;           /* Teal más brillante en dark */
  --primary-hover: 172 66% 55%;

  /* Gradiente sutil para cards en dark mode */
  --card-gradient: linear-gradient(
    135deg,
    hsl(222 47% 10%) 0%,
    hsl(222 47% 8%) 100%
  );
}
```

---

## Actualización de Card.tsx con Variantes Premium

```tsx
/* ❌ ANTES: frontend/src/components/ui/Card.tsx */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-white rounded-lg shadow-md border border-gray-200 h-full flex flex-col', className)}
        {...props}
      />
    )
  }
)

/* ✅ DESPUÉS: Con variantes premium */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'gradient' | 'glass' | 'highlight'
}

const cardVariants = {
  default: 'bg-white border border-gray-200 shadow-sm',
  elevated: 'bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow',
  gradient: 'bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-md',
  glass: 'bg-white/80 backdrop-blur-lg border border-white/20 shadow-lg',
  highlight: 'bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 shadow-md',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl h-full flex flex-col transition-all duration-200',
          cardVariants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
```

---

## Ejemplo Visual - Comparación de Cards

```
┌─────────────────────────────────────────────────────────────────┐
│                        ANTES                                     │
│  ┌──────────────────┐                                           │
│  │ Card genérica    │  - Borde gris plano                       │
│  │ sin personalidad │  - Sombra básica                          │
│  │                  │  - Sin hover effects                       │
│  └──────────────────┘                                           │
├─────────────────────────────────────────────────────────────────┤
│                        DESPUÉS                                   │
│  ┌──────────────────┐                                           │
│  │ Card elevated    │  - Borde sutil (gray-100)                 │
│  │ ~~~~~~~~~~~~~~~~ │  - Gradiente from-white to-gray-50        │
│  │   hover: ▲       │  - Shadow-lg con hover → shadow-xl        │
│  └──────────────────┘  - Transición suave 200ms                 │
│                                                                  │
│  ┌──────────────────┐                                           │
│  │ Card highlight   │  - Gradiente primary/5 → primary/10       │
│  │ 🌟 Premium feel  │  - Borde primary/20                       │
│  │                  │  - Para widgets importantes                │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dark Mode Toggle - Nuevo Componente

### ThemeToggle.tsx

```tsx
// NUEVO: frontend/src/components/ThemeToggle.tsx

'use client'

import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/themeStore'

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-yellow-400" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-500" />
        )}
      </motion.div>
    </button>
  )
}
```

### themeStore.ts

```tsx
// NUEVO: frontend/src/store/themeStore.ts

import { create } from 'zustand'
import { safeLocalStorage } from '@/lib/storage'

interface ThemeState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: (safeLocalStorage.getItem('theme') as 'light' | 'dark') || 'light',

  setTheme: (theme) => {
    safeLocalStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },

  toggleTheme: () => {
    const current = get().theme
    const next = current === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))
```

---

## Checklist de Implementación

- [ ] Actualizar `globals.css` con nueva paleta de colores
- [ ] Actualizar `Card.tsx` con variantes premium
- [ ] Crear `themeStore.ts`
- [ ] Crear `ThemeToggle.tsx`
- [ ] Agregar ThemeToggle al Navbar/Sidebar
- [ ] Verificar contraste en modo oscuro (WCAG AA)
- [ ] Actualizar colores en todos los widgets
- [ ] Probar transiciones entre modos

---

## Prioridad

| Aspecto | Valor |
|---------|-------|
| Impacto | Alto |
| Esfuerzo | Bajo |
| Prioridad | P0 |
| Tiempo Estimado | 2h |

---

*Parte del documento [UX-UI-MEJORAS.md](../UX-UI-MEJORAS.md)*
