# Plan de Implementación: Integración de Gastos Compartidos con Cuentas Personales

## Estado Actual: ✅ Completado

### 1. Base de Datos
- ✅ Campo `defaultSharedExpenseAccountId` agregado al modelo `User` en Prisma
- ✅ Relación con `Account` configurada correctamente
- ✅ Migración ejecutada: `20251121022524_add_default_shared_expense_account`

### 2. Backend - Servicios y Controladores Base
- ✅ `user.service.ts`: Método `updateDefaultSharedExpenseAccount` implementado
- ✅ `user.service.ts`: Método `getProfile` actualizado para incluir cuenta por defecto
- ✅ `user.controller.ts`: Controlador `updateDefaultSharedExpenseAccount` implementado

---

## Pendiente de Implementación

### 3. Backend - Rutas (PASO 1)
**Archivo:** `/Users/jesusrangel/finance-app/backend/src/routes/user.routes.ts`

**Acción:** Agregar ruta para actualizar cuenta por defecto
```typescript
router.patch('/me/default-shared-expense-account', userController.updateDefaultSharedExpenseAccount);
```

---

### 4. Backend - Servicio de Gastos Compartidos (PASO 2 - CRÍTICO)
**Archivo:** `/Users/jesusrangel/finance-app/backend/src/services/sharedExpense.service.ts`

**Acción:** Modificar método `settleAllBalance` para:

1. **Aceptar `accountId` opcional** del usuario que inicia el pago
2. **Obtener cuentas por defecto** de ambos usuarios si no se proporciona
3. **Crear transacciones** en las cuentas correspondientes
4. **Validaciones:**
   - Si el usuario que inicia tiene `accountId`, usarlo
   - Si no, usar su `defaultSharedExpenseAccountId`
   - Para el otro usuario, usar su `defaultSharedExpenseAccountId`
   - Si alguno no tiene cuenta configurada, solo marcar como pagado sin crear transacción

**Pseudocódigo:**
```typescript
export const settleAllBalance = async (
  userId: string,
  groupId: string,
  otherUserId: string,
  accountId?: string  // <-- NUEVO parámetro opcional
) => {
  // 1. Validaciones existentes...

  // 2. Obtener información de ambos usuarios con sus cuentas por defecto
  const [initiatorUser, otherUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { defaultSharedExpenseAccount: true }
    }),
    prisma.user.findUnique({
      where: { id: otherUserId },
      include: { defaultSharedExpenseAccount: true }
    })
  ]);

  // 3. Determinar cuenta del iniciador
  let initiatorAccountId = accountId;
  if (!initiatorAccountId && initiatorUser?.defaultSharedExpenseAccountId) {
    initiatorAccountId = initiatorUser.defaultSharedExpenseAccountId;
  }

  // 4. Determinar cuenta del otro usuario
  let otherAccountId = otherUser?.defaultSharedExpenseAccountId;

  // 5. Calcular deudas y marcar como pagado (código existente)
  // ... código existente ...

  // 6. NUEVO: Crear transacciones si ambos tienen cuentas
  if (initiatorAccountId && otherAccountId && debtBetweenUsers) {
    const transactionService = require('./transaction.service');

    if (debtBetweenUsers.from.id === userId) {
      // Usuario actual debe dinero (EGRESO)
      await transactionService.createTransaction({
        userId,
        accountId: initiatorAccountId,
        type: 'EXPENSE',
        amount: debtBetweenUsers.amount,
        categoryId: null, // O categoría especial "Pago de deuda"
        description: `Pago a ${otherUser.name} - ${groupName}`,
        date: new Date(),
        sharedExpenseId: null // Podría vincularse si es necesario
      });

      // Otro usuario recibe dinero (INGRESO)
      await transactionService.createTransaction({
        userId: otherUserId,
        accountId: otherAccountId,
        type: 'INCOME',
        amount: debtBetweenUsers.amount,
        categoryId: null,
        description: `Pago de ${initiatorUser.name} - ${groupName}`,
        date: new Date(),
        sharedExpenseId: null
      });
    } else {
      // Usuario actual recibe dinero (INGRESO)
      await transactionService.createTransaction({
        userId,
        accountId: initiatorAccountId,
        type: 'INCOME',
        amount: debtBetweenUsers.amount,
        categoryId: null,
        description: `Pago de ${otherUser.name} - ${groupName}`,
        date: new Date(),
        sharedExpenseId: null
      });

      // Otro usuario paga (EGRESO)
      await transactionService.createTransaction({
        userId: otherUserId,
        accountId: otherAccountId,
        type: 'EXPENSE',
        amount: debtBetweenUsers.amount,
        categoryId: null,
        description: `Pago a ${initiatorUser.name} - ${groupName}`,
        date: new Date(),
        sharedExpenseId: null
      });
    }
  }

  // 7. Retornar resultado (código existente)
  return { payment, settledExpenses, amount, transactionsCreated: !!(initiatorAccountId && otherAccountId) };
};
```

---

### 5. Backend - Controlador de Grupos (PASO 3)
**Archivo:** `/Users/jesusrangel/finance-app/backend/src/controllers/group.controller.ts`

