# Mobile App Documentation - Finance App (iOS & Android)

## 📋 Tabla de Contenidos
- [Descripción General](#descripción-general)
- [Stack Tecnológico Recomendado](#stack-tecnológico-recomendado)
- [Arquitectura Mobile](#arquitectura-mobile)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Navegación y Rutas](#navegación-y-rutas)
- [Componentes Principales](#componentes-principales)
- [Gestión de Estado](#gestión-de-estado)
- [Características Específicas Mobile](#características-específicas-mobile)
- [Integración con Backend](#integración-con-backend)
- [Optimizaciones Mobile](#optimizaciones-mobile)
- [Seguridad Mobile](#seguridad-mobile)
- [Consideraciones de Diseño](#consideraciones-de-diseño)
- [Diferencias con Web](#diferencias-con-web)
- [Plan de Implementación](#plan-de-implementación)
- [Testing y Deployment](#testing-y-deployment)

---

## Descripción General

Este documento detalla la arquitectura y requisitos para convertir la aplicación web Finance App en una aplicación móvil nativa que funcione en **iOS** y **Android**.

### Objetivo
Crear una aplicación móvil multiplataforma que mantenga toda la funcionalidad de la versión web, aprovechando las capacidades nativas de los dispositivos móviles para mejorar la experiencia del usuario.

### Funcionalidades Principales
- ✅ Gestión de finanzas personales
- ✅ Dashboard personalizable con widgets
- ✅ Gastos compartidos (estilo Splitwise)
- ✅ Préstamos y pagos
- ✅ Importación/exportación de transacciones
- ✅ Notificaciones push nativas
- ✅ Modo offline
- ✅ Biometría (Face ID / Touch ID / Fingerprint)
- ✅ Cámara para escanear recibos (OCR)
- ✅ Geolocalización para transacciones

---

## Stack Tecnológico Recomendado

### Opción 1: React Native (Recomendado) ⭐

**Ventajas**:
- Reutilización de lógica del frontend web (React)
- Código compartido entre iOS y Android (90-95%)
- Ecosistema maduro y gran comunidad
- Performance nativa
- Acceso a APIs nativas

**Stack**:
```
Core:
- React Native 0.73+
- TypeScript
- Expo (para desarrollo rápido) o React Native CLI (para más control)

Navegación:
- React Navigation 6.x (Stack, Tab, Drawer navigators)

Gestión de Estado:
- @tanstack/react-query (server state)
- Zustand (client state)
- AsyncStorage (persistencia local)

UI Components:
- React Native Paper (Material Design)
- React Native Elements
- NativeBase
- O componentes custom con Styled Components

Gráficos:
- Victory Native (alternativa a Recharts)
- React Native Chart Kit
- React Native SVG Charts

Formularios:
- React Hook Form
- Zod (validación)

HTTP Client:
- Axios
- React Query

Utilidades:
- date-fns
- react-native-reanimated (animaciones)
- react-native-gesture-handler (gestos)

Características Nativas:
- react-native-biometrics (Face ID / Touch ID)
- react-native-camera / expo-camera (escaneo de recibos)
- react-native-geolocation
- @react-native-async-storage/async-storage
- react-native-push-notification / expo-notifications
- react-native-fs (sistema de archivos)
- react-native-document-picker (importar CSV/Excel)
- react-native-share (compartir exportaciones)

Offline:
- @react-native-community/netinfo
- WatermelonDB o Realm (base de datos local)
- React Query con persistencia
```

### Opción 2: Flutter

**Ventajas**:
- Performance superior
- UI consistente entre plataformas
- Hot reload rápido

**Desventajas**:
- Requiere reescribir toda la app en Dart
- No reutiliza código React existente
- Curva de aprendizaje

### Opción 3: Ionic + Capacitor

**Ventajas**:
- Reutiliza código web casi al 100%
- Desarrollo web-first

**Desventajas**:
- Performance inferior a React Native
- Experiencia menos nativa
- Limitaciones en animaciones complejas

---

## Arquitectura Mobile

### Patrón de Diseño

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Screens, Components, Navigation)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         State Management                │
│  (React Query + Zustand + AsyncStorage) │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Business Logic Layer            │
│  (Hooks, Services, Utilities)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Data Layer                      │
│  (API Client, Local DB, Cache)          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Native Layer                    │
│  (Biometrics, Camera, Geolocation)      │
└─────────────────────────────────────────┘
```

### Flujo de Datos

```
User Interaction
      ↓
Screen Component
      ↓
Custom Hook (useTransactions, useAccounts)
      ↓
React Query (cache check)
      ↓
API Service (Axios)
      ↓
Backend API
      ↓
React Query Cache Update
      ↓
Zustand Store Update (if needed)
      ↓
AsyncStorage Persistence
      ↓
UI Re-render
```

---

## Estructura del Proyecto

```
mobile/
├── src/
│   ├── screens/              # Pantallas de la app
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── AccountsScreen.tsx
│   │   │   ├── TransactionsScreen.tsx
│   │   │   ├── GroupsScreen.tsx
│   │   │   ├── LoansScreen.tsx
│   │   │   ├── ImportScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   └── onboarding/
│   │       └── OnboardingScreen.tsx
│   │
│   ├── components/           # Componentes reutilizables
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── dashboard/
│   │   │   ├── WidgetCard.tsx
│   │   │   ├── BalanceWidget.tsx
│   │   │   ├── CashFlowWidget.tsx
│   │   │   └── ExpensesWidget.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionItem.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   └── TransactionFilters.tsx
│   │   ├── groups/
│   │   │   ├── GroupCard.tsx
│   │   │   ├── SharedExpenseForm.tsx
│   │   │   └── BalancesList.tsx
│   │   └── ui/
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── navigation/           # Configuración de navegación
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── DashboardNavigator.tsx
│   │   └── types.ts
│   │
│   ├── hooks/                # Custom hooks (reutilizables del web)
│   │   ├── useAccounts.ts
│   │   ├── useTransactions.ts
│   │   ├── useGroups.ts
│   │   ├── useCategories.ts
│   │   ├── useTags.ts
│   │   ├── useLoans.ts
│   │   ├── useDashboard.ts
│   │   ├── useBiometrics.ts      # Nuevo
│   │   ├── useCamera.ts          # Nuevo
│   │   └── useOfflineSync.ts     # Nuevo
│   │
│   ├── services/             # Servicios y lógica de negocio
│   │   ├── api/
│   │   │   ├── client.ts         # Axios instance
│   │   │   ├── auth.ts
│   │   │   ├── transactions.ts
│   │   │   ├── accounts.ts
│   │   │   ├── groups.ts
│   │   │   └── loans.ts
│   │   ├── storage/
│   │   │   ├── asyncStorage.ts
│   │   │   └── secureStorage.ts  # Keychain/Keystore
│   │   ├── biometrics/
│   │   │   └── biometricAuth.ts
│   │   ├── camera/
│   │   │   └── receiptScanner.ts
│   │   ├── notifications/
│   │   │   └── pushNotifications.ts
│   │   └── sync/
│   │       └── offlineSync.ts
│   │
│   ├── store/                # Zustand stores (reutilizables del web)
│   │   ├── authStore.ts
│   │   ├── dashboardStore.ts
│   │   ├── notificationStore.ts
│   │   └── offlineStore.ts       # Nuevo
│   │
│   ├── types/                # TypeScript types
│   │   ├── index.ts
│   │   ├── navigation.ts
│   │   └── api.ts
│   │
│   ├── utils/                # Utilidades
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── dateUtils.ts
│   │   └── currencyUtils.ts
│   │
│   ├── constants/            # Constantes
│   │   ├── colors.ts
│   │   ├── sizes.ts
│   │   └── config.ts
│   │
│   ├── theme/                # Tema de la app
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   │
│   └── App.tsx               # Entry point
│
├── android/                  # Código nativo Android
├── ios/                      # Código nativo iOS
├── assets/                   # Imágenes, fuentes, etc.
│   ├── images/
│   ├── fonts/
│   └── icons/
├── app.json                  # Configuración de Expo
├── package.json
├── tsconfig.json
└── README.md
```

---

## Navegación y Rutas

### Estructura de Navegación

React Navigation con múltiples navigators anidados:

```typescript
// AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createDrawerNavigator } from '@react-navigation/drawer'

// Stack Navigator Principal
const RootStack = createNativeStackNavigator()

function AppNavigator() {
  const { isAuthenticated } = useAuthStore()
  
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Dashboard Stack
          <RootStack.Screen name="Dashboard" component={DashboardNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  )
}

// Bottom Tab Navigator para Dashboard
const Tab = createBottomTabNavigator()

function DashboardNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="list" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="Groups" 
        component={GroupsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="users" size={size} color={color} />
          )
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="menu" size={size} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  )
}

// Stack Navigator para Transacciones
const TransactionsStack = createNativeStackNavigator()

function TransactionsNavigator() {
  return (
    <TransactionsStack.Navigator>
      <TransactionsStack.Screen 
        name="TransactionsList" 
        component={TransactionsScreen} 
      />
      <TransactionsStack.Screen 
        name="TransactionDetail" 
        component={TransactionDetailScreen} 
      />
      <TransactionsStack.Screen 
        name="CreateTransaction" 
        component={CreateTransactionScreen}
        options={{ presentation: 'modal' }}
      />
    </TransactionsStack.Navigator>
  )
}
```

### Pantallas Principales

#### Autenticación
- **LoginScreen**: Login con email/password + biometría
- **RegisterScreen**: Registro de usuario
- **OnboardingScreen**: Tutorial inicial (primera vez)

#### Dashboard
- **DashboardScreen**: Widgets personalizables (scroll vertical)
- **AccountsScreen**: Lista de cuentas
- **TransactionsScreen**: Lista de transacciones con filtros
- **GroupsScreen**: Grupos y gastos compartidos
- **LoansScreen**: Préstamos
- **ImportScreen**: Importar transacciones
- **SettingsScreen**: Configuración

#### Modales
- **CreateTransactionModal**: Crear/editar transacción
- **CreateAccountModal**: Crear/editar cuenta
- **SharedExpenseModal**: Crear gasto compartido
- **SettleBalanceModal**: Liquidar balance
- **FiltersModal**: Filtros avanzados

---

## Componentes Principales

### Dashboard Components

#### WidgetCard
```typescript
interface WidgetCardProps {
  title: string
  children: React.ReactNode
  onPress?: () => void
  loading?: boolean
}

export function WidgetCard({ title, children, onPress, loading }: WidgetCardProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <Card style={styles.card}>
        <Card.Title title={title} />
        <Card.Content>
          {loading ? <LoadingSpinner /> : children}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )
}
```

#### BalanceWidget
```typescript
export function BalanceWidget() {
  const { data: accounts, isLoading } = useAccounts()
  const balancesByCurrency = useMemo(() => {
    // Agrupar por moneda
    return groupBy(accounts, 'currency')
  }, [accounts])
  
  return (
    <WidgetCard title="Balances" loading={isLoading}>
      {Object.entries(balancesByCurrency).map(([currency, accounts]) => (
        <View key={currency}>
          <Text>{currency}</Text>
          <Text>{formatCurrency(sumBy(accounts, 'balance'), currency)}</Text>
        </View>
      ))}
    </WidgetCard>
  )
}
```

#### CashFlowWidget
```typescript
import { VictoryLine, VictoryChart, VictoryAxis } from 'victory-native'

export function CashFlowWidget() {
  const { month, year } = useSelectedMonth()
  const { data, isLoading } = useCashFlow(month, year)
  
  return (
    <WidgetCard title="Flujo de Caja" loading={isLoading}>
      <VictoryChart height={200}>
        <VictoryAxis />
        <VictoryLine
          data={data}
          x="day"
          y="balance"
          style={{ data: { stroke: "#4CAF50" } }}
        />
      </VictoryChart>
    </WidgetCard>
  )
}
```

### Transaction Components

#### TransactionList
```typescript
import { FlashList } from '@shopify/flash-list'

export function TransactionList({ transactions }: TransactionListProps) {
  const renderItem = useCallback(({ item }: { item: Transaction }) => (
    <TransactionItem transaction={item} />
  ), [])
  
  return (
    <FlashList
      data={transactions}
      renderItem={renderItem}
      estimatedItemSize={80}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={Separator}
    />
  )
}
```

#### TransactionItem
```typescript
export const TransactionItem = memo(function TransactionItem({ 
  transaction 
}: TransactionItemProps) {
  const navigation = useNavigation()
  
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('TransactionDetail', { id: transaction.id })}
    >
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Icon name={getCategoryIcon(transaction.category)} />
        </View>
        <View style={styles.content}>
          <Text style={styles.description}>{transaction.description}</Text>
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
        </View>
        <Text style={[
          styles.amount,
          transaction.type === 'INCOME' ? styles.income : styles.expense
        ]}>
          {formatCurrency(transaction.amount, transaction.currency)}
        </Text>
      </View>
    </TouchableOpacity>
  )
})
```

### Form Components

#### TransactionForm
```typescript
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

export function TransactionForm({ onSubmit, initialData }: TransactionFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData
  })
  
  return (
    <ScrollView>
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Monto"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            error={!!errors.amount}
          />
        )}
      />
      
      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) => (
          <SegmentedButtons
            value={value}
            onValueChange={onChange}
            buttons={[
              { value: 'EXPENSE', label: 'Gasto' },
              { value: 'INCOME', label: 'Ingreso' },
              { value: 'TRANSFER', label: 'Transferencia' }
            ]}
          />
        )}
      />
      
      <Button mode="contained" onPress={handleSubmit(onSubmit)}>
        Guardar
      </Button>
    </ScrollView>
  )
}
```

---

## Gestión de Estado

### React Query Configuration

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutos
      gcTime: 10 * 60 * 1000,        // 10 minutos
      retry: 2,
      refetchOnWindowFocus: false,   // No aplica en mobile
      refetchOnReconnect: true,      // Importante para mobile
    },
  },
})

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
})

export { queryClient, asyncStoragePersister }
```

### Zustand Stores con AsyncStorage

```typescript
// store/authStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (userData: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true })
      },
      
      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        }))
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

### Offline Store

```typescript
// store/offlineStore.ts
interface OfflineState {
  isOnline: boolean
  pendingActions: PendingAction[]
  setOnline: (online: boolean) => void
  addPendingAction: (action: PendingAction) => void
  removePendingAction: (id: string) => void
  syncPendingActions: () => Promise<void>
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      pendingActions: [],
      
      setOnline: (online) => {
        set({ isOnline: online })
        if (online) {
          get().syncPendingActions()
        }
      },
      
      addPendingAction: (action) => {
        set((state) => ({
          pendingActions: [...state.pendingActions, action]
        }))
      },
      
      removePendingAction: (id) => {
        set((state) => ({
          pendingActions: state.pendingActions.filter(a => a.id !== id)
        }))
      },
      
      syncPendingActions: async () => {
        const { pendingActions, removePendingAction } = get()
        
        for (const action of pendingActions) {
          try {
            await executeAction(action)
            removePendingAction(action.id)
          } catch (error) {
            console.error('Failed to sync action:', error)
          }
        }
      },
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

---

## Características Específicas Mobile

### 1. Biometría (Face ID / Touch ID / Fingerprint)

```typescript
// hooks/useBiometrics.ts
import ReactNativeBiometrics from 'react-native-biometrics'

export function useBiometrics() {
  const [isAvailable, setIsAvailable] = useState(false)
  const [biometryType, setBiometryType] = useState<string | null>(null)
  
  useEffect(() => {
    checkBiometrics()
  }, [])
  
  const checkBiometrics = async () => {
    const { available, biometryType } = await ReactNativeBiometrics.isSensorAvailable()
    setIsAvailable(available)
    setBiometryType(biometryType)
  }
  
  const authenticate = async (reason: string) => {
    try {
      const { success } = await ReactNativeBiometrics.simplePrompt({
        promptMessage: reason,
        cancelButtonText: 'Cancelar'
      })
      return success
    } catch (error) {
      console.error('Biometric auth failed:', error)
      return false
    }
  }
  
  return { isAvailable, biometryType, authenticate }
}

// Uso en LoginScreen
function LoginScreen() {
  const { authenticate, isAvailable } = useBiometrics()
  const { setAuth } = useAuthStore()
  
  const handleBiometricLogin = async () => {
    const success = await authenticate('Autenticarse con biometría')
    if (success) {
      // Obtener token guardado de forma segura
      const token = await SecureStore.getItemAsync('auth_token')
      if (token) {
        // Auto-login
        const user = await fetchUserProfile(token)
        setAuth(user, token)
      }
    }
  }
  
  return (
    <View>
      {/* Formulario de login */}
      {isAvailable && (
        <Button onPress={handleBiometricLogin}>
          Usar Face ID / Touch ID
        </Button>
      )}
    </View>
  )
}
```

### 2. Escaneo de Recibos con OCR

```typescript
// hooks/useCamera.ts
import { Camera } from 'react-native-vision-camera'
import { useTextRecognition } from 'react-native-vision-camera-text-recognition'

export function useReceiptScanner() {
  const [hasPermission, setHasPermission] = useState(false)
  
  useEffect(() => {
    requestCameraPermission()
  }, [])
  
  const requestCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission()
    setHasPermission(permission === 'authorized')
  }
  
  const scanReceipt = async (photoPath: string) => {
    try {
      const result = await useTextRecognition(photoPath)
      
      // Parsear texto para extraer información
      const amount = extractAmount(result.text)
      const date = extractDate(result.text)
      const merchant = extractMerchant(result.text)
      
      return { amount, date, merchant }
    } catch (error) {
      console.error('OCR failed:', error)
      return null
    }
  }
  
  return { hasPermission, scanReceipt }
}

// Componente ReceiptScanner
function ReceiptScannerScreen({ navigation }) {
  const camera = useRef<Camera>(null)
  const { scanReceipt } = useReceiptScanner()
  
  const takePhoto = async () => {
    if (camera.current) {
      const photo = await camera.current.takePhoto()
      const receiptData = await scanReceipt(photo.path)
      
      // Navegar a formulario con datos pre-llenados
      navigation.navigate('CreateTransaction', {
        initialData: receiptData
      })
    }
  }
  
  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={camera}
        style={{ flex: 1 }}
        device={device}
        isActive={true}
      />
      <Button onPress={takePhoto}>Capturar</Button>
    </View>
  )
}
```

### 3. Geolocalización

```typescript
// hooks/useLocation.ts
import Geolocation from '@react-native-community/geolocation'

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null)
  
  const getCurrentLocation = async () => {
    return new Promise<Location>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          setLocation(loc)
          resolve(loc)
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      )
    })
  }
  
  return { location, getCurrentLocation }
}

// Uso en TransactionForm
function TransactionForm() {
  const { getCurrentLocation } = useLocation()
  
  const handleAddLocation = async () => {
    try {
      const location = await getCurrentLocation()
      // Guardar location con la transacción
      setValue('location', location)
    } catch (error) {
      console.error('Failed to get location:', error)
    }
  }
  
  return (
    <View>
      {/* Formulario */}
      <Button onPress={handleAddLocation}>
        Agregar ubicación
      </Button>
    </View>
  )
}
```

### 4. Notificaciones Push

```typescript
// services/notifications/pushNotifications.ts
import messaging from '@react-native-firebase/messaging'
import notifee from '@notifee/react-native'

export class PushNotificationService {
  static async requestPermission() {
    const authStatus = await messaging().requestPermission()
    return authStatus === messaging.AuthorizationStatus.AUTHORIZED
  }
  
  static async getToken() {
    const token = await messaging().getToken()
    return token
  }
  
  static async setupNotifications() {
    // Foreground notifications
    messaging().onMessage(async (remoteMessage) => {
      await notifee.displayNotification({
        title: remoteMessage.notification?.title,
        body: remoteMessage.notification?.body,
        android: {
          channelId: 'default',
          smallIcon: 'ic_launcher',
        },
      })
    })
    
    // Background notifications
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage)
    })
  }
  
  static async scheduleLocalNotification(title: string, body: string, date: Date) {
    await notifee.createTriggerNotification(
      {
        title,
        body,
        android: {
          channelId: 'default',
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: date.getTime(),
      }
    )
  }
}

// Uso en App.tsx
useEffect(() => {
  PushNotificationService.setupNotifications()
  
  const unsubscribe = messaging().onTokenRefresh(async (token) => {
    // Enviar token al backend
    await updatePushToken(token)
  })
  
  return unsubscribe
}, [])
```

### 5. Modo Offline

```typescript
// hooks/useOfflineSync.ts
import NetInfo from '@react-native-community/netinfo'

export function useOfflineSync() {
  const { setOnline, syncPendingActions } = useOfflineStore()
  const queryClient = useQueryClient()
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected && state.isInternetReachable
      setOnline(isOnline)
      
      if (isOnline) {
        // Refetch todas las queries al volver online
        queryClient.refetchQueries()
      }
    })
    
    return () => unsubscribe()
  }, [])
  
  return { syncPendingActions }
}

// Mutation con soporte offline
export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const { isOnline, addPendingAction } = useOfflineStore()
  
  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      if (!isOnline) {
        // Guardar acción pendiente
        addPendingAction({
          id: uuid(),
          type: 'CREATE_TRANSACTION',
          data,
          timestamp: Date.now()
        })
        
        // Actualizar cache optimísticamente
        queryClient.setQueryData(['transactions'], (old: any) => {
          // ... actualización optimista
        })
        
        return { offline: true }
      }
      
      // Online: ejecutar normalmente
      const response = await transactionAPI.create(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    }
  })
}
```

### 6. Importar/Exportar Archivos

```typescript
// hooks/useFileImport.ts
import DocumentPicker from 'react-native-document-picker'
import RNFS from 'react-native-fs'
import Papa from 'papaparse'
import XLSX from 'xlsx'

export function useFileImport() {
  const importCSV = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.csv],
      })
      
      const fileContent = await RNFS.readFile(result[0].uri, 'utf8')
      const parsed = Papa.parse(fileContent, { header: true })
      
      return parsed.data
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('User cancelled')
      } else {
        throw error
      }
    }
  }
  
  const importExcel = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.xlsx, DocumentPicker.types.xls],
      })
      
      const fileContent = await RNFS.readFile(result[0].uri, 'base64')
      const workbook = XLSX.read(fileContent, { type: 'base64' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(worksheet)
      
      return data
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('User cancelled')
      } else {
        throw error
      }
    }
  }
  
  return { importCSV, importExcel }
}

// hooks/useFileExport.ts
import Share from 'react-native-share'

export function useFileExport() {
  const exportToExcel = async (transactions: Transaction[]) => {
    const worksheet = XLSX.utils.json_to_sheet(transactions)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
    
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' })
    
    const path = `${RNFS.DocumentDirectoryPath}/transactions.xlsx`
    await RNFS.writeFile(path, wbout, 'base64')
    
    await Share.open({
      url: `file://${path}`,
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }
  
  return { exportToExcel }
}
```

---

## Integración con Backend

### API Client

```typescript
// services/api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = __DEV__ 
  ? 'http://localhost:5000/api'  // Development
  : 'https://api.financeapp.com/api'  // Production

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado, logout
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
      await AsyncStorage.removeItem('auth_token')
      
      // Navegar a login (usando navigation ref)
      navigationRef.current?.navigate('Login')
    }
    return Promise.reject(error)
  }
)
```

### Hooks de API (Reutilizables del Web)

Los hooks de React Query del frontend web son **100% reutilizables** en mobile:

```typescript
// hooks/useTransactions.ts (mismo código que web)
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const response = await api.get('/transactions', { params: filters })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const response = await api.post('/transactions', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
```

---

## Optimizaciones Mobile

### 1. FlashList para Listas Largas

```typescript
import { FlashList } from '@shopify/flash-list'

// Reemplazar FlatList con FlashList
function TransactionList({ transactions }: TransactionListProps) {
  return (
    <FlashList
      data={transactions}
      renderItem={({ item }) => <TransactionItem transaction={item} />}
      estimatedItemSize={80}  // Importante para performance
      keyExtractor={(item) => item.id}
    />
  )
}
```

**Beneficios**:
- 10x más rápido que FlatList
- Mejor performance con 1000+ items
- Menor uso de memoria

### 2. React Native Reanimated

```typescript
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue 
} from 'react-native-reanimated'

