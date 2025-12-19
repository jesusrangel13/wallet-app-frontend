# Documentación de Implementación: Sistema de Inversiones

**Fecha de inicio:** 19 de Diciembre, 2024
**Estado actual:** No iniciado
**Versión:** 1.0.0

---

## Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Configuración Inicial](#configuración-inicial)
3. [Fase 1: Database y Backend Core](#fase-1-database-y-backend-core)
4. [Fase 2: Frontend](#fase-2-frontend)
5. [Fase 3: Optimizaciones](#fase-3-optimizaciones)
6. [Fase 4: Features Futuras](#fase-4-features-futuras)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)
9. [Checklist de Progreso](#checklist-de-progreso)

---

## Resumen Ejecutivo

### Objetivo
Implementar un sistema completo de tracking de inversiones que permita a los usuarios:
- Gestionar múltiples tipos de activos (Crypto, Stocks, ETFs, Forex)
- Registrar transacciones de compra/venta
- Calcular automáticamente métricas financieras (ROI, P&L)
- Visualizar portafolio en tiempo real con precios actualizados

### Decisiones de Arquitectura

| Decisión | Opción Elegida | Razón |
|----------|----------------|-------|
| Actualización de balance | Automática | Coherencia con otras cuentas |
| Moneda por defecto | USD | Estándar en APIs financieras |
| Catálogo de activos | Búsqueda dinámica | Flexibilidad y menos mantenimiento |
| Import CSV | Fase 4 | Priorizar MVP funcional |

### Stack Técnico

**Backend:**
- Express.js + TypeScript
- Prisma ORM + PostgreSQL
- APIs externas: CoinGecko, Alpha Vantage, ExchangeRate

**Frontend:**
- Next.js 15 (App Router)
- React Query para state management
- Recharts para gráficos
- Tailwind CSS + shadcn/ui

---

## Configuración Inicial

### 1. API Keys Requeridas

Obtener las siguientes API keys (todas tienen tier gratuito):

#### Alpha Vantage (Stocks/ETFs)
1. Ir a: https://www.alphavantage.co/support/#api-key
2. Registrarse con email
3. Copiar API key
4. Límite free: 25 requests/día

#### ExchangeRate API (Forex)
1. Ir a: https://www.exchangerate-api.com/
2. Registrarse
3. Copiar API key
4. Límite free: 1,500 requests/mes

#### CoinGecko (Crypto) - OPCIONAL
- No requiere API key para tier gratuito
- Límite: 50 requests/minuto
- Para tier Pro (opcional): https://www.coingecko.com/en/api/pricing

### 2. Configurar Variables de Entorno

**Backend (.env):**
```bash
# APIs de Inversiones
ALPHA_VANTAGE_API_KEY=YOUR_KEY_HERE
EXCHANGERATE_API_KEY=YOUR_KEY_HERE
# CoinGecko no requiere key en tier free
```

**Frontend (.env.local):**
```bash
# No se requieren API keys en frontend
# Todas las llamadas se hacen desde backend
```

### 3. Instalar Dependencias Adicionales

**Backend:**
```bash
cd backend
npm install axios
# Prisma ya está instalado
```

**Frontend:**
```bash
cd frontend
# Todas las dependencias ya están instaladas
# React Query, Recharts, Tailwind, etc.
```

---

## Estrategia de Branches y Git Workflow

### ⚠️ IMPORTANTE: No hacer merge a master durante el desarrollo

Esta funcionalidad se desarrollará en un branch aislado para no afectar la versión funcional actual en producción.

### Flujo de Trabajo

1. **Branch principal de la funcionalidad:** `feature/invesment-accounts`
   - Se crea UNA SOLA VEZ desde master al inicio del proyecto
   - Este branch contendrá todo el trabajo de inversiones

2. **Branches por fase:**
   - Cada fase tendrá su propio branch (ej: `feature/investment-system-setup`, `feature/investment-backend-core`, etc.)
   - Todos los branches de fase se crean DESDE `feature/invesment-accounts`
   - Todos los merges de fase van HACIA `feature/invesment-accounts`
   - **NUNCA** se hace merge directo a `master` durante el desarrollo

3. **Merge final a master:**
   - Se realizará mediante Pull Request en GitHub
   - Solo después de completar todas las fases y testing
   - Requiere revisión de código completa

### Comandos Iniciales

```bash
# Crear branch principal de la funcionalidad (SOLO UNA VEZ al inicio)
git checkout master
git pull origin master
git checkout -b feature/invesment-accounts
git push -u origin feature/invesment-accounts
```

### Flujo para cada fase

```bash
# 1. Crear branch de fase desde feature/invesment-accounts
git checkout feature/invesment-accounts
git pull origin feature/invesment-accounts
git checkout -b feature/investment-[nombre-fase]

# 2. Trabajar en la fase (commits frecuentes)
git add .
git commit -m "feat(investments): descripción"

# 3. Al finalizar la fase, merge a feature/invesment-accounts
git checkout feature/invesment-accounts
git pull origin feature/invesment-accounts
git merge feature/investment-[nombre-fase]
git push origin feature/invesment-accounts

# 4. Opcionalmente eliminar branch de fase
git branch -d feature/investment-[nombre-fase]
```

### Visualización de la Estructura de Branches

```
master (producción - NO TOCAR durante desarrollo)
  │
  └─── feature/invesment-accounts (branch principal del proyecto)
         ├─── feature/investment-system-setup (Fase 1.1)
         ├─── feature/investment-backend-core (Fase 1.2-1.5)
         ├─── feature/investment-price-provider (Fase 1.6-1.7)
         ├─── feature/investment-frontend-foundation (Fase 2.1-2.3)
         ├─── feature/investment-ui-components (Fase 2.4-2.7)
         ├─── feature/investment-pages (Fase 2.8-2.10)
         └─── feature/investment-optimizations (Fase 3)
```

### Pull Request Final

Una vez completadas todas las fases:

```bash
# Desde GitHub UI
1. Ir a repository
2. Click en "Pull Requests" -> "New Pull Request"
3. Base: master <- Compare: feature/invesment-accounts
4. Crear PR con descripción completa del feature
5. Solicitar code review
6. Merge después de aprobación
```

---

## FASE 1: Database y Backend Core

### Branch: `feature/investment-system-setup`

#### 1.1 Modificar Schema de Prisma

**Archivo:** `backend/prisma/schema.prisma`

**Acciones:**
1. Agregar 2 nuevos enums al inicio del archivo (después de enums existentes):
   ```prisma
   enum InvestmentAssetType {
     CRYPTO
     STOCK
     ETF
     FOREX
   }

   enum InvestmentTransactionType {
     BUY
     SELL
   }
   ```

2. Agregar 3 nuevos modelos al final del archivo:

```prisma
// Holdings actuales del usuario (posiciones abiertas)
model InvestmentHolding {
  id                    String          @id @default(uuid())
  userId                String          @map("user_id")
  accountId             String          @map("account_id")
  assetSymbol           String          @map("asset_symbol") // BTC, ETH, AAPL, VOO
  assetName             String          @map("asset_name") // Bitcoin, Apple Inc.
  assetType             InvestmentAssetType @map("asset_type")
  totalQuantity         Decimal         @map("total_quantity") @db.Decimal(20, 8)
  averageCostPerUnit    Decimal         @map("average_cost_per_unit") @db.Decimal(15, 2)
  totalCostBasis        Decimal         @map("total_cost_basis") @db.Decimal(15, 2)
  realizedGainLoss      Decimal         @default(0) @map("realized_gain_loss") @db.Decimal(15, 2)
  currency              String          @default("USD")
  createdAt             DateTime        @default(now()) @map("created_at")
  updatedAt             DateTime        @updatedAt @map("updated_at")

  user                  User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  account               Account         @relation(fields: [accountId], references: [id], onDelete: Cascade)
  transactions          InvestmentTransaction[]

  @@unique([accountId, assetSymbol])
  @@index([userId])
  @@index([accountId])
  @@index([userId, accountId])
  @@map("investment_holdings")
}

// Historial de transacciones (compras/ventas)
model InvestmentTransaction {
  id                String                    @id @default(uuid())
  userId            String                    @map("user_id")
  accountId         String                    @map("account_id")
  holdingId         String                    @map("holding_id")
  assetSymbol       String                    @map("asset_symbol")
  assetType         InvestmentAssetType       @map("asset_type")
  type              InvestmentTransactionType
  quantity          Decimal                   @db.Decimal(20, 8)
  pricePerUnit      Decimal                   @map("price_per_unit") @db.Decimal(15, 2)
  totalAmount       Decimal                   @map("total_amount") @db.Decimal(15, 2)
  fees              Decimal                   @default(0) @db.Decimal(15, 2)
  currency          String                    @default("USD")
  transactionDate   DateTime                  @default(now()) @map("transaction_date")
  notes             String?
  createdAt         DateTime                  @default(now()) @map("created_at")
  updatedAt         DateTime                  @updatedAt @map("updated_at")

  user              User                      @relation(fields: [userId], references: [id], onDelete: Cascade)
  account           Account                   @relation(fields: [accountId], references: [id], onDelete: Cascade)
  holding           InvestmentHolding         @relation(fields: [holdingId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([accountId])
  @@index([holdingId])
  @@index([userId, transactionDate])
  @@index([accountId, transactionDate])
  @@map("investment_transactions")
}

// Cache de precios para evitar rate limits
model InvestmentPriceCache {
  id              String          @id @default(uuid())
  assetSymbol     String          @map("asset_symbol")
  assetType       InvestmentAssetType @map("asset_type")
  price           Decimal         @db.Decimal(15, 8)
  currency        String          @default("USD")
  change24h       Decimal?        @map("change_24h") @db.Decimal(10, 4)
  timestamp       DateTime        @default(now())
  source          String          // coingecko, alphavantage, exchangerate

  @@unique([assetSymbol, assetType])
  @@index([assetSymbol])
  @@index([timestamp])
  @@map("investment_price_cache")
}
```

3. Modificar modelo `User` para agregar relaciones:
   ```prisma
   model User {
     // ... campos existentes
     investmentHoldings      InvestmentHolding[]
     investmentTransactions  InvestmentTransaction[]
   }
   ```

4. Modificar modelo `Account` para agregar relaciones:
   ```prisma
   model Account {
     // ... campos existentes
     investmentHoldings      InvestmentHolding[]
     investmentTransactions  InvestmentTransaction[]
   }
   ```

**Ejecutar migración:**
```bash
cd backend
npx prisma migrate dev --name add_investment_system
npx prisma generate
```

**Verificación:**
```bash
npx prisma studio
# Verificar que las nuevas tablas existen:
# - investment_holdings
# - investment_transactions
# - investment_price_cache
```

**Commits:**
```bash
git checkout feature/invesment-accounts
git checkout -b feature/investment-system-setup
git add backend/prisma/schema.prisma
git commit -m "feat(investments): add database schema for investment system"
git add backend/prisma/migrations/
git commit -m "feat(investments): add database migration"
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado | ☐ Testeado

---

### Branch: `feature/investment-backend-core`

#### 1.2 Crear Investment Holding Service

**Archivo:** `backend/src/services/investment-holding.service.ts`

**Funciones a implementar:**

1. `getHoldingsByAccount(userId: string, accountId: string)`
   - Retorna array de holdings con precios actuales
   - Calcula unrealizedGainLoss para cada holding
   - Calcula ROI para cada holding

2. `getHoldingBySymbol(userId: string, accountId: string, assetSymbol: string)`
   - Retorna holding específico con métricas

3. `calculatePortfolioSummary(userId: string, accountId: string)`
   - Retorna objeto con:
     - totalValue (suma de todos los holdings)
     - totalCostBasis
     - totalUnrealizedGainLoss
     - totalRealizedGainLoss
     - overallROI
     - holdingsCount

4. `updateHoldingAfterTransaction(transaction: InvestmentTransaction)`
   - Llamada internamente después de crear/eliminar transacción
   - Recalcula averageCostPerUnit
   - Actualiza totalQuantity
   - Actualiza totalCostBasis

**Fórmulas a implementar:**

```typescript
// Average Cost (weighted average)
const newAvgCost =
  (holding.averageCostPerUnit * holding.totalQuantity +
   transaction.pricePerUnit * transaction.quantity) /
  (holding.totalQuantity + transaction.quantity)

// Unrealized Gain/Loss
const unrealizedPL =
  (currentPrice - holding.averageCostPerUnit) * holding.totalQuantity

// ROI
const roi =
  ((currentValue - holding.totalCostBasis) / holding.totalCostBasis) * 100

// Asset Allocation
const allocation =
  (holdingValue / totalPortfolioValue) * 100
```

**Testing:**
- Unit test para cálculo de average cost
- Unit test para cálculo de ROI
- Integration test para flujo completo

**Commits:**
```bash
git add backend/src/services/investment-holding.service.ts
git commit -m "feat(investments): add holding service with metrics calculation"
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado | ☐ Testeado

---

#### 1.3 Crear Investment Transaction Service

**Archivo:** `backend/src/services/investment-transaction.service.ts`

**Funciones a implementar:**

1. `createTransaction(userId: string, data: CreateInvestmentTransactionData)`
   - Validar que cuenta sea tipo INVESTMENT
   - Si tipo = BUY:
     - Buscar o crear holding
     - Llamar `updateHoldingAfterTransaction()`
     - Actualizar balance: `balance -= (totalAmount + fees)`
   - Si tipo = SELL:
     - Validar que existe holding con suficiente cantidad
     - Calcular realizedGainLoss
     - Actualizar balance: `balance += (totalAmount - fees)`
     - Si quantity llega a 0, mantener holding con quantity = 0
   - Crear registro de transacción
   - Retornar transacción con holding actualizado

2. `getTransactionsByAccount(userId: string, accountId: string, filters?)`
   - Soportar filtros: assetSymbol, type, dateFrom, dateTo
   - Ordenar por transactionDate DESC
   - Retornar con paginación

3. `deleteTransaction(userId: string, transactionId: string)`
   - Validar ownership
   - Revertir efectos en holding
   - Recalcular average cost de transacciones restantes
   - Actualizar balance de cuenta
   - Eliminar registro

4. `calculateRealizedGainLoss(sellTransaction: InvestmentTransaction, holding: InvestmentHolding)`
   - Fórmula: `(sellPrice - averageCost) * quantity`

**Validaciones:**
- Account debe ser tipo INVESTMENT
- Cantidad debe ser > 0
- Precio debe ser > 0
- Para SELL: validar cantidad disponible

**Commits:**
```bash
git add backend/src/services/investment-transaction.service.ts
git commit -m "feat(investments): add transaction service with buy/sell logic"
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado | ☐ Testeado

---

#### 1.4 Crear Controladores y Rutas

**Archivos:**
- `backend/src/controllers/investment.controller.ts`
- `backend/src/routes/investment.routes.ts`

**Endpoints a implementar:**

| Método | Ruta | Descripción | Service |
|--------|------|-------------|---------|
| POST | `/api/investments/transactions` | Crear transacción | transactionService.createTransaction |
| GET | `/api/investments/transactions` | Listar transacciones | transactionService.getTransactionsByAccount |
| DELETE | `/api/investments/transactions/:id` | Eliminar transacción | transactionService.deleteTransaction |
| GET | `/api/investments/accounts/:accountId/holdings` | Listar holdings | holdingService.getHoldingsByAccount |
| GET | `/api/investments/accounts/:accountId/summary` | Resumen portafolio | holdingService.calculatePortfolioSummary |

**Registrar rutas en server.ts:**
```typescript
import investmentRoutes from './routes/investment.routes';
app.use('/api/investments', investmentRoutes);
```

**Commits:**
```bash
git add backend/src/controllers/investment.controller.ts
git add backend/src/routes/investment.routes.ts
git add backend/src/server.ts
git commit -m "feat(investments): add API endpoints for holdings and transactions"
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado | ☐ Testeado

---

#### 1.5 Agregar Validaciones con Zod

**Archivo:** `backend/src/utils/validation.ts`

**Schemas a agregar:**

```typescript
export const createInvestmentTransactionSchema = z.object({
  accountId: z.string().uuid(),
  assetSymbol: z.string().min(1).max(20).toUpperCase(),
  assetName: z.string().min(1).max(100),
  assetType: z.enum(['CRYPTO', 'STOCK', 'ETF', 'FOREX']),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive(),
  pricePerUnit: z.number().positive(),
  fees: z.number().min(0).optional().default(0),
  currency: z.enum(['USD', 'EUR', 'CLP']).default('USD'),
  transactionDate: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const searchAssetsSchema = z.object({
  query: z.string().min(1),
  assetType: z.enum(['CRYPTO', 'STOCK', 'ETF', 'FOREX']).optional(),
});
```

**Aplicar en controladores:**
```typescript
const validatedData = createInvestmentTransactionSchema.parse(req.body);
```

**Commits:**
```bash
git add backend/src/utils/validation.ts
git commit -m "feat(investments): add Zod validation schemas"
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado | ☐ Testeado

---

**MERGE de `feature/investment-system-setup`:**
```bash
git checkout feature/invesment-accounts
git merge feature/investment-system-setup
git push origin feature/invesment-accounts
```

---

### Branch: `feature/investment-backend-core`

Este branch incluye las secciones 1.2 a 1.5 que ya están documentadas arriba en el archivo original.

**Commits iniciales:**
```bash
git checkout feature/invesment-accounts
git checkout -b feature/investment-backend-core
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado | ☐ Testeado

---

**MERGE de `feature/investment-backend-core`:**
```bash
git checkout feature/invesment-accounts
git merge feature/investment-backend-core
git push origin feature/invesment-accounts
```

---

### Branch: `feature/investment-price-provider`

#### 1.6 Crear Price Provider Service

**Archivo:** `backend/src/services/price-provider.service.ts`

**Clase principal:**
```typescript
class PriceProviderService {
  // Config de APIs
  private readonly API_CONFIGS = {
    CRYPTO: {
      baseURL: 'https://api.coingecko.com/api/v3',
      cacheTTL: 5 * 60 * 1000, // 5 min
      rateLimit: 50, // req/min
    },
    STOCK: {
      baseURL: 'https://www.alphavantage.co/query',
      cacheTTL: 15 * 60 * 1000, // 15 min
      rateLimit: 25, // req/día
    },
    FOREX: {
      baseURL: 'https://v6.exchangerate-api.com/v6',
      cacheTTL: 60 * 60 * 1000, // 1 hora
      rateLimit: 1500, // req/mes
    },
  }
}
```

**Funciones a implementar:**

1. `getCurrentPrice(assetSymbol: string, assetType: InvestmentAssetType)`
   - Verificar cache en DB
   - Si cache válido (< TTL), retornar
   - Si expiró, llamar API correspondiente
   - Actualizar cache
   - Retornar precio + change24h

2. `getBatchPrices(symbols: Array<{symbol, assetType}>)`
   - Agrupar por tipo de activo
   - Hacer batch request cuando sea posible
   - Actualizar cache para todos
   - Retornar Map<symbol, priceData>

3. `searchAsset(query: string, assetType?: InvestmentAssetType)`
   - Buscar en API correspondiente
   - Para crypto: CoinGecko `/search`
   - Para stocks: Alpha Vantage `SYMBOL_SEARCH`
   - Retornar array de resultados con:
     - symbol
     - name
     - currentPrice (opcional)
     - exchange (opcional)

4. `updatePriceCache(assetSymbol, assetType, price, change24h, source)`
   - Upsert en tabla InvestmentPriceCache

5. `cleanOldCache()`
   - Eliminar registros > 7 días
   - Ejecutar como cron job diario

**Integración con APIs:**

##### CoinGecko (Crypto)
```typescript
// Precio actual
GET https://api.coingecko.com/api/v3/simple/price
  ?ids=bitcoin,ethereum
  &vs_currencies=usd
  &include_24hr_change=true

// Búsqueda
GET https://api.coingecko.com/api/v3/search?query=bitcoin
```

##### Alpha Vantage (Stocks/ETFs)
```typescript
// Precio actual
GET https://www.alphavantage.co/query
  ?function=GLOBAL_QUOTE
  &symbol=AAPL
  &apikey=YOUR_KEY

// Búsqueda
GET https://www.alphavantage.co/query
  ?function=SYMBOL_SEARCH
  &keywords=apple
  &apikey=YOUR_KEY
```

##### ExchangeRate API (Forex)
```typescript
// Tasas de cambio
GET https://v6.exchangerate-api.com/v6/YOUR_KEY/latest/USD
```

**Manejo de Rate Limiting:**
```typescript
class RateLimiter {
  private queues: Map<string, Queue>;

  async throttle(provider: string, fn: () => Promise<any>) {
    // Implementar cola FIFO con delays
    // Respetar límites de cada API
  }
}
```

**Manejo de Errores:**
- Si API falla, usar último precio cacheado
- Agregar flag `isStale: true` si cache > TTL
- Log de errores para debugging

**Commits:**
```bash
git checkout feature/invesment-accounts
git checkout -b feature/investment-price-provider
git add backend/src/services/price-provider.service.ts
git commit -m "feat(investments): add price provider service with API integrations"
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado | ☐ Testeado

---

#### 1.7 Agregar Endpoints de Precios

**Archivo:** `backend/src/controllers/investment.controller.ts`

Agregar funciones:

```typescript
export const getCurrentPrice = async (req: Request, res: Response) => {
  const { symbol, type } = req.params;
  const price = await priceProviderService.getCurrentPrice(symbol, type);
  res.json({ success: true, data: price });
};

export const getBatchPrices = async (req: Request, res: Response) => {
  const { symbols } = req.body;
  const prices = await priceProviderService.getBatchPrices(symbols);
  res.json({ success: true, data: prices });
};

export const searchAssets = async (req: Request, res: Response) => {
  const { query, assetType } = req.query;
  const results = await priceProviderService.searchAsset(query, assetType);
  res.json({ success: true, data: results });
};
```

**Archivo:** `backend/src/routes/investment.routes.ts`

Agregar rutas:
```typescript
router.get('/prices/current/:symbol/:type', investmentController.getCurrentPrice);
router.post('/prices/batch', investmentController.getBatchPrices);
router.get('/search', investmentController.searchAssets);
```

**Commits:**
```bash
git add backend/src/controllers/investment.controller.ts
git add backend/src/routes/investment.routes.ts
git commit -m "feat(investments): add price and search endpoints"
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado | ☐ Testeado

---

**MERGE de `feature/investment-price-provider`:**
```bash
git checkout feature/invesment-accounts
git merge feature/investment-price-provider
git push origin feature/invesment-accounts
```

---

## FASE 2: Frontend

### Branch: `feature/investment-frontend-foundation`

#### 2.1 Crear Tipos TypeScript

**Archivo:** `frontend/src/types/investment.ts` (NUEVO)

```typescript
export type InvestmentAssetType = 'CRYPTO' | 'STOCK' | 'ETF' | 'FOREX'
export type InvestmentTransactionType = 'BUY' | 'SELL'

export interface InvestmentHolding {
  id: string
  userId: string
  accountId: string
  assetSymbol: string
  assetName: string
  assetType: InvestmentAssetType
  totalQuantity: number
  averageCostPerUnit: number
  totalCostBasis: number
  realizedGainLoss: number
  currency: string
  createdAt: string
  updatedAt: string
  // Campos calculados (del backend)
  currentPrice?: number
  currentValue?: number
  unrealizedGainLoss?: number
  roi?: number
  change24h?: number
}

export interface InvestmentTransaction {
  id: string
  userId: string
  accountId: string
  holdingId: string
  assetSymbol: string
  assetType: InvestmentAssetType
  type: InvestmentTransactionType
  quantity: number
  pricePerUnit: number
  totalAmount: number
  fees: number
  currency: string
  transactionDate: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PortfolioSummary {
  totalValue: number
  totalCostBasis: number
  totalUnrealizedGainLoss: number
  totalRealizedGainLoss: number
  overallROI: number
  holdingsCount: number
  currency: string
}

export interface AssetSearchResult {
  symbol: string
  name: string
  assetType: InvestmentAssetType
  currentPrice?: number
  change24h?: number
  exchange?: string
}
```

**Commits:**
```bash
git checkout feature/invesment-accounts
git checkout -b feature/investment-frontend-foundation
git add frontend/src/types/investment.ts
git commit -m "feat(investments): add TypeScript types"
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado

---

#### 2.2 Extender API Client

**Archivo:** `frontend/src/lib/api.ts`

Agregar al final del archivo:
```typescript
export const investmentAPI = {
  // Transacciones
  createTransaction: (data: any) =>
    api.post('/investments/transactions', data),

  getTransactions: (params: any) =>
    api.get('/investments/transactions', { params }),

  deleteTransaction: (id: string) =>
    api.delete(`/investments/transactions/${id}`),

  // Holdings
  getHoldings: (accountId: string) =>
    api.get(`/investments/accounts/${accountId}/holdings`),

  getPortfolioSummary: (accountId: string) =>
    api.get(`/investments/accounts/${accountId}/summary`),

  // Precios
  getCurrentPrice: (symbol: string, assetType: string) =>
    api.get(`/investments/prices/current/${symbol}/${assetType}`),

  getBatchPrices: (symbols: Array<{ symbol: string; assetType: string }>) =>
    api.post('/investments/prices/batch', { symbols }),

  // Búsqueda
  searchAssets: (query: string, assetType?: string) =>
    api.get('/investments/search', { params: { query, assetType } }),
}
```

**Commits:**
```bash
git add frontend/src/lib/api.ts
git commit -m "feat(investments): extend API client with investment endpoints"
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado

---

#### 2.3 Crear Hooks de React Query

**Archivo:** `frontend/src/hooks/useInvestments.ts` (NUEVO)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { investmentAPI } from '@/lib/api'

// Holdings
export function useInvestmentHoldings(accountId: string) {
  return useQuery({
    queryKey: ['investment-holdings', accountId],
    queryFn: () => investmentAPI.getHoldings(accountId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

// Portfolio Summary
export function usePortfolioSummary(accountId: string) {
  return useQuery({
    queryKey: ['portfolio-summary', accountId],
    queryFn: () => investmentAPI.getPortfolioSummary(accountId),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh cada 5 min
  })
}

// Transacciones
export function useInvestmentTransactions(accountId: string) {
  return useQuery({
    queryKey: ['investment-transactions', accountId],
    queryFn: () => investmentAPI.getTransactions({ accountId }),
    staleTime: 5 * 60 * 1000,
  })
}

// Crear transacción (con optimistic update)
export function useCreateInvestmentTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: investmentAPI.createTransaction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['investment-holdings', variables.accountId])
      queryClient.invalidateQueries(['portfolio-summary', variables.accountId])
      queryClient.invalidateQueries(['investment-transactions', variables.accountId])
      queryClient.invalidateQueries(['accounts'])
    },
  })
}

// Eliminar transacción
export function useDeleteInvestmentTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: investmentAPI.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['investment-holdings'])
      queryClient.invalidateQueries(['portfolio-summary'])
      queryClient.invalidateQueries(['investment-transactions'])
    },
  })
}

