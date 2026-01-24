# Fase 5: Experiencia de Transacciones

> **Objetivo**: Rediseñar las tarjetas de transacción con timeline visual y mejor UX
> **Referencia**: Nubank tiene un timeline hermoso, Revolut tiene merchant logos

---

## Problema Actual

La lista de transacciones es funcional pero carece de:
- Timeline visual
- Swipe actions (mobile)
- Categorización rápida
- Iconos de merchant/categoría prominentes

---

## Solución: Transaction Card Rediseñada

### TransactionCard.tsx

```tsx
// NUEVO: frontend/src/components/transactions/TransactionCard.tsx

'use client'

import { motion } from 'framer-motion'
import {
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Briefcase,
  MoreVertical,
  ChevronRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface TransactionCardProps {
  id: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  amount: number
  currency: 'CLP' | 'USD' | 'EUR'
  category: string
  categoryIcon?: string
  categoryColor?: string
  description?: string
  payee?: string
  date: Date
  isShared?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

// Mapa de iconos por categoría
const categoryIcons: Record<string, any> = {
  'food': Coffee,
  'shopping': ShoppingBag,
  'transport': Car,
  'housing': Home,
  'work': Briefcase,
  // ... más categorías
}

export function TransactionCard({
  type,
  amount,
  currency,
  category,
  categoryIcon,
  categoryColor = '#6B7280',
  description,
  payee,
  date,
  isShared,
  onEdit,
}: TransactionCardProps) {
  const Icon = categoryIcons[categoryIcon || ''] || ShoppingBag

  const amountColor = {
    EXPENSE: 'text-red-600',
    INCOME: 'text-green-600',
    TRANSFER: 'text-blue-600',
  }[type]

  const amountPrefix = {
    EXPENSE: '-',
    INCOME: '+',
    TRANSFER: '',
  }[type]

  const formattedAmount = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(amount)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
      className="flex items-center gap-4 p-4 cursor-pointer group"
      onClick={onEdit}
    >
      {/* Icono de categoría con color */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${categoryColor}15` }}
      >
        <Icon
          className="w-6 h-6"
          style={{ color: categoryColor }}
        />
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">
            {payee || category}
          </p>
          {isShared && (
            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
              Compartido
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">
          {description || category}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatDistanceToNow(date, { addSuffix: true, locale: es })}
        </p>
      </div>

      {/* Monto */}
      <div className="text-right flex-shrink-0">
        <p className={`font-semibold ${amountColor}`}>
          {amountPrefix}{formattedAmount}
        </p>
      </div>

      {/* Chevron (visible on hover) */}
      <ChevronRight className="w-5 h-5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  )
}
```

---

### TimelineConnector.tsx

```tsx
// NUEVO: frontend/src/components/transactions/TimelineConnector.tsx

'use client'

interface TimelineConnectorProps {
  isFirst?: boolean
  isLast?: boolean
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
}

const dotColors = {
  EXPENSE: 'bg-red-400',
  INCOME: 'bg-green-400',
  TRANSFER: 'bg-blue-400',
}

export function TimelineConnector({ isFirst, isLast, type }: TimelineConnectorProps) {
  return (
    <div className="flex flex-col items-center w-6 mr-2">
      {/* Línea superior */}
      {!isFirst && (
        <div className="w-0.5 h-4 bg-gray-200" />
      )}

      {/* Punto */}
      <div className={`w-3 h-3 rounded-full ${dotColors[type]} ring-4 ring-white`} />

      {/* Línea inferior */}
      {!isLast && (
        <div className="w-0.5 flex-1 bg-gray-200 min-h-[40px]" />
      )}
    </div>
  )
}
```

---

### TransactionList.tsx (con Timeline)

```tsx
// NUEVO: frontend/src/components/transactions/TransactionList.tsx

'use client'

import { TransactionCard } from './TransactionCard'
import { TimelineConnector } from './TimelineConnector'

