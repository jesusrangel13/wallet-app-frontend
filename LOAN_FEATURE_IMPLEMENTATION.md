# 🤝 Sistema de Préstamos - Plan de Implementación

## 📋 Resumen General

Implementar un sistema de préstamos que permita:
- Registrar dinero prestado a otras personas (usuarios o no registrados)
- Trackear pagos parciales y totales
- Ver resumen de préstamos activos y pagados
- Integración transparente con transacciones y balance de cuenta

---

## 🎯 Decisiones de Diseño

### Opción Elegida: **Préstamos como Transacciones Especiales**

**Funcionamiento:**
1. Al prestar dinero → Crea transacción EXPENSE + registro Loan
2. Al recibir pago → Crea transacción INCOME + actualiza Loan
3. Balance de cuenta refleja dinero real que sale/entra

**Ventajas:**
- Balance muestra dinero real disponible
- Historial completo en transacciones
- Integración natural con reportes y estadísticas
- Categorías automáticas identifican préstamos

---

## 📐 Modelo de Datos

### Nuevas Tablas

```prisma
model Loan {
  id              String      @id @default(cuid())
  userId          String      // Quien presta (el usuario actual)
  borrowerName    String      // Nombre del deudor
  borrowerUserId  String?     // Si es usuario registrado (opcional)
  originalAmount  Decimal     @db.Decimal(10, 2)
  paidAmount      Decimal     @default(0) @db.Decimal(10, 2)
  currency        String      @default("CLP")
  loanDate        DateTime    @default(now())
  notes           String?
  status          LoanStatus  @default(ACTIVE)

  // Relaciones
  user            User        @relation("UserLoans", fields: [userId], references: [id], onDelete: Cascade)
  borrowerUser    User?       @relation("BorrowedLoans", fields: [borrowerUserId], references: [id], onDelete: SetNull)
  loanTransaction Transaction? @relation("LoanTransaction")
  payments        LoanPayment[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([userId, status])
  @@index([borrowerUserId])
}

model LoanPayment {
  id              String      @id @default(cuid())
  loanId          String
  amount          Decimal     @db.Decimal(10, 2)
  paymentDate     DateTime    @default(now())
  transactionId   String?     @unique
  notes           String?

  // Relaciones
  loan            Loan        @relation(fields: [loanId], references: [id], onDelete: Cascade)
  transaction     Transaction? @relation(fields: [transactionId], references: [id], onDelete: SetNull)

  createdAt       DateTime    @default(now())

  @@index([loanId])
}

enum LoanStatus {
  ACTIVE      // Tiene saldo pendiente
  PAID        // Completamente pagado
  CANCELLED   // Cancelado/perdonado
}
```

### Modificaciones a Tablas Existentes

```prisma
// Modificar User model
model User {
  // ... campos existentes ...
  loans           Loan[]      @relation("UserLoans")
  borrowedLoans   Loan[]      @relation("BorrowedLoans")
}

// Modificar Transaction model
model Transaction {
  // ... campos existentes ...
  loanId          String?
  loan            Loan?       @relation("LoanTransaction", fields: [loanId], references: [id], onDelete: SetNull)
  loanPayment     LoanPayment?

  @@index([loanId])
}
```

---

## 🎨 Nuevas Categorías

### Categorías Template a Agregar

```typescript
// En backend/src/data/categoryTemplates.ts

// Bajo "Otros Gastos" (EXPENSE)
{
  name: 'Préstamo otorgado',
  icon: '🤝',
  color: '#FF9800',
  type: 'EXPENSE',
  parentName: 'Otros Gastos',
  orderIndex: 7
}

// Bajo "Otros Ingresos" (INCOME)
{
  name: 'Cobro de préstamo',
  icon: '💚',
  color: '#4CAF50',
  type: 'INCOME',
  parentName: 'Otros Ingresos',
  orderIndex: 6
}
```

**Total de categorías:** 82 → 84

---

## 🔧 Backend - Implementación

### Fase 1: Base de Datos y Modelos

#### 1.1 Actualizar Prisma Schema
- **Archivo:** `backend/prisma/schema.prisma`
- **Acción:** Agregar modelos Loan, LoanPayment, enum LoanStatus
- **Acción:** Modificar User y Transaction para relaciones

#### 1.2 Crear Migración
```bash
cd backend
npx prisma migrate dev --name add_loan_system
```

#### 1.3 Actualizar Category Templates
- **Archivo:** `backend/src/data/categoryTemplates.ts`
- **Acción:** Agregar 2 nuevas categorías (total: 84)

---

