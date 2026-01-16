# Plan de Optimización Frontend - "Fintech World Class" 🚀

> Este documento contiene el plan **FINAL y EXHAUSTIVO** de optimizaciones. Se ha ordenado por **Criticidad** (Impacto en el usuario y estabilidad) y utiliza la nomenclatura `OPT-X` para fácil seguimiento.

## Prioridad 1: Crítica (Estabilidad & Data Integrity)
*Sin esto, la aplicación es inestable o muestra datos incorrectos.*

### [OPT-1] Estandarización de Data Fetching (Single Source of Truth)
- **Problema**: Widgets como `RecentTransactionsWidget` usan `useEffect` manual para pedir datos. Si el usuario crea un gasto, este widget NO se entera y muestra datos viejos.
- **Solución**: Refactorizar **todos** los widgets para usar los Hooks de React Query (`useTransactions`, `useBalances`).
- **Mejora**: Consistencia de datos absoluta (Zero Data Desync).

### [OPT-2] Granular Error Boundaries
- **Problema**: Si el gráfico de "Inversiones" falla por un error de cálculo, se rompe **toda** la pantalla del Dashboard (Página en blanco).
- **Solución**: Envolver cada Widget individual en un componente `<WidgetErrorBoundary>`.
- **Mejora**: Resiliencia total. Si un widget falla, se muestra un mensaje "Error al cargar widget" solo en ese recuadro, permitiendo reintentar, sin afectar al resto de la app.

### [OPT-3] Modularización de API Monolítica
- **Problema**: `src/lib/api.ts` tiene >700 líneas. Es difícil de mantener y testear.
- **Solución**: Separar en `src/services/auth.service.ts`, `src/services/transactions.service.ts`, etc.
- **Mejora**: Código mantenible, testeable y menos propenso a errores al fusionar ramas.

## Prioridad 2: Alta (UX Premium & Perceived Performance)
*Lo que diferencia a una app "buena" de una "Fintech Top".*

### [OPT-4] Optimistic Updates Globales ("Zero Latency")
- **Problema**: Al pagar una deuda en un Grupo, actualmente se espera a que el servidor responda (0.5s - 1s) para actualizar la UI.
- **Solución**: Aplicar cambios visuales **inmediatamente** al hacer clic, revirtiendo solo si falla el servidor. (Expandir patrón de `useTransactions` a `Groups`, `Budgets`, `Loans`).
- **Mejora**: La app se siente tan rápida como una nativa local.

### [OPT-5] Skeletons "True-to-Life" (Anti-Layout Shift)
- **Problema**: Al cargar, se muestran cajas grises genéricas que luego "saltan" al cambiar de tamaño cuando llega el contenido real (Cumulative Layout Shift).
- **Solución**: Crear Skeletons que imiten **exactamente** la altura y disposición final de cada widget (e.g. un Skeleton de Gráfico Circular que sea redondo, no cuadrado).
- **Mejora**: Experiencia visual suave y profesional. Mejora métricas de Google (CLS).

### [OPT-6] Micro-interacciones & Animaciones (`framer-motion`)
- **Problema**: Los cambios de página y cargas de datos son cortes "secos".
- **Solución**:
    - `PageTransition`: Fade in/out suave al navegar.
    - `AnimatedCounter`: Balances numéricos ruedan hacia arriba al cargar (`0` -> `1,500`).
    - `StaggeredEntry`: Los widgets del dashboard entran en cascada (uno tras otro) en lugar de golpe.
- **Mejora**: "Wow Factor" visual.

## Prioridad 3: Media (Code Quality & A11y)
*Mejoras técnicas y de accesibilidad.*

### [OPT-7] Accesibilidad (A11y) Reforzada
- **Problema**: `Modal.tsx` y `Input.tsx` faltan atributos ARIA avanzados (como `aria-describedby` dinámicos para errores).
- **Solución**: Completar atributos ARIA en componentes base `src/components/ui`. Asegurar navegación por teclado perfecta en menús desplegables.
- **Mejora**: Cumplimiento legal y soporte para lectores de pantalla.

### [OPT-8] Strict Lazy Loading & Bundle Splitting
- **Problema**: Librerías pesadas (Gráficos, Mapas) podrían estar inflando el bundle inicial móvil.
- **Solución**: Usar `next/dynamic` con verificación de `webpack-bundle-analyzer` para asegurar que Dashboard no cargue código de "Reportes Avanzados" si no se usan.
- **Mejora**: Carga inicial (LCP) más rápida en redes 4G.

## Prioridad 4: Baja (Limpieza & Mantenimiento)

### [OPT-9] Optimización de Fuentes e Imágenes
- **Problema**: Configuración `remotePatterns` en `next.config.js` es insegura (`**`).
- **Solución**: Restringir dominios de imágenes permitidos y verificar preloading de fuentes `next/font`.
- **Mejora**: Seguridad y leve mejora en LCP.

### [OPT-10] Persistencia de Estado Segura
- **Problema**: `dashboardStore` guarda todo el layout en `localStorage`. Si crece mucho, puede bloquear el hilo principal al iniciar (JSON.parse).
- **Solución**: Verificar tamaño y usar `partialize` (ya implementado, pero revisar qué campos exactos se guardan) o migrar a `IndexedDB` si escala. *Nota: Revisión actual indica que está aceptable, mantener bajo vigilancia.*

---
**Plan de Ejecución Sugerido:**
1.  **Fase 1 (Sólida)**: OPT-1, OPT-2, OPT-3
2.  **Fase 2 (Rápida)**: OPT-4, OPT-5, OPT-6
3.  **Fase 3 (Pulida)**: OPT-7, OPT-8
