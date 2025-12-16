# Plan de Desarrollo Detallado - Finance App Mobile (React Native)

Este documento detalla paso a paso el proceso de desarrollo para la versión móvil de Finance App. Este plan está diseñado para asegurar una implementación robusta, escalable y de alta calidad, priorizando la experiencia de usuario nativa y el rendimiento.

## 🔄 Estrategia de Reutilización de Código

Una de las mayores ventajas de este plan es la alta reutilización del código existente del frontend web.

### ✅ 100% Reutilizable (Copy & Paste)
Estos archivos se pueden copiar directamente del proyecto web a la carpeta `src` del móvil con cambios mínimos o nulos:
- **Lógica de Negocio (Hooks)**: `useTransactions.ts`, `useAccounts.ts`, `useAuth.ts`, etc. (La lógica de React Query es idéntica).
- **Gestión de Estado (Zustand)**: `authStore.ts`, `dashboardStore.ts`. (Solo se cambia `localStorage` por `AsyncStorage` en la configuración de persistencia).
- **Servicios API**: Funciones de llamadas a API (Axios).
- **Tipos TypeScript**: `types/index.ts`, `types/api.ts`.
- **Utilidades**: `formatters.ts`, `dateUtils.ts`, `validators.ts`.
- **Validaciones**: Schemas de Zod y archivos de configuración de formularios.

---

# 📅 Plan de Ejecución por Fases

## 🛠 Fase 1: Configuración Core y Arquitectura (Días 1-2)

### 1.1 Configuración del Entorno y Proyecto
- [ ] **Inicializar Proyecto Expo**: Crear el proyecto usando TypeScript.
  - Comando: `npx create-expo-app@latest finance-mobile -t expo-template-blank-typescript`
  - *Razón*: Expo ofrece la mejor experiencia de desarrollo, manejo de dependencias nativas y actualizaciones OTA.
- [ ] **Configuración de Alias**: Configurar `tsconfig.json` y `babel.config.js` para soportar absolute imports (`@/components`, `@/hooks`, etc.), replicando la estructura del frontend web.
- [ ] **Linters y Formatter**: Copiar configuración de ESLint y Prettier del web para mantener consistencia de código.
- [ ] **Estructura de Carpetas**: Crear la estructura definida en `APP_DOCUMENTATION.md`:
  - `src/screens`, `src/components`, `src/navigation`, `src/hooks`, `src/services`, `src/store`, `src/theme`, `src/utils`, `src/types`.

### 1.2 Dependencias y Servicios Base
- [ ] **Instalar Dependencias**: React Navigation, React Query, Zustand, Axios, React Hook Form, Zod.
- [ ] **Axios Client**: Crear `src/services/api/client.ts` con interceptores para JWT.
- [ ] **React Query**: Configurar `QueryClient` con persistencia en `App.tsx`.
- [ ] **Auth Store**: Implementar `useAuthStore` con persistencia en `AsyncStorage`.

---

## 🏗 Fase 2: Migración y Adaptación de Código (Días 3-4)

En esta fase, traemos el código "lógico" de la web y preparamos las bases para los componentes visuales.

### 2.1 Migración de Lógica (Copy & Paste)
- [ ] Copiar carpeta `hooks/` completa (excepto hooks específicos de UI web).
- [ ] Copiar carpeta `services/api/` completa.
- [ ] Copiar carpeta `types/` completa.
- [ ] Copiar carpeta `utils/` completa.
- [ ] Copiar validaciones de Zod (`schema.ts` o similares).

### 2.2 Migración de UI (Estrategia de Transformación)
Para cada componente que necesite ser portado (ej. `TransactionCard`), seguir este mapa de transformación:

| Web (HTML) | React Native | Notas |
|------------|--------------|-------|
| `<div>`, `<section>` | `<View>` | Usar Flexbox para layout. |
| `<span>`, `<p>`, `<h1>` | `<Text>` | **Obligatorio**: Todo texto dentro de `<Text>`. |
| `<button>`, `onClick` | `<TouchableOpacity>`, `onPress` | Feedback táctil es crítico. |
| `<input>` | `<TextInput>` | Sin etiqueta de cierre. |
| `<ul>`, `.map()` | `<FlatList>`, `<FlashList>` | Para listas scrollables. |
| Scroll | `<ScrollView>` | El scroll no es automático. |

**Tarea**:
- [ ] Identificar componentes web reutilizables.
- [ ] Crear versiones `.native.tsx` o `.tsx` en la carpeta `src/components` del móvil siguiendo la tabla anterior.
- [ ] Reutilizar la misma lógica de props y hooks internos que la versión web.

---