### Fase 2: Servicios Backend

#### 2.1 Crear Loan Service
- **Archivo:** `backend/src/services/loan.service.ts`

**Funciones principales:**
```typescript
// Crear préstamo
export const createLoan = async (
  userId: string,
  data: {
    borrowerName: string
    borrowerUserId?: string
    amount: number
    accountId: string
    loanDate?: string
    notes?: string
  }
)

// Obtener préstamos del usuario
export const getUserLoans = async (
  userId: string,
  filters?: {
    status?: LoanStatus
    borrowerName?: string
  }
)

// Obtener préstamo por ID
export const getLoanById = async (userId: string, loanId: string)

// Registrar pago de préstamo
export const recordLoanPayment = async (
  userId: string,
  loanId: string,
  data: {
    amount: number
    accountId: string
    paymentDate?: string
    notes?: string
  }
)

// Cancelar/perdonar préstamo
export const cancelLoan = async (userId: string, loanId: string)

// Obtener resumen de préstamos
export const getLoansSummary = async (userId: string)

// Obtener préstamos agrupados por deudor
export const getLoansByBorrower = async (userId: string)
```

#### 2.2 Crear Loan Controller
- **Archivo:** `backend/src/controllers/loan.controller.ts`

**Endpoints:**
```typescript
POST   /api/loans                    // Crear préstamo
GET    /api/loans                    // Listar préstamos (con filtros)
GET    /api/loans/:id                // Obtener préstamo específico
POST   /api/loans/:id/payments       // Registrar pago
PATCH  /api/loans/:id/cancel         // Cancelar préstamo
GET    /api/loans/summary            // Resumen de préstamos
GET    /api/loans/by-borrower        // Agrupar por deudor
DELETE /api/loans/:id                // Eliminar préstamo (solo si no tiene pagos)
```

#### 2.3 Crear Rutas
- **Archivo:** `backend/src/routes/loan.routes.ts`

#### 2.4 Integrar Rutas en App
- **Archivo:** `backend/src/server.ts`
- **Acción:** Agregar `app.use('/api/loans', authenticateToken, loanRoutes)`

---

### Fase 3: Lógica de Negocio

#### 3.1 Crear Préstamo (createLoan)
**Flujo:**
1. Validar usuario y cuenta existen
2. Buscar categoría "Préstamo otorgado"
3. Crear transacción EXPENSE en la cuenta
4. Crear registro Loan vinculado a transacción
5. Actualizar balance de cuenta
6. Retornar préstamo creado

#### 3.2 Registrar Pago (recordLoanPayment)
**Flujo:**
1. Validar préstamo existe y pertenece al usuario
2. Validar monto no excede deuda pendiente
3. Buscar categoría "Cobro de préstamo"
4. Crear transacción INCOME en la cuenta
5. Crear registro LoanPayment vinculado
6. Actualizar `paidAmount` del Loan
7. Si `paidAmount >= originalAmount`, cambiar status a PAID
8. Actualizar balance de cuenta
9. Retornar pago registrado

---

## 🎨 Frontend - Implementación

### Fase 4: API Client y Types

#### 4.1 Agregar Types
- **Archivo:** `frontend/src/types/index.ts`

```typescript
export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export interface Loan {
  id: string
  userId: string
  borrowerName: string
  borrowerUserId?: string
  originalAmount: number
  paidAmount: number
  currency: string
  loanDate: string
  notes?: string
  status: LoanStatus
  loanTransaction?: Transaction
  payments: LoanPayment[]
  createdAt: string
  updatedAt: string
}

export interface LoanPayment {
  id: string
  loanId: string
  amount: number
  paymentDate: string
  transactionId?: string
  transaction?: Transaction
  notes?: string
  createdAt: string
}

export interface CreateLoanData {
  borrowerName: string
  borrowerUserId?: string
  amount: number
  accountId: string
  loanDate?: string
  notes?: string
}

export interface RecordPaymentData {
  amount: number
  accountId: string
  paymentDate?: string
  notes?: string
}

export interface LoansSummary {
  totalLoans: number
  activeLoans: number
  totalLent: number
  totalRecovered: number
  totalPending: number
  currency: string
}

export interface LoansByBorrower {
  borrowerName: string
  borrowerUserId?: string
  totalLoans: number
  totalLent: number
  totalPaid: number
  totalPending: number
  loans: Loan[]
}
```

#### 4.2 Agregar API Client
- **Archivo:** `frontend/src/lib/api.ts`