// Precios en tiempo real
export function useAssetPrice(symbol: string, assetType: string) {
  return useQuery({
    queryKey: ['asset-price', symbol, assetType],
    queryFn: () => investmentAPI.getCurrentPrice(symbol, assetType),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Polling cada 5 min
  })
}

// Búsqueda de activos
export function useAssetSearch(query: string, assetType?: string) {
  return useQuery({
    queryKey: ['asset-search', query, assetType],
    queryFn: () => investmentAPI.searchAssets(query, assetType),
    enabled: query.length > 0,
    staleTime: 10 * 60 * 1000,
  })
}
```

**Commits:**
```bash
git add frontend/src/hooks/useInvestments.ts
git commit -m "feat(investments): add React Query hooks"
```

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado

---

**MERGE de `feature/investment-frontend-foundation`:**
```bash
git checkout feature/invesment-accounts
git merge feature/investment-frontend-foundation
git push origin feature/invesment-accounts
```

---

### Branch: `feature/investment-ui-components`

**Commits iniciales:**
```bash
git checkout feature/invesment-accounts
git checkout -b feature/investment-ui-components
```

Los componentes principales a crear son:

#### 2.4 Asset Search Component
**Archivo:** `frontend/src/components/investments/AssetSearch.tsx` (NUEVO)

#### 2.5 Investment Transaction Modal
**Archivo:** `frontend/src/components/investments/InvestmentTransactionModal.tsx` (NUEVO)

#### 2.6 Holdings Table Component
**Archivo:** `frontend/src/components/investments/HoldingsTable.tsx` (NUEVO)

#### 2.7 Portfolio Summary Card
**Archivo:** `frontend/src/components/investments/PortfolioSummaryCard.tsx` (NUEVO)

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado

---

**MERGE de `feature/investment-ui-components`:**
```bash
git checkout feature/invesment-accounts
git merge feature/investment-ui-components
git push origin feature/invesment-accounts
```

---

### Branch: `feature/investment-pages`

**Commits iniciales:**
```bash
git checkout feature/invesment-accounts
git checkout -b feature/investment-pages
```

#### 2.8 Página Principal de Inversiones
**Archivo:** `frontend/src/app/[locale]/dashboard/investments/page.tsx` (NUEVO)

#### 2.9 Página de Detalle de Cuenta
**Archivo:** `frontend/src/app/[locale]/dashboard/investments/[accountId]/page.tsx` (NUEVO)

#### 2.10 Internacionalización
**Archivos a modificar:**
- `frontend/messages/es.json`
- `frontend/messages/en.json`
- `frontend/messages/de.json`
- `frontend/messages/fr.json`
- `frontend/messages/it.json`
- `frontend/messages/pt.json`

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado

---

**MERGE de `feature/investment-pages`:**
```bash
git checkout feature/invesment-accounts
git merge feature/investment-pages
git push origin feature/invesment-accounts
```

---

## FASE 3: Optimizaciones y Features Avanzadas

### Branch: `feature/investment-optimizations`

**Commits iniciales:**
```bash
git checkout feature/invesment-accounts
git checkout -b feature/investment-optimizations
```

#### 3.1 Gráficos de Rendimiento
**Archivo:** `frontend/src/components/investments/PortfolioPerformanceChart.tsx` (NUEVO)

#### 3.2 Asset Allocation Chart
**Archivo:** `frontend/src/components/investments/AssetAllocationChart.tsx` (NUEVO)

#### 3.3 Dashboard Widget
**Archivo:** `frontend/src/components/widgets/InvestmentPortfolioWidget.tsx` (NUEVO)

**Estado:** ☐ No iniciado | ☐ En progreso | ☐ Completado

---

**MERGE de `feature/investment-optimizations`:**
```bash
git checkout feature/invesment-accounts
git merge feature/investment-optimizations
git push origin feature/invesment-accounts
```

**Estado final:** Una vez completadas todas las fases y con testing completo, crear Pull Request desde `feature/invesment-accounts` hacia `master` en GitHub.

---

## FASE 4: Features Futuras (Backlog)

### 4.1 Importación CSV
- Branch: `feature/investment-csv-import`
- Permitir importar transacciones históricas

### 4.2 Alertas de Precio
- Branch: `feature/investment-price-alerts`
- Notificaciones cuando activo alcanza precio objetivo

### 4.3 WebSocket Realtime Prices
- Branch: `feature/investment-websocket`
- Usar Supabase Realtime para precios en vivo

### 4.4 Multi-Currency Support
- Branch: `feature/investment-multi-currency`
- Conversión automática entre monedas

---

## Testing

### Unit Tests

**Backend:**
```bash
# backend/src/services/__tests__/investment-holding.service.test.ts
describe('InvestmentHoldingService', () => {
  test('calculates weighted average cost correctly')
  test('calculates ROI correctly')
  test('calculates unrealized P&L correctly')
})

