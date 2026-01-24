# Fase 7: Micro-interacciones y Delight

> **Objetivo**: Añadir animaciones de celebración y feedback visual premium
> **Referencia**: Nubank celebra logros con confetti, Robinhood tiene animaciones de stock

---

## Problema Actual

Las animaciones existentes son buenas pero faltan:
- Celebraciones (confetti)
- Feedback háptico visual
- Pull-to-refresh custom
- Animaciones de estado vacío

---

## Solución: Añadir Delight

### Confetti Component

```tsx
// NUEVO: frontend/src/components/ui/animations/Confetti.tsx

'use client'

import { useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
  trigger: boolean
  onComplete?: () => void
}

export function useConfetti() {
  const fire = useCallback((options?: confetti.Options) => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0.5,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#1A9B8E', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899'],
    }

    confetti({
      ...defaults,
      ...options,
      particleCount: 50,
      scalar: 1.2,
      shapes: ['circle', 'square'],
    })

    confetti({
      ...defaults,
      ...options,
      particleCount: 30,
      scalar: 0.75,
      shapes: ['circle'],
    })
  }, [])

  const fireFromElement = useCallback((element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const x = (rect.left + rect.width / 2) / window.innerWidth
    const y = (rect.top + rect.height / 2) / window.innerHeight

    fire({ origin: { x, y } })
  }, [fire])

  return { fire, fireFromElement }
}

// Componente wrapper para trigger automático
export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const { fire } = useConfetti()

  useEffect(() => {
    if (trigger) {
      fire()
      onComplete?.()
    }
  }, [trigger, fire, onComplete])

  return null
}
```

---

### Uso del Confetti

```tsx
// Ejemplo de uso cuando se paga un préstamo completo

import { useConfetti } from '@/components/ui/animations/Confetti'

function LoanPaymentButton({ loan, onPaymentComplete }) {
  const { fire } = useConfetti()

  const handleFullPayment = async () => {
    await recordPayment(loan.id, loan.pendingAmount)

    // Celebrar pago completo
    if (loan.pendingAmount === loan.totalAmount) {
      fire()
      toast.success('🎉 ¡Préstamo pagado completamente!')
    }

    onPaymentComplete()
  }

  return (
    <Button onClick={handleFullPayment}>
      Marcar como Pagado
    </Button>
  )
}
```

---

### SuccessAnimation.tsx

```tsx
// NUEVO: frontend/src/components/ui/animations/SuccessAnimation.tsx

'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface SuccessAnimationProps {
  show: boolean
  message?: string
  onComplete?: () => void
}

export function SuccessAnimation({ show, message, onComplete }: SuccessAnimationProps) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
          delay: 0.1
        }}
        className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center"
      >
        {/* Círculo animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: 'spring' }}
          >
            <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
          </motion.div>
        </motion.div>

        {/* Mensaje */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-lg font-semibold text-gray-900"
        >
          {message || '¡Completado!'}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
```

---

### ShakeAnimation.tsx

```tsx
// NUEVO: frontend/src/components/ui/animations/ShakeAnimation.tsx

'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface ShakeAnimationProps {
  children: ReactNode
  shake: boolean
}

const shakeAnimation = {
  shake: {
    x: [0, -10, 10, -10, 10, -5, 5, 0],
    transition: { duration: 0.5 }
  },
  idle: {
    x: 0
  }
}

export function ShakeAnimation({ children, shake }: ShakeAnimationProps) {
  return (
    <motion.div
      animate={shake ? 'shake' : 'idle'}
      variants={shakeAnimation}
    >
      {children}
    </motion.div>
  )
}

// Uso:
// <ShakeAnimation shake={hasError}>
//   <Input ... />
// </ShakeAnimation>
```

---

### PulseAnimation.tsx

```tsx
// NUEVO: frontend/src/components/ui/animations/PulseAnimation.tsx

'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PulseAnimationProps {
  children: ReactNode
  pulse: boolean
  color?: string
}

export function PulseAnimation({
  children,
  pulse,
  color = 'hsl(var(--primary))'
}: PulseAnimationProps) {
  return (
    <div className="relative">
      {pulse && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </div>
  )
}
```

---

### CountUpAnimation.tsx

```tsx
// NUEVO: frontend/src/components/ui/animations/CountUpAnimation.tsx

'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface CountUpAnimationProps {
  value: number
  duration?: number
  formatValue?: (value: number) => string
}

export function CountUpAnimation({
  value,
  duration = 1,
  formatValue = (v) => v.toLocaleString()
}: CountUpAnimationProps) {
  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0
  })

  const display = useTransform(spring, (current) =>
    formatValue(Math.round(current))
  )

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span>{display}</motion.span>
}

// Uso:
// <CountUpAnimation
//   value={1234567}
//   formatValue={(v) => `$${v.toLocaleString()}`}
// />
```

---

## Casos de Uso para Celebraciones

| Evento | Animación | Componente |
|--------|-----------|------------|
| Préstamo pagado completamente | Confetti | `useConfetti` |
| Meta de ahorro alcanzada | Confetti + Success | `Confetti` + `SuccessAnimation` |
| Primera transacción | Success | `SuccessAnimation` |
| Onboarding completado | Confetti | `Confetti` |
| Error en formulario | Shake | `ShakeAnimation` |
| Nuevo ingreso grande | Pulse | `PulseAnimation` |
| Balance actualizado | CountUp | `CountUpAnimation` |

---

## Instalación de Dependencia

```bash
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```

---

## Checklist de Implementación

- [ ] Instalar `canvas-confetti`
- [ ] Crear `Confetti.tsx` con hook `useConfetti`
- [ ] Crear `SuccessAnimation.tsx`
- [ ] Crear `ShakeAnimation.tsx`
- [ ] Crear `PulseAnimation.tsx`
- [ ] Crear `CountUpAnimation.tsx`
- [ ] Integrar confetti en pago de préstamos
- [ ] Integrar confetti en metas de ahorro
- [ ] Integrar shake en errores de formulario
- [ ] Probar rendimiento en dispositivos móviles

---

## Prioridad

| Aspecto | Valor |
|---------|-------|
| Impacto | Medio |
| Esfuerzo | Medio |
| Prioridad | P2 |
| Tiempo Estimado | 6h |

---

*Parte del documento [UX-UI-MEJORAS.md](../UX-UI-MEJORAS.md)*