interface Transaction {
  id: string
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER'
  amount: number
  currency: 'CLP' | 'USD' | 'EUR'
  category: string
  categoryIcon?: string
  categoryColor?: string
  description?: string
  payee?: string
  date: Date
  isShared?: boolean
}

interface TransactionListProps {
  transactions: Transaction[]
  showTimeline?: boolean
  onEdit?: (id: string) => void
}

export function TransactionList({
  transactions,
  showTimeline = true,
  onEdit
}: TransactionListProps) {
  return (
    <div className="divide-y divide-gray-50">
      {transactions.map((transaction, index) => (
        <div key={transaction.id} className="flex">
          {showTimeline && (
            <TimelineConnector
              type={transaction.type}
              isFirst={index === 0}
              isLast={index === transactions.length - 1}
            />
          )}
          <div className="flex-1">
            <TransactionCard
              {...transaction}
              onEdit={() => onEdit?.(transaction.id)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## Diagrama Visual - Transaction List

```
┌─────────────────────────────────────────────────────────────────┐
│  Enero 2026                                    Total: -$450.000 │
├─────────────────────────────────────────────────────────────────┤
│  ●─┬─ ┌──────┐  Uber Eats                         -$12.500     │
│    │  │ 🍔   │  Comida > Delivery                              │
│    │  └──────┘  hace 2 horas                                    │
│    │                                                            │
│  ●─┼─ ┌──────┐  Spotify Premium                   -$5.990      │
│    │  │ 🎵   │  Entretenimiento > Suscripciones                │
│    │  └──────┘  hace 5 horas                                    │
│    │                                                            │
│  ●─┼─ ┌──────┐  Cliente: Proyecto Web            +$850.000     │
│    │  │ 💼   │  Ingresos > Freelance                           │
│    │  └──────┘  ayer                              ────────      │
│    │                                               Verde        │
│  ●─┴─ ┌──────┐  Transferencia a Ahorro           $200.000      │
│       │ 🔄   │  Transfer                                        │
│       └──────┘  hace 2 días                       ────────      │
│                                                    Azul         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mapa de Iconos por Categoría

```tsx
const categoryIconMap: Record<string, { icon: LucideIcon; color: string }> = {
  // Gastos
  'food': { icon: Coffee, color: '#F59E0B' },
  'groceries': { icon: ShoppingCart, color: '#10B981' },
  'transport': { icon: Car, color: '#3B82F6' },
  'housing': { icon: Home, color: '#8B5CF6' },
  'utilities': { icon: Zap, color: '#EF4444' },
  'entertainment': { icon: Film, color: '#EC4899' },
  'health': { icon: Heart, color: '#EF4444' },
  'shopping': { icon: ShoppingBag, color: '#F97316' },
  'education': { icon: GraduationCap, color: '#6366F1' },
  'travel': { icon: Plane, color: '#14B8A6' },

  // Ingresos
  'salary': { icon: Briefcase, color: '#22C55E' },
  'freelance': { icon: Laptop, color: '#10B981' },
  'investment': { icon: TrendingUp, color: '#059669' },
  'other_income': { icon: DollarSign, color: '#16A34A' },

  // Transferencias
  'transfer': { icon: ArrowLeftRight, color: '#3B82F6' },
  'savings': { icon: PiggyBank, color: '#6366F1' },
}
```

---

## Checklist de Implementación

- [ ] Crear `TransactionCard.tsx`
- [ ] Crear `TimelineConnector.tsx`
- [ ] Crear `TransactionList.tsx`
- [ ] Definir mapa completo de iconos por categoría
- [ ] Integrar con página de transacciones existente
- [ ] Agregar swipe actions para mobile (opcional)
- [ ] Agregar animaciones de entrada
- [ ] Probar con datos reales
- [ ] Agregar traducciones

---

## Prioridad

| Aspecto | Valor |
|---------|-------|
| Impacto | Alto |
| Esfuerzo | Medio |
| Prioridad | P1 |
| Tiempo Estimado | 8h |

---

*Parte del documento [UX-UI-MEJORAS.md](../UX-UI-MEJORAS.md)*