# backend/src/services/__tests__/investment-transaction.service.test.ts
describe('InvestmentTransactionService', () => {
  test('creates BUY transaction and updates holding')
  test('creates SELL transaction and calculates realized P&L')
  test('updates account balance correctly')
  test('prevents SELL when insufficient quantity')
})
```

**Frontend:**
```bash
# frontend/src/components/investments/__tests__/HoldingsTable.test.tsx
describe('HoldingsTable', () => {
  test('renders holdings correctly')
  test('displays P&L with correct color')
  test('sorts by column')
})
```

### Integration Tests

```bash
# backend/src/__tests__/integration/investments.test.ts
describe('Investment System Integration', () => {
  test('full flow: create account -> buy asset -> sell asset -> verify balance')
  test('price caching works correctly')
  test('batch price fetching')
})
```

### E2E Tests (Playwright)

```bash
# frontend/e2e/investments.spec.ts
test('user can create investment transaction', async ({ page }) => {
  // Navigate to investments
  // Click "New Transaction"
  // Search and select asset
  // Fill form
  // Submit
  // Verify holdings updated
})
```

**Ejecutar tests:**
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test

# E2E
npm run test:e2e
```

---

## Troubleshooting

### Problema: API rate limit excedido

**Síntoma:** Error 429 de CoinGecko o Alpha Vantage

