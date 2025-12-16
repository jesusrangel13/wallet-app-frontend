# Plan de Pruebas - Corrección de Doble Afectación de Balance

## 🎯 Objetivo
Verificar que el problema de doble afectación del balance en transacciones compartidas ha sido corregido.

## 📋 Pre-requisitos
- ✅ Frontend corriendo en: http://localhost:3000
- ✅ Backend corriendo en: http://localhost:3001
- ✅ Usuarios de prueba:
  - Pedro Perez (pedroperez@gmail.com)
  - Juan Perez (juanperez@gmail.com)

## 🧪 Escenarios de Prueba

### ESCENARIO 1: Crear gasto donde YO pagué ✓

**Objetivo:** Verificar que cuando el usuario logueado crea un gasto y marca que ÉL pagó, su balance se afecta correctamente.

**Pasos:**
1. Login como `pedroperez@gmail.com`
2. Anotar el balance actual de la cuenta de Pedro
3. Ir a "Transacciones" → "Nueva Transacción"
4. Llenar el formulario:
   - Tipo: EXPENSE
   - Monto: 100,000
   - Descripción: "Test - Yo pagué"
   - Marcar checkbox "¿Es un gasto compartido?"
5. En la sección de gasto compartido:
   - Grupo: "familia" (o el grupo que tengas con Juan)
   - **"¿Quién pagó?": Seleccionar "Pedro Perez" (tú mismo)**
   - División: 60% Pedro, 40% Juan (o EQUAL)
6. Guardar
7. Verificar el mensaje: Debería decir "Shared expense created successfully"
8. Verificar balance de cuenta de Pedro

**Resultado Esperado:**
- ✅ Se crea el SharedExpense
- ✅ Se crea una Transaction para Pedro
- ✅ Balance de Pedro disminuye en 100,000 inmediatamente
- ✅ Mensaje de éxito normal

---

### ESCENARIO 2: Crear gasto donde OTRO pagó ✓ (CASO DEL BUG CORREGIDO)

**Objetivo:** Verificar que cuando el usuario logueado crea un gasto pero OTRO usuario pagó, su balance NO se afecta hasta que marque como "pagado".

**Pasos:**
1. Login como `pedroperez@gmail.com`
2. Anotar el balance actual de la cuenta de Pedro
3. Ir a "Transacciones" → "Nueva Transacción"
4. Llenar el formulario:
   - Tipo: EXPENSE
   - Monto: 100,000
   - Descripción: "Test - Juan pagó"
   - Marcar checkbox "¿Es un gasto compartido?"
5. En la sección de gasto compartido:
   - Grupo: "familia"
   - **"¿Quién pagó?": Seleccionar "Juan Perez" (OTRO usuario)**
   - División: 60% Pedro, 40% Juan (o EQUAL 50/50)
6. Guardar
7. Verificar el mensaje
8. Verificar balance de cuenta de Pedro

**Resultado Esperado:**
- ✅ Se crea el SharedExpense
- ✅ NO se crea una Transaction para Pedro
- ✅ **Balance de Pedro NO cambia** (queda igual)
- ✅ Mensaje dice: "Shared expense created successfully. Mark as paid when you settle your portion."

**Importante:** Este es el caso que estaba fallando antes. Antes se restaban 100,000 inmediatamente.

---

### ESCENARIO 3: Marcar como "pagado" el gasto del Escenario 2 ✓

**Objetivo:** Verificar que al marcar como "pagado", ahora SÍ se afecta el balance correctamente.

**Pasos:**
1. Continuar logueado como `pedroperez@gmail.com`
2. Anotar balance actual de Pedro (debería ser el mismo de antes de crear el gasto)
3. Ir a "Grupos" → Seleccionar el grupo "familia"
4. Buscar el gasto "Test - Juan pagó" en la lista de gastos compartidos
5. Encontrar la fila donde Pedro aparece como participante
6. Click en botón "Mark as Paid" (Marcar como Pagado)
7. Si solicita seleccionar cuenta, seleccionar la cuenta de Pedro
8. Confirmar
9. Verificar balance de cuenta de Pedro

**Resultado Esperado:**
- ✅ Se crea una Transaction de tipo EXPENSE para Pedro
- ✅ Balance de Pedro disminuye en 60,000 (su parte del gasto, asumiendo 60/40)
- ✅ Se marca el participante como "Paid"
- ✅ **Total afectado: -60,000 (NO -160,000 como antes del fix)**