function AnimatedCard({ children }: AnimatedCardProps) {
  const scale = useSharedValue(1)
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))
  
  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  )
}
```

### 3. Hermes Engine

Habilitar Hermes para mejor performance:

```javascript
// android/app/build.gradle
project.ext.react = [
  enableHermes: true,  // Habilitar Hermes
]
```

**Beneficios**:
- Startup time 50% más rápido
- Menor uso de memoria
- Mejor performance general

### 4. Image Optimization

```typescript
import FastImage from 'react-native-fast-image'

function Avatar({ uri }: AvatarProps) {
  return (
    <FastImage
      source={{ 
        uri,
        priority: FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable
      }}
      style={{ width: 40, height: 40, borderRadius: 20 }}
    />
  )
}
```

### 5. Code Splitting con React.lazy

```typescript
import { lazy, Suspense } from 'react'

const GroupsScreen = lazy(() => import('./screens/GroupsScreen'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GroupsScreen />
    </Suspense>
  )
}
```

---

## Seguridad Mobile

### 1. Secure Storage

```typescript
// services/storage/secureStorage.ts
import * as Keychain from 'react-native-keychain'

export class SecureStorage {
  static async setItem(key: string, value: string) {
    await Keychain.setGenericPassword(key, value, {
      service: key,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    })
  }
  