**Solución:**
1. Verificar cache está funcionando
2. Aumentar TTL de cache
3. Implementar cola de requests
4. Considerar upgrade a tier Pro

---

### Problema: Precios no se actualizan

**Síntoma:** Holdings muestran precios desactualizados

**Solución:**
1. Verificar que React Query polling está activo
2. Verificar cache en DB
3. Revisar logs de Price Provider Service
4. Forzar invalidación de queries

---

### Problema: Cálculo incorrecto de average cost

**Síntoma:** Average cost no coincide con transacciones

**Solución:**
1. Verificar fórmula de weighted average
2. Revisar que todas las transacciones se consideran
3. Verificar decimales en base de datos
4. Recalcular holding manualmente

---

## Checklist de Progreso

### Fase 1: Database y Backend Core

- [ ] 1.1 Schema de Prisma creado
- [ ] 1.2 Migración ejecutada exitosamente
- [ ] 1.3 Investment Holding Service implementado
- [ ] 1.4 Investment Transaction Service implementado
- [ ] 1.5 Price Provider Service implementado
- [ ] 1.6 Controladores y rutas creados
- [ ] 1.7 Validaciones Zod agregadas
- [ ] 1.8 Tests unitarios backend passing
- [ ] 1.9 Tests integración backend passing

### Fase 2: Frontend