---

### ESCENARIO 4: Liquidar balance completo ✓

**Objetivo:** Verificar que al liquidar todo el balance con un usuario, no hay doble afectación.

**Pasos:**
1. Login como `pedroperez@gmail.com`
2. Crear varios gastos compartidos con Juan (usando la opción "Juan pagó")
3. Ir a "Grupos" → Seleccionar grupo "familia"
4. Ver el balance pendiente con Juan
5. Click en "Settle Balance" / "Liquidar Balance"
6. Confirmar el monto a pagar
7. Seleccionar cuenta de Pedro
8. Confirmar
9. Verificar balance de cuenta de Pedro

**Resultado Esperado:**
- ✅ Balance se reduce por el monto total adeudado (UNA sola vez)
- ✅ Todos los gastos se marcan como "Paid"
- ✅ Balance del grupo queda en 0
- ✅ No hay doble afectación

---

## 🔍 Verificaciones Adicionales

### Verificar en la base de datos:

**Para Escenario 2 (OTRO pagó):**

```sql
-- Ver el SharedExpense creado
SELECT * FROM "SharedExpense"
WHERE description = 'Test - Juan pagó'
ORDER BY "createdAt" DESC LIMIT 1;

-- Verificar que NO hay Transaction asociada para Pedro
SELECT * FROM "Transaction"
WHERE description LIKE '%Test - Juan pagó%'
AND "userId" = '[pedro-user-id]';
-- Debería retornar 0 resultados

-- Ver los participantes
SELECT * FROM "ExpenseParticipant"
WHERE "expenseId" = '[shared-expense-id]';
```

### Verificar Logs del Frontend:

Abrir Developer Tools (F12) → Console y buscar:
- Mensajes de éxito/error
- Llamadas a la API (Network tab)
- Verificar que cuando "OTRO pagó" NO se llama a `transactionAPI.create()`

---

## 📊 Tabla de Resultados

| Escenario | Balance Inicial | Acción | Balance Final | Cambio | ✓/✗ |
|-----------|----------------|---------|---------------|--------|-----|
| 1. Yo pagué | _______ | Crear gasto 100k | _______ | -100k | [ ] |
| 2. Otro pagó | _______ | Crear gasto 100k | _______ | 0 | [ ] |
| 3. Marcar pagado | _______ | Pagar 60k | _______ | -60k | [ ] |
| 4. Liquidar balance | _______ | Liquidar todo | _______ | -[total] | [ ] |

---

## 🐛 Si encuentras problemas:

1. **Balance se afecta cuando OTRO pagó:**
   - Verifica que el código tenga los cambios recientes
   - Recarga la página con Ctrl+Shift+R (hard reload)
   - Revisa la consola del navegador para errores

2. **No aparece el mensaje correcto:**
   - Verifica que estés en la versión actualizada
   - Revisa `/tmp/frontend-dev.log` para errores del servidor

3. **Error al crear el gasto:**
   - Verifica que el backend esté corriendo
   - Revisa la respuesta en Network tab (F12)

---

## ✅ Criterios de Éxito

- [ ] Escenario 1 funciona correctamente (balance se afecta inmediatamente)
- [ ] Escenario 2 funciona correctamente (balance NO se afecta)
- [ ] Escenario 3 funciona correctamente (balance se afecta al marcar como pagado)
- [ ] Escenario 4 funciona correctamente (liquidación sin doble afectación)
- [ ] Mensajes informativos correctos en cada caso
- [ ] No hay errores en la consola del navegador
- [ ] No hay doble afectación del balance en ningún caso

---

## 📝 Notas

**Cambios técnicos realizados:**
- Archivo: `frontend/src/app/dashboard/transactions/page.tsx`
- Líneas modificadas: 280-325
- Lógica agregada: Validación de `paidByUserId === currentUserId` antes de crear Transaction
- Bonus fix: Corrección de respuestas paginadas en MarkExpensePaidModal y SettleBalanceModal

**Comportamiento anterior (BUG):**
```
Crear gasto donde OTRO pagó → Balance -100k ❌
Marcar como pagado → Balance -60k ❌
Total: -160k ❌❌
```

**Comportamiento nuevo (CORRECTO):**
```
Crear gasto donde OTRO pagó → Balance sin cambios ✓
Marcar como pagado → Balance -60k ✓
Total: -60k ✓✓
```