## 🎨 Fase 3: Sistema de Diseño Compartido (Día 5)

Para asegurar consistencia visual 100% con la web sin sacrificar UX nativa.

### 3.1 Tokens de Diseño
- [ ] **Colores**: Crear `src/theme/colors.ts` copiando la paleta de Tailwind.
- [ ] **Tipografía**: Crear `src/theme/fonts.ts` copiando las definiciones de fuenta (tamaño, peso).
- [ ] **Espaciado**: Crear `src/theme/spacing.ts` para márgenes y paddings consistentes.

### 3.2 Componentes Primitivos (UI Kit)
Crear componentes base que usen estos tokens para asegurar que los "ladrillos" de la app sean idénticos a la web.
- [ ] `AppText`: Componente de texto con la fuente correcta por defecto.
- [ ] `AppButton`: Botón con los mismos estados (primary, secondary, danger) y estilos que la web.
- [ ] `AppInput`: Input con el mismo borde, padding y estados de error.
- [ ] `AppCard`: Contenedor con la sombra y bordes redondeados estándar.

---

## � Fase 4: Autenticación y Onboarding (Días 6-7)

### 4.1 Navegación Auth
- [ ] Crear `AuthNavigator` (Stack).
- [ ] Screens: `Login`, `Register`, `Onboarding`.

### 4.2 Pantallas
- [ ] **Login**: Reutilizar hook `useLogin`. Maquetar con `AppInput` y `AppButton`.
- [ ] **Biometría**: Implementar login con FaceID/TouchID si hay token guardado.

---

## 📱 Fase 5: Dashboard Core (Días 8-10)

### 5.1 Navegación Principal
- [ ] `DashboardNavigator` (Bottom Tabs): Home, Transactions, Groups, Menu.

### 5.2 Pantalla Inicio
- [ ] **Widgets**: Adaptar widgets web (`BalanceWidget`, `RecentTransactions`).
  - Usar `AppCard` como contenedor.
  - Reutilizar hooks `useAccounts` y `useTransactions`.
- [ ] **Pull-to-Refresh**: Implementar recarga de datos nativa.

---

## 💸 Fase 6: Transacciones (Días 11-13)

### 6.1 Listado
- [ ] `TransactionsScreen` con `FlashList` (optimización crítica).
- [ ] **Items**: `TransactionItem` (portado de web) optimizado con `React.memo`.

### 6.2 Creación/Edición
- [ ] `TransactionFormScreen` (Modal).
- [ ] Reutilizar lógica de `react-hook-form` del web.
- [ ] **Inputs Nativos**:
  - Reemplazar `<select>` web por `ActionSheet` o `Modal` nativo para Categorías y Cuentas.
  - DatePicker nativo (iOS/Android) para fechas.

---

## 🏦 Fase 7: Cuentas y Préstamos (Días 14-15)

### 7.1 Cuentas
- [ ] `AccountsScreen`: Lista de tarjetas visualmente atractiva.
  - Reutilizar lógica de cálculo de balances.

### 7.2 Préstamos
- [ ] `LoansScreen`.
- [ ] Funcionalidad de registrar pagos (reutilizando mutation `recordLoanPayment`).

---

## 👥 Fase 8: Grupos (Días 16-17)

### 8.1 Funcionalidad Splitwise
- [ ] `GroupsScreen` y `GroupDetailScreen`.
- [ ] Reutilizar lógica compleja de división de gastos (Hooks de 'split logic').
- [ ] Adaptar UI de selección de participantes para ser "touch-friendly".

---

## 📷 Fase 9: Características Nativas (Días 18-19)

### 9.1 Hardware Integration
- [ ] **Cámara (OCR)**: Integrar escaneo de recibos para pre-llenar transacciones.
- [ ] **Geolocalización**: Guardar coordenadas al crear transacciones.
- [ ] **Notificaciones**: Configurar Push Notifications para gastos compartidos.
- [ ] **Haptics**: Feedback vibratorio al realizar acciones exitosas.

---

## ⚙️ Fase 10: Optimización y Pulido (Día 20)

### 10.1 Performance
- [ ] Auditar re-renders con React DevTools.
- [ ] Optimizar imágenes con `expo-image`.

### 10.2 UX
- [ ] Animaciones de entrada (Screen transitions).
- [ ] Manejo de "Empty States" y "Loading Skeletons".

---

## 🚀 Fase 11: Deployment (Día 21+)

### 11.1 Build
- [ ] Configurar `eas.json`.
- [ ] Generar builds de producción (`.apk`, `.ipa`).

### 11.2 Publicación
- [ ] Subir a TestFlight (iOS) y Google Play Console (Android).