  static async getItem(key: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({ service: key })
      return credentials ? credentials.password : null
    } catch (error) {
      return null
    }
  }
  
  static async removeItem(key: string) {
    await Keychain.resetGenericPassword({ service: key })
  }
}

// Uso para guardar token
await SecureStorage.setItem('auth_token', token)
```

### 2. SSL Pinning

```typescript
// android/app/src/main/java/com/yourapp/MainApplication.java
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.CertificatePinner

public class MainApplication extends Application {
  @Override
  public void onCreate() {
    super.onCreate()
    
    CertificatePinner certificatePinner = new CertificatePinner.Builder()
      .add("api.financeapp.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
      .build()
    
    OkHttpClient client = new OkHttpClient.Builder()
      .certificatePinner(certificatePinner)
      .build()
    
    OkHttpClientProvider.setOkHttpClientFactory(() -> client)
  }
}
```

### 3. Jailbreak/Root Detection

```typescript
import JailMonkey from 'jail-monkey'

function App() {
  useEffect(() => {
    if (JailMonkey.isJailBroken()) {
      Alert.alert(
        'Dispositivo comprometido',
        'Esta app no puede ejecutarse en dispositivos con jailbreak/root'
      )
      // Cerrar app o limitar funcionalidad
    }
  }, [])
}
```

### 4. Obfuscación de Código

```bash
# Usar ProGuard en Android
# android/app/build.gradle
buildTypes {
  release {
    minifyEnabled true
    proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
  }
}
```

---

## Consideraciones de Diseño

### 1. Design System Mobile

```typescript
// theme/colors.ts
export const colors = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  error: '#F44336',
  warning: '#FF9800',
  success: '#4CAF50',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
  },
}

// theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

// theme/typography.ts
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
}
```

### 2. Responsive Design

```typescript
import { Dimensions, Platform } from 'react-native'

const { width, height } = Dimensions.get('window')

export const isSmallDevice = width < 375
export const isMediumDevice = width >= 375 && width < 414
export const isLargeDevice = width >= 414

export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'

// Uso
const styles = StyleSheet.create({
  container: {
    padding: isSmallDevice ? spacing.sm : spacing.md,
  },
})
```

### 3. Dark Mode

```typescript
import { useColorScheme } from 'react-native'

function App() {
  const colorScheme = useColorScheme()
  const isDarkMode = colorScheme === 'dark'
  
  const theme = isDarkMode ? darkTheme : lightTheme
  
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        {/* App content */}
      </NavigationContainer>
    </PaperProvider>
  )
}
```

### 4. Accesibilidad

```typescript
function AccessibleButton({ onPress, label }: AccessibleButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessible={true}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityHint="Doble tap para activar"
    >
      <Text>{label}</Text>
    </TouchableOpacity>
  )
}
```

---

## Diferencias con Web

### Funcionalidades Exclusivas de Mobile

| Funcionalidad | Web | Mobile |
|---------------|-----|--------|
| Biometría | ❌ | ✅ Face ID / Touch ID |
| Escaneo de recibos | ❌ | ✅ OCR con cámara |
| Geolocalización | ⚠️ Limitado | ✅ GPS nativo |
| Notificaciones Push | ⚠️ Web Push | ✅ Nativas |
| Modo Offline | ⚠️ Limitado | ✅ Completo |
| Widgets | ❌ | ✅ Home screen widgets |
| Compartir | ⚠️ Web Share API | ✅ Share nativo |
| Contactos | ❌ | ✅ Acceso a contactos |

### Adaptaciones Necesarias

#### Dashboard
- **Web**: Grid arrastrable con React Grid Layout
- **Mobile**: Scroll vertical con widgets apilados (no drag & drop)

#### Filtros
- **Web**: Panel lateral con todos los filtros visibles
- **Mobile**: Modal bottom sheet con filtros colapsables

#### Formularios
- **Web**: Formularios en modales grandes
- **Mobile**: Pantallas completas con teclado optimizado

#### Gráficos
- **Web**: Recharts
- **Mobile**: Victory Native (optimizado para mobile)

#### Tablas
- **Web**: Tablas HTML con muchas columnas
- **Mobile**: Cards con información resumida

---

## Plan de Implementación

### Fase 1: Setup y Autenticación (2 semanas)

**Tareas**:
- [ ] Configurar proyecto React Native con TypeScript
- [ ] Configurar navegación (React Navigation)
- [ ] Implementar pantallas de autenticación
- [ ] Integrar biometría
- [ ] Configurar Zustand stores
- [ ] Configurar React Query
- [ ] Implementar login/logout

**Entregables**:
- App funcional con login
- Navegación básica
- Autenticación con biometría

### Fase 2: Dashboard y Cuentas (2 semanas)

**Tareas**:
- [ ] Implementar DashboardScreen
- [ ] Crear widgets básicos (Balance, Cash Flow)
- [ ] Implementar AccountsScreen
- [ ] Formularios de cuentas
- [ ] Integrar gráficos con Victory Native

**Entregables**:
- Dashboard funcional
- Gestión de cuentas completa
- Widgets visuales

### Fase 3: Transacciones (3 semanas)

**Tareas**:
- [ ] Implementar TransactionsScreen
- [ ] Lista de transacciones con FlashList
- [ ] Filtros avanzados
- [ ] Formulario de transacciones
- [ ] Escaneo de recibos con OCR
- [ ] Geolocalización

**Entregables**:
- Gestión completa de transacciones
- Escaneo de recibos funcional
- Filtros avanzados

### Fase 4: Grupos y Gastos Compartidos (2 semanas)

**Tareas**:
- [ ] Implementar GroupsScreen
- [ ] Formulario de gastos compartidos
- [ ] Balances y liquidaciones
- [ ] Notificaciones push

**Entregables**:
- Gastos compartidos completos
- Notificaciones push funcionando

### Fase 5: Préstamos e Importación (1 semana)

**Tareas**:
- [ ] Implementar LoansScreen
- [ ] Importación de CSV/Excel
- [ ] Exportación a Excel

**Entregables**:
- Gestión de préstamos
- Import/Export funcional

### Fase 6: Modo Offline y Optimizaciones (2 semanas)

**Tareas**:
- [ ] Implementar detección de conectividad
- [ ] Queue de acciones pendientes
- [ ] Sincronización automática
- [ ] Optimizaciones de performance
- [ ] Testing completo

**Entregables**:
- Modo offline completo
- App optimizada
- Tests pasando

### Fase 7: Pulido y Deployment (1 semana)

**Tareas**:
- [ ] Pulido de UI/UX
- [ ] Configurar CI/CD
- [ ] Preparar para App Store
- [ ] Preparar para Google Play
- [ ] Beta testing

**Entregables**:
- App lista para producción
- Publicada en stores

**Total: 13 semanas (~3 meses)**

---

## Testing y Deployment

### Testing

#### Unit Tests
```typescript
// __tests__/hooks/useTransactions.test.ts
import { renderHook, waitFor } from '@testing-library/react-native'
import { useTransactions } from '@/hooks/useTransactions'