```typescript
export const loanAPI = {
  create: (data: CreateLoanData) =>
    api.post<ApiResponse<Loan>>('/loans', data),

  getAll: (params?: { status?: LoanStatus; borrowerName?: string }) =>
    api.get<ApiResponse<Loan[]>>('/loans', { params }),

  getById: (id: string) =>
    api.get<ApiResponse<Loan>>(`/loans/${id}`),

  recordPayment: (id: string, data: RecordPaymentData) =>
    api.post<ApiResponse<LoanPayment>>(`/loans/${id}/payments`, data),

  cancel: (id: string) =>
    api.patch<ApiResponse<Loan>>(`/loans/${id}/cancel`),

  getSummary: () =>
    api.get<ApiResponse<LoansSummary>>('/loans/summary'),

  getByBorrower: () =>
    api.get<ApiResponse<LoansByBorrower[]>>('/loans/by-borrower'),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/loans/${id}`)
}
```

---

### Fase 5: Componentes UI

#### 5.1 Crear Loan Badge Indicator
- **Archivo:** `frontend/src/components/LoanIndicator.tsx`
- **Propósito:** Badge para transacciones de préstamo (similar a SharedExpenseIndicator)

**Diseño:**
```tsx
// Compact variant
🤝 Préstamo  |  $50 / $100 pendiente

// Expanded variant
🤝 Préstamo a Juan Pérez
   Monto total: $100
   Pagado: $50 (50%)
   Pendiente: $50
   [Ver detalles] [Registrar pago]
```

#### 5.2 Crear Create Loan Modal
- **Archivo:** `frontend/src/components/CreateLoanModal.tsx`

**Campos:**
- A quién (texto libre con sugerencias del historial)
- Monto
- Cuenta (dropdown)
- Fecha (opcional, default hoy)
- Notas (opcional)

#### 5.3 Crear Record Payment Modal
- **Archivo:** `frontend/src/components/RecordLoanPaymentModal.tsx`

**Campos:**
- Préstamo (readonly info)
- Monto a pagar (máximo: monto pendiente)
- Cuenta donde depositar (dropdown)
- Fecha (opcional, default hoy)
- Notas (opcional)

#### 5.4 Crear Loans Widget
- **Archivo:** `frontend/src/components/widgets/LoansWidget.tsx`
- **Ubicación:** Dashboard principal

**Contenido:**
```
💰 Mis Préstamos
━━━━━━━━━━━━━━━━━━━━━
Total activos: 3
Total pendiente: $250

Juan Pérez        $50 / $100
María García      $200 (100%)
[Ver todos]
```

#### 5.5 Crear Loans Page
- **Archivo:** `frontend/src/app/dashboard/loans/page.tsx`

**Secciones:**
1. **Header con resumen**
   - Total prestado
   - Total recuperado
   - Total pendiente

2. **Tabs:**
   - Activos (status: ACTIVE)
   - Pagados (status: PAID)
   - Todos

3. **Filtros:**
   - Por nombre de deudor
   - Por rango de fecha

4. **Lista de préstamos:**
   - Card por cada préstamo
   - Barra de progreso de pago
   - Botones: "Registrar pago", "Ver detalles"

5. **Vista agrupada por deudor** (toggle)

#### 5.6 Crear Loan Detail Page
- **Archivo:** `frontend/src/app/dashboard/loans/[id]/page.tsx`

**Contenido:**
- Info del préstamo
- Historial de pagos
- Transacción original (link)
- Botones: "Registrar pago", "Cancelar préstamo"

---

### Fase 6: Integración con UI Existente

#### 6.1 Actualizar Dashboard
- **Archivo:** `frontend/src/app/dashboard/page.tsx`
- **Acción:** Agregar LoansWidget

#### 6.2 Actualizar Transactions Page
- **Archivo:** `frontend/src/app/dashboard/transactions/page.tsx`
- **Acción:** Mostrar LoanIndicator para transacciones con loanId

#### 6.3 Actualizar Navigation
- **Archivo:** `frontend/src/components/Navigation.tsx` o similar
- **Acción:** Agregar link "Préstamos" en sidebar

#### 6.4 Actualizar Quick Actions
- **Archivo:** `frontend/src/components/widgets/QuickActionsWidget.tsx`
- **Acción:** Agregar botón "Nuevo Préstamo"

---

## 🧪 Testing

### Backend Tests

```bash
# Archivo: backend/src/services/__tests__/loan.service.test.ts

