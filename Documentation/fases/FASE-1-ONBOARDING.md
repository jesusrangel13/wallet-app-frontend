# Fase 1: Onboarding y Primera Impresión

> **Objetivo**: Crear un flujo de bienvenida guiado que muestre el valor de la app antes de pedir datos
> **Referencia**: Revolut muestra valor antes de pedir datos

---

## Problema Actual

No existe flujo de onboarding. El usuario registra y va directo al dashboard vacío.

---

## Solución: Onboarding de 4 Pasos

### Archivos a Crear

```
frontend/src/app/[locale]/(auth)/onboarding/
├── page.tsx                 # Contenedor principal
├── steps/
│   ├── WelcomeStep.tsx     # Paso 1: Bienvenida + beneficios
│   ├── AccountStep.tsx     # Paso 2: Crear primera cuenta
│   ├── CurrencyStep.tsx    # Paso 3: Moneda y región
│   └── LayoutStep.tsx      # Paso 4: Preset de dashboard
└── components/
    └── OnboardingProgress.tsx
```

---

## Código de Implementación

### WelcomeStep.tsx

```tsx
// NUEVO: frontend/src/app/[locale]/(auth)/onboarding/steps/WelcomeStep.tsx

'use client'

import { motion } from 'framer-motion'
import { TrendingUp, PieChart, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const benefits = [
  {
    icon: TrendingUp,
    title: 'Control Total',
    description: 'Visualiza ingresos y gastos de todos tus clientes'
  },
  {
    icon: PieChart,
    title: 'Insights Inteligentes',
    description: 'Entiende a dónde va tu dinero automáticamente'
  },
  {
    icon: Users,
    title: 'Gastos Compartidos',
    description: 'Divide facturas con socios o colaboradores'
  },
  {
    icon: Zap,
    title: 'Para Freelancers',
    description: 'Separa gastos personales y de negocio fácilmente'
  }
]

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenido a <span className="text-primary">FinanceApp</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-md">
          La forma más inteligente de manejar tus finanzas como freelancer
        </p>
      </motion.div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mb-12">
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
            className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <benefit.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
              <p className="text-sm text-gray-600">{benefit.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button size="lg" onClick={onNext} className="px-12">
          Comenzar
        </Button>
      </motion.div>
    </div>
  )
}
```

---

### OnboardingProgress.tsx

```tsx
// NUEVO: Indicador de progreso visual

'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepLabels
}: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep

        return (
          <div key={index} className="flex items-center">
            {/* Círculo del paso */}
            <motion.div
              initial={false}
              animate={{
                scale: isCurrent ? 1.1 : 1,
                backgroundColor: isCompleted
                  ? 'hsl(var(--primary))'
                  : isCurrent
                    ? 'hsl(var(--primary))'
                    : '#e5e7eb'
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
            >
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className={isCurrent ? 'text-white' : 'text-gray-500'}>
                  {index + 1}
                </span>
              )}
            </motion.div>

            {/* Línea conectora */}
            {index < totalSteps - 1 && (
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted ? 'hsl(var(--primary))' : '#e5e7eb'
                }}
                className="w-12 h-1 mx-2"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

---

## Modificación al AuthStore

```tsx
// MODIFICAR: frontend/src/store/authStore.ts

// Agregar campo para tracking de onboarding
interface AuthState {
  // ... campos existentes
  hasCompletedOnboarding: boolean
  setOnboardingComplete: (complete: boolean) => void
}

// En el store:
hasCompletedOnboarding: false,
setOnboardingComplete: (complete) => set({ hasCompletedOnboarding: complete }),
```

---

## Checklist de Implementación

- [x] Crear estructura de carpetas para onboarding
- [x] Implementar `WelcomeStep.tsx`
- [x] Implementar `AccountStep.tsx`
- [x] Implementar `CurrencyStep.tsx`
- [x] Implementar `LayoutStep.tsx`
- [x] Implementar `OnboardingProgress.tsx`
- [x] Crear `page.tsx` contenedor principal
- [x] Modificar `authStore.ts` para tracking
- [x] Agregar redirección post-registro al onboarding
- [x] Agregar traducciones en `messages/` (Implementado directamente en componentes para español)

---

## Prioridad

| Aspecto | Valor |
|---------|-------|
| Impacto | Alto |
| Esfuerzo | Alto |
| Prioridad | P1 |
| Tiempo Estimado | 16h |

---

*Parte del documento [UX-UI-MEJORAS.md](../UX-UI-MEJORAS.md)*