**Acción:** Modificar `settleAllBalance` para aceptar `accountId` en el body
```typescript
export const settleAllBalance = async (req, res, next) => {
  try {
    const userId = (req as any).user.userId;
    const { id: groupId } = req.params;
    const { otherUserId, accountId } = req.body;  // <-- accountId es opcional

    const result = await sharedExpenseService.settleAllBalance(
      userId,
      groupId,
      otherUserId,
      accountId  // <-- pasar accountId
    );

    res.status(200).json({
      success: true,
      data: result,
      message: 'All balances settled successfully',
    });
  } catch (error) {
    next(error);
  }
};
```

---

### 6. Frontend - API Client (PASO 4)
**Archivo:** `/Users/jesusrangel/finance-app/frontend/src/lib/api.ts`

**Acciones:**

1. **Actualizar `settleAllBalance`:**
```typescript
settleAllBalance: (groupId: string, otherUserId: string, accountId?: string) =>
  api.post<ApiResponse<{
    payment: Payment;
    settledExpenses: number;
    amount: number;
    transactionsCreated: boolean;
  }>>(`/groups/${groupId}/settle-balance`, { otherUserId, accountId }),
```

2. **Agregar método para actualizar cuenta por defecto:**
```typescript
updateDefaultSharedExpenseAccount: (accountId: string | null) =>
  api.patch<ApiResponse<User>>('/users/me/default-shared-expense-account', { accountId }),
```

3. **Agregar método para obtener cuentas del usuario:**
```typescript
getAccounts: () => api.get<ApiResponse<Account[]>>('/accounts'),
```

---

### 7. Frontend - Modal de Confirmación (PASO 5)
**Archivo:** `/Users/jesusrangel/finance-app/frontend/src/components/SettleBalanceModal.tsx` (NUEVO)

**Contenido completo:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { formatCurrency } from '@/types/currency';
import { accountAPI } from '@/lib/api';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

interface SettleBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (accountId: string) => Promise<void>;
  amount: number;
  otherUserName: string;
  defaultAccountId?: string | null;
  isReceiving: boolean; // true = te están pagando, false = estás pagando
}

