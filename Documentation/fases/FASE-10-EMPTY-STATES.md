# Fase 10: Empty States con Personalidad

> **Objetivo**: Crear empty states atractivos con ilustraciones y CTAs claros
> **Impacto**: Mejor primera impresión y engagement

---

## Problema Actual

```tsx
// ACTUAL: dashboard/page.tsx
{preferences.widgets.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500 mb-4">{t('noWidgets')}</p>
    <AddWidgetButton />
  </div>
)}
```

Empty states sin ilustración ni personalidad.

---

## Solución: Empty States con Ilustraciones y CTAs Claros

### EmptyState.tsx

```tsx
// NUEVO: frontend/src/components/ui/EmptyState.tsx

'use client'

import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  Users,
  PiggyBank,
  FileText,
  Plus
} from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  type: 'transactions' | 'accounts' | 'groups' | 'loans' | 'widgets'
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

const illustrations = {
  transactions: {
    icon: TrendingUp,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  accounts: {
    icon: Wallet,
    bgColor: 'bg-green-50',
    iconColor: 'text-green-500',
  },
  groups: {
    icon: Users,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-500',
  },
  loans: {
    icon: PiggyBank,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-500',
  },
  widgets: {
    icon: FileText,
    bgColor: 'bg-gray-50',
    iconColor: 'text-gray-500',
  },
}

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { icon: Icon, bgColor, iconColor } = illustrations[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Ilustración animada */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className={`w-24 h-24 rounded-full ${bgColor} flex items-center justify-center mb-6`}
      >
        <motion.div
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Icon className={`w-12 h-12 ${iconColor}`} />
        </motion.div>
      </motion.div>

      {/* Texto */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-gray-900 mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-gray-500 max-w-sm mb-6"
      >
        {description}
      </motion.p>

      {/* CTA */}
      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={onAction} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
```

---

## Diagrama Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                         ┌──────────┐                            │
│                         │    📊    │  ← Icono animado           │
│                         │  ~~~~~~  │    (bounce suave)          │
│                         └──────────┘                            │
│                              ↕                                   │
│                    Tu historial comienza aquí                    │
│                                                                  │
│            Registra tu primera transacción y comienza           │
│            a tener control total de tus finanzas.               │
│                                                                  │
│                   ┌─────────────────────┐                       │
│                   │  + Agregar Trans... │ ← CTA prominente      │
│                   └─────────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Ejemplos de Uso

### Transacciones Vacías

```tsx
<EmptyState
  type="transactions"
  title="Tu historial comienza aquí"
  description="Registra tu primera transacción y comienza a tener control total de tus finanzas."
  actionLabel="Agregar Transacción"
  onAction={() => setShowAddModal(true)}
/>
```

### Grupos Vacíos

```tsx
<EmptyState
  type="groups"
  title="Mejor juntos"
  description="Crea un grupo para dividir gastos con amigos, familia o compañeros de trabajo."
  actionLabel="Crear Grupo"
  onAction={() => setShowCreateGroup(true)}
/>
```

### Préstamos Vacíos

```tsx
<EmptyState
  type="loans"
  title="Control de préstamos"
  description="Registra lo que prestas y lo que te deben. Nunca más olvides un préstamo."
  actionLabel="Registrar Préstamo"
  onAction={() => setShowCreateLoan(true)}
/>
```

### Cuentas Vacías

```tsx
<EmptyState
  type="accounts"
  title="Organiza tu dinero"
  description="Agrega tus cuentas bancarias, tarjetas y efectivo para tener una vista completa."
  actionLabel="Agregar Cuenta"
  onAction={() => setShowAddAccount(true)}
/>
```

### Widgets Vacíos

```tsx
<EmptyState
  type="widgets"
  title="Personaliza tu dashboard"
  description="Arrastra widgets aquí para crear tu panel de control personalizado."
  actionLabel="Agregar Widget"
  onAction={() => setShowWidgetPicker(true)}
/>
```

---

## Variante con Ilustración SVG (Avanzado)

```tsx
// Versión con ilustración SVG personalizada

interface EmptyStateWithIllustrationProps extends EmptyStateProps {
  illustration?: React.ReactNode
}

export function EmptyStateWithIllustration({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateWithIllustrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Ilustración personalizada */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="mb-8 w-48 h-48"
      >
        {illustration}
      </motion.div>

      {/* Resto del componente... */}
    </motion.div>
  )
}
```

---

## Textos Sugeridos por Sección

| Sección | Título | Descripción |
|---------|--------|-------------|
| Transacciones | "Tu historial comienza aquí" | "Registra tu primera transacción y comienza a tener control total de tus finanzas." |
| Cuentas | "Organiza tu dinero" | "Agrega tus cuentas bancarias, tarjetas y efectivo para tener una vista completa." |
| Grupos | "Mejor juntos" | "Crea un grupo para dividir gastos con amigos, familia o compañeros de trabajo." |
| Préstamos | "Control de préstamos" | "Registra lo que prestas y lo que te deben. Nunca más olvides un préstamo." |
| Widgets | "Personaliza tu dashboard" | "Arrastra widgets aquí para crear tu panel de control personalizado." |
| Búsqueda | "Sin resultados" | "No encontramos nada con esos filtros. Intenta con otros criterios." |
| Categorías | "Organiza tus gastos" | "Crea categorías personalizadas para entender mejor a dónde va tu dinero." |

---

## Consideraciones de Accesibilidad

```tsx
// Asegurar que el empty state sea accesible

<EmptyState
  type="transactions"
  title="Tu historial comienza aquí"
  description="Registra tu primera transacción..."
  actionLabel="Agregar Transacción"
  onAction={() => setShowAddModal(true)}
  // Props de accesibilidad
  role="region"
  aria-label="Estado vacío de transacciones"
/>

// En el componente:
<motion.div
  role={role}
  aria-label={ariaLabel}
  // ...
>
```

---

## Checklist de Implementación

- [ ] Crear `EmptyState.tsx`
- [ ] Definir ilustraciones/iconos por tipo
- [ ] Escribir textos descriptivos para cada sección
- [ ] Integrar en página de transacciones
- [ ] Integrar en página de cuentas
- [ ] Integrar en página de grupos
- [ ] Integrar en página de préstamos
- [ ] Integrar en dashboard (widgets vacíos)
- [ ] Probar animaciones
- [ ] Agregar traducciones en `messages/`
- [ ] Verificar accesibilidad

---

## Prioridad

| Aspecto | Valor |
|---------|-------|
| Impacto | Medio |
| Esfuerzo | Bajo |
| Prioridad | P1 |
| Tiempo Estimado | 3h |

---

*Parte del documento [UX-UI-MEJORAS.md](../UX-UI-MEJORAS.md)*
