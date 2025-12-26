# Revisión del Plan de Implementación de Inversiones

**Documento Revisado:** `Documentation/IMPLEMENTATION_INVESTMENT.md`
**Fecha de Revisión:** 26 de Diciembre, 2024
**Versión del Plan:** 1.0.0

## 1. Evaluación General

El plan está **bien estructurado y es sólido**. Cubre adecuadamente las tres capas principales (Base de datos, Backend, Frontend) y propone una arquitectura limpia que separa los conceptos de "Inversión" del flujo de caja diario, lo cual es correcto. La elección de APIs (Alpha Vantage, CoinGecko, ExchangeRate) es adecuada para un MVP.

Sin embargo, para asegurar una integración fluida con la aplicación existente y cubrir casos de uso reales de inversión, se han identificado algunos puntos críticos que deben abordarse antes o durante la implementación.

## 2. Hallazgos y Áreas de Mejora

### 2.1. Tipos de Transacción (Faltan Dividendos)
**Observación:** El enum `InvestmentTransactionType` solo contempla `BUY` y `SELL`.
**Problema:** Las inversiones generan ingresos pasivos (Dividendos en Stocks/ETFs, Staking Rewards en Crypto). Actualmente no hay cómo registrarlos.
**Recomendación:** Agregar `DIVIDEND` (o `INTEREST`) al enum.
- **Lógica:** Un dividendo aumenta el `balance` (cash) de la cuenta de inversión sin afectar la `quantity` del holding, pero sí afecta el ROI (Retorno).

### 2.2. Integración con el Balance Total (Net Worth)
**Observación:** La aplicación actual calcula el "Balance Total" sumando `Account.balance`.
**Problema:** En una cuenta de inversión, `Account.balance` suele representar solo el **efectivo no invertido** (Buying Power). El valor de los activos (`Holdings`) fluctúa. Si no se suman los holdings, el patrimonio del usuario se verá incorrecto (solo se verá el cash).
**Recomendación:** Especificar en la **Fase 1** (Backend Core) o **Fase 2** (Frontend) que el servicio de `Account` o el endpoint de `TotalBalance` debe ser actualizado para sumar: `Account.balance (Cash) + InvestmentHoldings.currentValue`.

### 2.3. Manejo de Monedas (Cross-Currency)
**Observación:** Se menciona `currency` en `InvestmentHolding` y en `InvestmentTransaction`.
**Escenario de Riesgo:** Un usuario tiene una cuenta en **CLP** pero compra una acción de Apple en **USD**.
**Problema:**
1. ¿El sistema convierte automáticamente el monto de CLP a USD al momento de la compra usando la tasa del día?
2. ¿Cómo se registra el costo base?
**Recomendación:** Definir explícitamente que si la moneda de la cuenta difiere de la del activo, se debe guardar la **tasa de cambio** usada en la transacción. Esto es vital para calcular ganancias reales ajustadas por tipo de cambio.

### 2.4. Ejecución de Tareas Programadas (Cron Jobs)
**Observación:** Se menciona `cleanOldCache()` para correr como "cron job diario".
**Problema:** La arquitectura actual (según `BACKEND_DOCUMENTATION.md`) no detalla un runner de tareas (ej. BullMQ, node-cron).
**Recomendación:** Implementar `node-cron` en el backend para manejar la limpieza de caché y, potencialmente, la actualización de precios de cierre al final del día.

### 2.5. Flujo de Fondeo (Funding)
**Observación:** El plan menciona `Validar que cuenta sea tipo INVESTMENT` y restar del balance.
**Clarificación:** Es importante documentar el flujo de usuario esperado:
1. Usuario crea Cuenta de Inversión (Balance 0).
2. Usuario hace una `Transferencia` (Regular) desde su Cuenta Bancaria -> Cuenta de Inversión (Aumenta el cash/buying power).
3. Usuario registra una `Buy Transaction` (Disminuye cash, aumenta Holding).
**Recomendación:** Agregar esta aclaración en el apartado de "Flujos" para evitar confusión de que una "Compra" saca dinero directo de una cuenta externa.

## 3. Recomendaciones de Código (Schema Prisma)

Sugerencia de actualización para `backend/prisma/schema.prisma`:

```prisma
enum InvestmentTransactionType {
  BUY
  SELL
  DIVIDEND // Recomendado agregar
}

model InvestmentTransaction {
  // ... campos existentes
  exchangeRate      Decimal? @map("exchange_rate") @db.Decimal(15, 6) // Para compras en moneda distinta a la cuenta
  // ...
}
```

## 4. Conclusión

El plan es viable para comenzar. Recomiendo **aprobarlo con las modificaciones sugeridas** (especialmente Dividendos y la lógica de Balance Total).