export const SettleBalanceModal = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  otherUserName,
  defaultAccountId,
  isReceiving,
}: SettleBalanceModalProps) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(defaultAccountId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      setSelectedAccountId(defaultAccountId || '');
    }
  }, [isOpen, defaultAccountId]);

  const loadAccounts = async () => {
    try {
      const res = await accountAPI.getAccounts();
      setAccounts(res.data.data.filter((acc: Account) => !acc.isArchived));
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleConfirm = async () => {
    if (!selectedAccountId) return;

    setLoading(true);
    try {
      await onConfirm(selectedAccountId);
      onClose();
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {isReceiving ? 'Confirmar pago recibido' : 'Confirmar pago'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">
              {isReceiving ? 'Recibirás de' : 'Pagarás a'} {otherUserName}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(amount, 'CLP')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isReceiving ? 'Cuenta donde se registrará el ingreso' : 'Cuenta desde donde pagarás'}
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una cuenta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatCurrency(account.balance, account.currency)}
                </option>
              ))}
            </select>
            {defaultAccountId && (
              <p className="text-xs text-gray-500 mt-1">
                Se preseleccionó tu cuenta por defecto para gastos compartidos
              </p>
            )}
          </div>

          {!defaultAccountId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                💡 Configura una cuenta por defecto en Ajustes para agilizar este proceso
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedAccountId || loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### 8. Frontend - Actualizar BalancesWidget (PASO 6)
**Archivo:** `/Users/jesusrangel/finance-app/frontend/src/components/BalancesWidget.tsx`

**Acciones:**

1. **Importar el modal:**
```typescript
import { SettleBalanceModal } from './SettleBalanceModal';
```

2. **Agregar estados para el modal:**
```typescript
const [showSettleModal, setShowSettleModal] = useState(false);
const [settleModalData, setSettleModalData] = useState<{
  groupId: string;
  otherUserId: string;
  otherUserName: string;
  amount: number;
  isReceiving: boolean;
} | null>(null);
const [userDefaultAccountId, setUserDefaultAccountId] = useState<string | null>(null);
```

3. **Cargar cuenta por defecto en useEffect:**
```typescript
useEffect(() => {
  loadBalances();
  loadUserProfile();
}, []);

const loadUserProfile = async () => {
  try {
    const res = await userAPI.getProfile();
    setUserDefaultAccountId(res.data.data.defaultSharedExpenseAccountId);
  } catch (error) {
    console.error('Error loading profile:', error);
  }
};
```

4. **Modificar handleSettleBalance:**
```typescript
const handleSettleBalance = async (groupId: string, otherUserId: string, userName: string, amount: number, isReceiving: boolean) => {
  setSettleModalData({
    groupId,
    otherUserId,
    otherUserName: userName,
    amount,
    isReceiving,
  });
  setShowSettleModal(true);
};
```

5. **Crear función para confirmar pago:**
```typescript
const confirmSettle = async (accountId: string) => {
  if (!settleModalData) return;

  const { groupId, otherUserId } = settleModalData;
  setSettlingBalance(`${groupId}-${otherUserId}`);

  try {
    await groupAPI.settleAllBalance(groupId, otherUserId, accountId);
    toast.success(`Balance saldado exitosamente`);
    await loadBalances();
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Error al saldar balance');
    throw error;
  } finally {
    setSettlingBalance(null);
    setSettleModalData(null);
  }
};
```

6. **Actualizar botones "Saldado" y "Pagué":**
```typescript
// Para "Saldado" (te deben):
<button
  onClick={() => handleSettleBalance(
    groupBalance.group.id,
    person.user.id,
    person.user.name,
    person.amount,
    true  // isReceiving = true
  )}
  disabled={settlingBalance === personKey}
  className="flex-1 text-xs py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
>
  {settlingBalance === personKey ? '...' : 'Saldado'}
</button>

// Para "Pagué" (debes):
<button
  onClick={() => handleSettleBalance(
    groupBalance.group.id,
    person.user.id,
    person.user.name,
    person.amount,
    false  // isReceiving = false
  )}
  disabled={settlingBalance === personKey}
  className="flex-1 text-xs py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
>
  {settlingBalance === personKey ? '...' : 'Pagué'}
</button>
```

7. **Agregar el modal al JSX:**
```typescript
return (
  <>
    <Card>
      {/* ... contenido existente ... */}
    </Card>

    {settleModalData && (
      <SettleBalanceModal
        isOpen={showSettleModal}
        onClose={() => {
          setShowSettleModal(false);
          setSettleModalData(null);
        }}
        onConfirm={confirmSettle}
        amount={settleModalData.amount}
        otherUserName={settleModalData.otherUserName}
        defaultAccountId={userDefaultAccountId}
        isReceiving={settleModalData.isReceiving}
      />
    )}
  </>
);
```

---

### 9. Frontend - Configuración en Settings (PASO 7)
**Archivo:** `/Users/jesusrangel/finance-app/frontend/src/app/dashboard/settings/general/page.tsx`

**Acción:** Agregar sección de configuración de cuenta por defecto

```typescript
// Agregar estado
const [defaultSharedExpenseAccountId, setDefaultSharedExpenseAccountId] = useState<string | null>(null);
const [accounts, setAccounts] = useState<Account[]>([]);

// Cargar en useEffect
useEffect(() => {
  loadProfile();
  loadAccounts();
}, []);

const loadAccounts = async () => {
  try {
    const res = await accountAPI.getAccounts();
    setAccounts(res.data.data.filter(acc => !acc.isArchived));
  } catch (error) {
    console.error(error);
  }
};

// Handler para actualizar
const handleUpdateDefaultAccount = async (accountId: string | null) => {
  try {
    await userAPI.updateDefaultSharedExpenseAccount(accountId);
    setDefaultSharedExpenseAccountId(accountId);
    toast.success('Cuenta por defecto actualizada');
  } catch (error) {
    toast.error('Error al actualizar cuenta por defecto');
  }
};

// Agregar sección en el JSX (después de la sección de moneda)
<div className="border-t pt-6">
  <h3 className="text-lg font-semibold mb-4">Gastos Compartidos</h3>
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Cuenta por defecto para pagos
    </label>
    <select
      value={defaultSharedExpenseAccountId || ''}
      onChange={(e) => handleUpdateDefaultAccount(e.target.value || null)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Sin cuenta por defecto</option>
      {accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.name} ({account.type})
        </option>
      ))}
    </select>
    <p className="text-xs text-gray-500 mt-1">
      Esta cuenta se usará automáticamente para registrar pagos de gastos compartidos
    </p>
  </div>
</div>
```

---

## Orden de Ejecución

1. ✅ Base de datos y modelos
2. ✅ Servicios backend base
3. ✅ Controladores backend base
4. **PASO 1:** Rutas backend
5. **PASO 2:** Modificar servicio de gastos compartidos (CRÍTICO)
6. **PASO 3:** Actualizar controlador de grupos
7. **PASO 4:** API client frontend
8. **PASO 5:** Crear modal de confirmación
9. **PASO 6:** Actualizar BalancesWidget
10. **PASO 7:** Agregar configuración en Settings

---

## Notas Importantes

- Los pasos 1-3 son backend y deben completarse antes de probar
- Los pasos 4-7 son frontend y pueden probarse una vez el backend esté listo
- El modal (PASO 5) es reutilizable para futuras funcionalidades
- La configuración en Settings (PASO 7) es opcional pero mejora UX

---

## Testing Checklist

- [ ] Usuario puede configurar cuenta por defecto en Settings
- [ ] Modal se abre al hacer click en "Saldado" o "Pagué"
- [ ] Modal muestra cuenta por defecto preseleccionada
- [ ] Usuario puede cambiar cuenta en el modal
- [ ] Al confirmar, se crean transacciones en ambas cuentas
- [ ] Balance del grupo se actualiza a $0
- [ ] Si otro usuario marca como pagado, se crea transacción automática
- [ ] Si usuario no tiene cuenta por defecto, solo marca como pagado sin error