- [ ] 2.1 Tipos TypeScript definidos
- [ ] 2.2 API Client extendido
- [ ] 2.3 Hooks de React Query creados
- [ ] 2.4 Asset Search Component
- [ ] 2.5 Transaction Modal Component
- [ ] 2.6 Holdings Table Component
- [ ] 2.7 Portfolio Summary Card Component
- [ ] 2.8 Página principal de inversiones
- [ ] 2.9 Página de detalle de cuenta
- [ ] 2.10 Internacionalización completa
- [ ] 2.11 Tests frontend passing

### Fase 3: Optimizaciones

- [ ] 3.1 Gráfico de rendimiento
- [ ] 3.2 Gráfico de distribución
- [ ] 3.3 Dashboard widget
- [ ] 3.4 Tests E2E passing

### Fase 4: Features Futuras

- [ ] 4.1 Importación CSV
- [ ] 4.2 Alertas de precio
- [ ] 4.3 WebSocket precios
- [ ] 4.4 Multi-currency

---

## Notas de Implementación

### Consideraciones de Performance

1. **Cache agresivo:**
   - Precios: 5-15 min según volatilidad
   - Holdings: 5 min
   - Transacciones: 10 min

2. **Batch operations:**
   - Agrupar requests de precios
   - Máximo 50 assets por batch