Test Suite: Loan Service
  ✓ Debe crear préstamo y transacción EXPENSE
  ✓ Debe validar que cuenta exista
  ✓ Debe registrar pago parcial
  ✓ Debe registrar pago total y marcar PAID
  ✓ Debe prevenir pago mayor a deuda
  ✓ Debe cancelar préstamo
  ✓ Debe calcular resumen correctamente
  ✓ Debe agrupar por deudor
```

### Frontend Tests

```bash
# Componentes a testear:
- CreateLoanModal: validaciones de formulario
- RecordLoanPaymentModal: no permitir monto > pendiente
- LoansWidget: mostrar datos correctamente
- LoansPage: filtros y búsqueda
```

---

## 🚀 Plan de Despliegue

### Ramas

**Backend:**
```bash
git checkout -b feature/loan-system-backend
```

**Frontend:**
```bash
git checkout -b feature/loan-system-frontend
```

### Orden de Implementación

#### Sprint 1: Backend Base
1. ✅ Actualizar schema.prisma
2. ✅ Crear migración
3. ✅ Agregar categorías
4. ✅ Crear loan.service.ts
5. ✅ Crear loan.controller.ts
6. ✅ Crear loan.routes.ts
7. ✅ Integrar en server.ts
8. ✅ Probar endpoints con Postman/Insomnia

#### Sprint 2: Frontend Base
1. ✅ Agregar types
2. ✅ Agregar API client
3. ✅ Crear CreateLoanModal
4. ✅ Crear RecordLoanPaymentModal
5. ✅ Crear LoanIndicator
6. ✅ Probar flujo básico

#### Sprint 3: UI Completa
1. ✅ Crear LoansWidget
2. ✅ Crear LoansPage
3. ✅ Crear LoanDetailPage
4. ✅ Integrar en dashboard
5. ✅ Actualizar transactions page
6. ✅ Actualizar navigation

#### Sprint 4: Testing y Refinamiento
1. ✅ Tests backend
2. ✅ Tests frontend
3. ✅ UX polish
4. ✅ Bug fixes

### Merge Strategy

```bash
# 1. Hacer PR de backend primero
# 2. Hacer PR de frontend después
# 3. Merge backend → master
# 4. Merge frontend → master
```

---

## 📝 Checklist de Implementación

### Backend
- [ ] Schema actualizado
- [ ] Migración ejecutada
- [ ] Categorías agregadas
- [ ] loan.service.ts creado y testeado
- [ ] loan.controller.ts creado
- [ ] loan.routes.ts creado
- [ ] Integrado en server.ts
- [ ] Endpoints funcionando

### Frontend
- [ ] Types agregados
- [ ] API client agregado
- [ ] CreateLoanModal creado
- [ ] RecordLoanPaymentModal creado
- [ ] LoanIndicator creado
- [ ] LoansWidget creado
- [ ] LoansPage creada
- [ ] LoanDetailPage creada
- [ ] Dashboard actualizado
- [ ] Transactions page actualizada
- [ ] Navigation actualizada
- [ ] Quick actions actualizada

### Testing
- [ ] Tests backend pasando
- [ ] Tests frontend pasando
- [ ] Testing manual completo
- [ ] Edge cases verificados

### Deployment
- [ ] Backend PR revisado y mergeado
- [ ] Frontend PR revisado y mergeado
- [ ] Migración aplicada en producción
- [ ] Verificación post-deploy

---

## 🔒 Consideraciones de Seguridad

1. **Validaciones:**
   - Usuario solo puede ver/editar sus propios préstamos
   - No permitir montos negativos
   - No permitir pagar más de lo que se debe

2. **Permisos:**
   - Todos los endpoints requieren autenticación
   - Validar ownership en cada operación

3. **Data Integrity:**
   - Usar transacciones de DB para operaciones críticas
   - Validar relaciones existen antes de crear

---

## 📊 Métricas de Éxito

- ✅ Usuario puede crear préstamo en < 30 segundos
- ✅ Usuario puede registrar pago en < 20 segundos
- ✅ Dashboard muestra resumen claro de deudas
- ✅ Transacciones de préstamo claramente identificadas
- ✅ Cero bugs críticos en producción
- ✅ Performance < 200ms para endpoints principales

---

## 🎉 Resultado Final Esperado

### Usuario puede:
1. Crear préstamo desde dashboard o transactions
2. Ver widget con resumen rápido
3. Registrar pagos parciales o totales
4. Ver historial completo de préstamos
5. Ver préstamos agrupados por deudor
6. Identificar fácilmente transacciones de préstamo
7. Balance refleja dinero real en todo momento

### Sistema mantiene:
- Integridad de datos
- Performance óptima
- UX consistente
- Código limpio y mantenible