describe('useTransactions', () => {
  it('should fetch transactions', async () => {
    const { result } = renderHook(() => useTransactions())
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    
    expect(result.current.data).toBeDefined()
  })
})
```

#### Integration Tests
```typescript
// __tests__/screens/LoginScreen.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import LoginScreen from '@/screens/auth/LoginScreen'

describe('LoginScreen', () => {
  it('should login successfully', async () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />)
    
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com')
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123')
    fireEvent.press(getByText('Login'))
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Dashboard')
    })
  })
})
```

#### E2E Tests
```typescript
// e2e/login.e2e.ts
import { device, element, by, expect } from 'detox'

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp()
  })
  
  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('test@example.com')
    await element(by.id('password-input')).typeText('password123')
    await element(by.id('login-button')).tap()
    
    await expect(element(by.id('dashboard-screen'))).toBeVisible()
  })
})
```

### Deployment

#### iOS (App Store)

```bash
# 1. Configurar certificados en Xcode
# 2. Incrementar versión
cd ios
fastlane bump_version

# 3. Build de release
fastlane build_release

# 4. Subir a TestFlight
fastlane upload_testflight

# 5. Enviar a revisión
fastlane submit_review
```

#### Android (Google Play)

```bash
# 1. Generar keystore
keytool -genkeypair -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# 2. Configurar gradle
# android/app/build.gradle
signingConfigs {
  release {
    storeFile file('my-release-key.keystore')
    storePassword 'password'
    keyAlias 'my-key-alias'
    keyPassword 'password'
  }
}

# 3. Build de release
cd android
./gradlew bundleRelease

# 4. Subir a Google Play Console
# Upload manual o con fastlane
fastlane upload_play_store
```

---

## Resumen

Esta documentación proporciona una guía completa para convertir la aplicación web Finance App en una aplicación móvil nativa para iOS y Android usando **React Native**.

### Ventajas de React Native para este Proyecto

1. **Reutilización de código**: 80-90% del código de lógica de negocio es reutilizable
2. **Hooks compartidos**: Todos los hooks de React Query funcionan sin cambios
3. **Stores compartidos**: Zustand stores son 100% compatibles
4. **TypeScript**: Mismos tipos e interfaces
5. **Ecosistema**: Acceso a librerías nativas y web
6. **Performance**: Nativa con Hermes engine
7. **Desarrollo rápido**: Hot reload y debugging

### Próximos Pasos

1. Configurar proyecto React Native
2. Migrar componentes UI del web
3. Implementar navegación mobile
4. Integrar características nativas
5. Testing exhaustivo
6. Deployment a stores

---

**Última actualización**: 2025-12-05