3. **Lazy loading:**
   - Gráficos solo cargar cuando tab activo
   - Imágenes de logos lazy load

### Consideraciones de Seguridad

1. **API Keys:**
   - Solo en backend
   - Variables de entorno
   - Nunca en commits

2. **Validación:**
   - Siempre validar userId = accountId
   - Verificar tipo de cuenta
   - Sanitizar inputs de búsqueda

3. **Rate Limiting:**
   - Implementar en backend
   - Respetar límites de APIs externas

---

---

## Resumen de Workflow Git

### Recordatorio Importante

**⚠️ NUNCA hacer merge directo a `master` durante el desarrollo**

Toda la funcionalidad se desarrolla en el branch `feature/invesment-accounts` y sus branches derivados. El merge final a `master` se hace **únicamente mediante Pull Request en GitHub** después de:

1. ✅ Completar todas las fases (1, 2, 3)
2. ✅ Pasar todos los tests (unit, integration, E2E)
3. ✅ Code review completo
4. ✅ Testing manual en ambiente de staging

### Estructura Final de Branches

```
master (producción)
  │
  └─── feature/invesment-accounts ← MERGE via GitHub PR al final
         │
         ├─── feature/investment-system-setup (Fase 1.1) ✓
         ├─── feature/investment-backend-core (Fase 1.2-1.5) ✓
         ├─── feature/investment-price-provider (Fase 1.6-1.7) ✓
         ├─── feature/investment-frontend-foundation (Fase 2.1-2.3) ✓
         ├─── feature/investment-ui-components (Fase 2.4-2.7) ✓
         ├─── feature/investment-pages (Fase 2.8-2.10) ✓
         └─── feature/investment-optimizations (Fase 3) ✓
```

### Comandos de Referencia Rápida

```bash
# Inicio del proyecto (UNA SOLA VEZ)
git checkout master
git pull origin master
git checkout -b feature/invesment-accounts
git push -u origin feature/invesment-accounts

# Para cada nueva fase
git checkout feature/invesment-accounts
git pull origin feature/invesment-accounts
git checkout -b feature/investment-[nombre-fase]
# ... trabajar en la fase ...
git add .
git commit -m "feat(investments): descripción del cambio"

# Al completar cada fase
git checkout feature/invesment-accounts
git pull origin feature/invesment-accounts
git merge feature/investment-[nombre-fase]
git push origin feature/invesment-accounts

# Al completar TODAS las fases
# Ir a GitHub → New Pull Request
# Base: master ← Compare: feature/invesment-accounts
# Crear PR, solicitar review, y mergear después de aprobación
```

---

**Última actualización:** 19 de Diciembre, 2024
**Responsable:** Jesús Rangel
**Próximos pasos:**
1. Crear branch `feature/invesment-accounts` desde `master`
2. Iniciar Fase 1.1 - Database Schema
