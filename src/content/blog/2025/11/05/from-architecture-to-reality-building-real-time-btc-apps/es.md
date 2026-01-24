---
title: 'De Arquitectura a Realidad: Construyendo Apps de Precio BTC en Tiempo Real'
description: 'Conectando todas las capas con Composition Root, ViewModels y apps reales. Cómo el App Sandbox de macOS casi
destruye nuestras llamadas de red, y por qué las apps CLI tienen privilegios especiales.'
pubDate: 'Nov 5 2025'
heroImage: './hero.png'
lang: 'es'
translationKey: 'architecture-to-reality'
slug: 'de-arquitectura-a-realidad-construyendo-apps-de-precio-btc-en-tiempo-real'
---

## Introducción

En el [artículo anterior](../persistence-decisions-userdefaults-filemanager-swiftdata) construimos una capa de persistencia con UserDefaults, comparamos tres soluciones y descubrimos el bug de precisión Decimal de SwiftData.

Ahora tenemos:

- ✅ Capa de networking (Binance + fallback CryptoCompare)
- ✅ Capa de persistencia (UserDefaults)
- ✅ Casos de uso del dominio (fetch, persist, render)
- ✅ Todo testeado, todo modular

Pero están desconectados. Necesitamos conectar todo y construir apps reales.

El desafío: **Convertir módulos aislados en un monitor de precio BTC en tiempo real.**

Este artículo cubre la milla final:

1. **Composition Root** - Conectando dependencias sin acoplamiento
2. **ViewModel** - Conectando casos de uso a SwiftUI con @Observable
3. **SwiftUI App** - UI en tiempo real con actualizaciones automáticas
4. **CLI Tool** - App de terminal para desarrolladores
5. **La Crisis del Sandbox** - Cómo la seguridad de macOS casi rompe todo

La sorpresa: **Construir las apps tomó 50 líneas de código. Depurar el sandbox tomó 2 horas.**

Al final, verás por qué Composition Root importa, cómo @Observable simplifica el manejo de estado, y por qué las apps de macOS necesitan permisos de red explícitos mientras que las herramientas CLI no.

---

## Paso 1: El Composition Root - Inyección de Dependencias Bien Hecha

**Problema**: Nuestros módulos están aislados. ¿Cómo los conectamos sin crear acoplamiento estrecho?

**Enfoque incorrecto**:

```swift
// ❌ No hagas esto - Los ViewModels no deberían conocer la infraestructura
class BTCPriceViewModel {
  let loader = BinancePriceLoader(session: .shared)  // Acoplamiento estrecho
  let store = UserDefaultsPriceStore()               // No se puede testear
}
```

Principio de Clean Architecture: Los módulos de alto nivel no deberían depender de módulos de bajo nivel.

**Solución**: Patrón Composition Root.

### ¿Qué es Composition Root?

Un lugar único donde:

1. Creamos todas las implementaciones concretas
2. Conectamos las dependencias entre sí
3. Las inyectamos en los casos de uso

Insight clave: La composición ocurre una vez al inicio de la app, no dispersa por todo el código.

### Creando el Módulo BTCPriceComposer

```bash
btc-price/
├── BTCPriceCore/          # Dominio (protocolos, casos de uso)
├── BTCPriceNetworking/    # Infraestructura
├── BTCPricePersistence/   # Infraestructura
└── BTCPriceComposer/      # Composition Root (nuevo)
```

### ¿Por qué un módulo separado?

- ✅ Centraliza la creación de dependencias
- ✅ Las apps importan solo el composer, no la infraestructura individual
- ✅ Hace explícito el grafo de dependencias
- ✅ Fácil intercambiar implementaciones (tests, previews)

### Implementación: AppDependencies

```swift
// BTCPriceComposer/Sources/BTCPriceComposer/AppDependencies.swift
import BTCPriceCore
import BTCPriceNetworking
import BTCPricePersistence
import Foundation

public final class AppDependencies: Sendable {
  // Store
  public let priceStore: PriceStore

  // Loaders
  public let primaryLoader: PriceLoader
  public let fallbackLoader: PriceLoader

  // Use Cases
  public let fetchWithFallback: FetchWithFallback
  public let persistPrice: PersistLastValidPrice
  public let renderPrice: RenderPriceAndTimestamp

  public init(
    userDefaults: UserDefaults = .standard,
    urlSession: URLSession = .shared
  ) {
    // 1. Crear infraestructura
    self.priceStore = UserDefaultsPriceStore(
      userDefaults: userDefaults,
      key: "btc_price_cache"
    )

    self.primaryLoader = BinancePriceLoader(session: urlSession)
    self.fallbackLoader = CryptoComparePriceLoader(session: urlSession)

    // 2. Conectar casos de uso
    self.fetchWithFallback = FetchWithFallback(
      primary: primaryLoader,
      fallback: fallbackLoader
    )

    self.persistPrice = PersistLastValidPrice(store: priceStore)
    self.renderPrice = RenderPriceAndTimestamp(
      priceFormatter: USDPriceFormatter(),
      timestampFormatter: ISO8601TimestampFormatter()
    )
  }
}
```

### Decisiones de Diseño

**¿Por qué Sendable?**

- Requisito de concurrencia de Swift 6
- Puede compartirse de forma segura entre tareas/actores

**¿Por qué inyectar UserDefaults y URLSession?**

- Testing: Puedes inyectar suite personalizada y sesión mockeada
- Flexibilidad: Diferentes configuraciones para producción/debug

**¿Por qué exponer tanto infraestructura como casos de uso?**

- Casos de uso: Para lógica de app (ViewModel usa estos)
- Infraestructura: Para acceso directo si se necesita (raro)

**¿Por qué clase final?**

- No está pensada para ser subclaseada
- Composición sobre herencia

### Grafo de Dependencias

```plaintext
AppDependencies
├── priceStore: UserDefaultsPriceStore
│   └── UserDefaults
├── primaryLoader: BinancePriceLoader
│   └── URLSession
├── fallbackLoader: CryptoComparePriceLoader
│   └── URLSession
├── fetchWithFallback: FetchWithFallback
│   ├── primary: BinancePriceLoader
│   └── fallback: CryptoComparePriceLoader
├── persistPrice: PersistLastValidPrice
│   └── store: UserDefaultsPriceStore
└── renderPrice: RenderPriceAndTimestamp
    ├── priceFormatter: USDPriceFormatter
    └── timestampFormatter: ISO8601TimestampFormatter
```

Victoria de Clean Architecture: Todas las dependencias apuntan hacia adentro al dominio.

---

## Paso 2: La Herramienta CLI - Simplicidad Primero

Antes de construir la app SwiftUI compleja, validemos con una herramienta CLI simple.

Objetivo: Obtener el precio BTC cada segundo, imprimir en terminal.

### Implementación: main.swift

```swift
// BTCPrice-CLI/main.swift
import BTCPriceCore
import BTCPriceComposer
import Foundation

let deps = AppDependencies()

print("🚀 Iniciando Monitor de Precio BTC/USD")
print("📊 Actualizaciones cada segundo. Presiona CTRL+C para detener.")
print("==========================================")
print("")

var updateCount = 0

while true {
  updateCount += 1

  do {
    // 1. Obtener precio
    let quote = try await deps.fetchWithFallback.execute()

    // 2. Persistir para soporte offline
    try await deps.persistPrice.execute(quote)

    // 3. Renderizar salida formateada
    let formatted = await deps.renderPrice.execute(quote)

    print("[\(updateCount)] 💰 \(formatted.priceText) | 🕓 \(formatted.timestampText)")

  } catch {
    // 4. Fallback a caché si falla la red
    if let cached = await deps.persistPrice.loadCached() {
      let formatted = await deps.renderPrice.execute(cached)
      print("[\(updateCount)] 📦 [CACHED] \(formatted.priceText) | 🕓 \(formatted.timestampText)")
    } else {
      print("[\(updateCount)] ❌ Error: \(error)")
    }
  }

  // 5. Esperar 1 segundo antes de la siguiente actualización
  try? await Task.sleep(for: .seconds(1))
}
```

### Características Clave

1. Dependencias reales: Usa AppDependencies() - sin mocks
2. Resiliencia a errores: Hace fallback a caché cuando falla la red
3. Actualizaciones continuas: Loop infinito con delay de 1 segundo
4. Seguimiento de progreso: Muestra contador de actualizaciones
5. Degradación elegante: Muestra datos cacheados en lugar de crashear

### Ejecutando la CLI

```bash
$ swift run BTCPrice-CLI

🚀 Iniciando Monitor de Precio BTC/USD
📊 Actualizaciones cada segundo. Presiona CTRL+C para detener.
==========================================

[1] 💰 $114,459.80 | 🕓 27 Oct 2025 a las 7:56:39 PM
[2] 💰 $114,461.23 | 🕓 27 Oct 2025 a las 7:56:40 PM
[3] 💰 $114,458.91 | 🕓 27 Oct 2025 a las 7:56:41 PM
...
```

Simplemente funciona. Sin configuración, sin entitlements, sin problemas de sandbox.

(Descubriremos por qué más tarde - las herramientas CLI tienen privilegios especiales.)

---

## Paso 3: El ViewModel - Conectando Casos de Uso a SwiftUI

Ahora la parte interesante: construir un ViewModel reactivo para SwiftUI.

Requisitos:

1. Obtener precio cada segundo automáticamente
2. Actualizar UI cuando lleguen nuevos datos
3. Mostrar datos cacheados cuando esté offline
4. Mostrar estados de carga/error
5. Limpiar recursos cuando la vista desaparezca

### Desafío: Manejo de Estado en Swift 6

**Enfoque antiguo (pre-Swift 6):**

```swift
class BTCPriceViewModel: ObservableObject {
  @Published var priceText: String = "--"  // Wrappers @Published manuales
  @Published var isLoading: Bool = false
}
```

**Enfoque nuevo (Swift 6):**

```swift
@Observable
final class BTCPriceViewModel {
  var priceText: String = "--"  // Observación automática
  var isLoading: Bool = false
}
```

**Beneficios de @Observable:**

- ✅ Sin boilerplate de @Published
- ✅ Observación automática de TODAS las propiedades
- ✅ Mejor rendimiento (actualizaciones granulares)
- ✅ Sintaxis más limpia

### Implementación: BTCPriceViewModel

```swift
// BTCPriceApp/BTCPriceViewModel.swift
import BTCPriceCore
import BTCPriceComposer
import Foundation

@Observable
final class BTCPriceViewModel {
  // MARK: - Estado Observable
  var priceText: String = "--"
  var timestampText: String = "--"
  var isLoading: Bool = false
  var errorMessage: String?
  var isUsingCache: Bool = false

  // MARK: - Dependencias
  private let dependencies: AppDependencies
  private var updateTask: Task<Void, Never>?

  init(dependencies: AppDependencies = AppDependencies()) {
    self.dependencies = dependencies
  }

  // MARK: - API Pública

  func startMonitoring() {
    guard updateTask == nil else { return }  // Prevenir múltiples tareas

    updateTask = Task {
      while !Task.isCancelled {
        await fetchPrice()
        try? await Task.sleep(for: .seconds(1))
      }
    }
  }

  func stopMonitoring() {
    updateTask?.cancel()
    updateTask = nil
  }

  func refresh() async {
    await fetchPrice()
  }

  // MARK: - Helpers Privados

  private func fetchPrice() async {
    isLoading = true
    errorMessage = nil
    isUsingCache = false

    do {
      // 1. Obtener precio fresco
      let quote = try await dependencies.fetchWithFallback.execute()

      // 2. Guardar en caché
      try await dependencies.persistPrice.execute(quote)

      // 3. Renderizar texto formateado
      let formatted = await dependencies.renderPrice.execute(quote)

      // 4. Actualizar UI
      priceText = formatted.priceText
      timestampText = formatted.timestampText
      isLoading = false

    } catch {
      // 5. Fallback a caché
      if let cached = await dependencies.persistPrice.loadCached() {
        let formatted = await dependencies.renderPrice.execute(cached)
        priceText = formatted.priceText
        timestampText = formatted.timestampText
        isUsingCache = true
      } else {
        errorMessage = "No se pudo cargar el precio"
      }

      isLoading = false
    }
  }
}
```

### Decisiones de Diseño

**¿Por qué Task en lugar de Timer?**

- Concurrencia moderna con async/await
- Cancelación fácil (Task.cancel())
- Mejor manejo de recursos
- Funciona naturalmente con actores

**¿Por qué guard updateTask == nil?**

- Previene tareas duplicadas si startMonitoring() se llama dos veces
- Protección contra fugas de recursos

**¿Por qué método fetchPrice() separado?**

- Responsabilidad única: un método = una obtención
- Reutilizable para refresh manual
- Más fácil de testear (se puede llamar directamente)

**¿Por qué flag isUsingCache?**

- UI puede mostrar indicador de "modo offline"
- El usuario sabe que los datos pueden estar desactualizados

**¿Por qué @Observable en lugar de @ObservableObject?**

- Menos boilerplate (sin @Published)
- Mejor rendimiento (observación granular)
- Patrón moderno de Swift (iOS 17+)

### Estrategia de Manejo de Errores

```swift
// Si falla la red:
catch {
  // 1. Intentar caché primero
  if let cached = await dependencies.persistPrice.loadCached() {
    // Mostrar datos cacheados con indicador
    isUsingCache = true
  } else {
    // 2. Solo mostrar error si no existe caché
    errorMessage = "No se pudo cargar el precio"
  }
}
```

Degradación elegante: Siempre preferir mostrar datos desactualizados sobre mensaje de error.

---

## Paso 4: La App SwiftUI - Código de Vista Mínimo

Con ViewModel manejando toda la lógica, la vista es trivial:

```swift
// BTCPriceApp/ContentView.swift
import SwiftUI

struct ContentView: View {
  @State private var viewModel = BTCPriceViewModel()

  var body: some View {
    Text(viewModel.priceText)
      .onAppear {
        viewModel.startMonitoring()
      }
      .onDisappear {
        viewModel.stopMonitoring()
      }
  }
}
```

Eso es todo. 14 líneas para una app que se actualiza en tiempo real.

### ¿Por Qué Tan Simple?

- @State: Crea instancia observable
- .onAppear: Inicia monitoreo cuando la vista aparece
- .onDisappear: Detiene monitoreo cuando la vista desaparece (limpieza de recursos)
- viewModel.priceText: Actualizaciones automáticas de UI cuando cambia la propiedad

### El Punto de Entrada de la App

```swift
// BTCPriceAppApp.swift
import SwiftUI

@main
struct BTCPriceAppApp: App {
  var body: some Scene {
    WindowGroup {
      ContentView()
    }
  }
}
```

Estructura estándar de app SwiftUI. Nada especial necesario.

---

## Paso 5: La Crisis del Sandbox - Cuando Todo Se Rompe

Esperado: Ejecutar app, ver actualizaciones de precio.

Realidad: La app muestra -- para siempre.

### La Salida de la Consola 🚨

```plaintext
networkd_settings_read_from_file Sandbox está impidiendo que este proceso
lea el archivo de configuración de networkd en
"/Library/Preferences/com.apple.networkd.plist", por favor agrega una excepción.

nw_resolver_create_dns_service_locked [C1.1] 
DNSServiceCreateDelegateConnection falló: ServiceNotRunning(-65563)

Conexión 1: falló al conectar 10:-72000, razón -1

Task <...> carga HTTP falló, 0/0 bytes (código de error: -1003 [10:-72000])

Error Domain=NSURLErrorDomain Code=-1003 
"No se pudo encontrar un servidor con el hostname especificado."
```

Traducción: El App Sandbox de macOS está bloqueando todo el acceso a la red.

### El Misterio: ¿Por Qué Funciona la CLI Pero No la App?

Herramienta CLI: Funciona perfectamente, obtiene precios cada segundo.
App macOS: Ni siquiera puede resolver DNS.

**Investigación:**

```bash
# CLI se ejecuta sin sandbox
$ swift run BTCPrice-CLI
✅ Funciona - obtiene de api.binance.com

# App macOS se ejecuta CON sandbox
$ open BTCPriceApp.app
❌ Falla - sandbox bloquea la red
```

### Entendiendo el App Sandbox de macOS

¿Qué es?

- Característica de seguridad que restringe las capacidades de la app
- Habilitado por defecto para apps macOS distribuidas en App Store
- Previene acceso no autorizado a:
  - Red
  - Sistema de archivos fuera del contenedor
  - Datos del usuario
  - Recursos del sistema

¿Por qué la CLI no tiene sandbox?

- Las herramientas de línea de comandos no están sandboxeadas por defecto
- Se ejecutan con permisos completos del usuario
- No se distribuyen a través de App Store

Insight clave: Trade-off entre seguridad y conveniencia.

### La Solución: Entitlements de Red

Entitlements = declaraciones explícitas de permisos para apps sandboxeadas.

Para arreglar el acceso a la red:

1. Abre Xcode
2. Selecciona el target BTCPriceApp (NO CLI)
3. Ve a la pestaña "Signing & Capabilities"
4. Haz clic en "+ Capability"
5. Agrega "App Sandbox" (si no está presente)
6. Habilita: ✅ Outgoing Connections (Client)

Esto crea un archivo de entitlements:

```xml
<!-- BTCPriceApp.entitlements -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
"http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
</dict>
</plist>
```

### Qué Hace Esto

- `com.apple.security.app-sandbox`: Habilita el sandbox
- `com.apple.security.network.client`: Permite conexiones de red salientes

Nota de seguridad: Aún restringido de:

- ❌ Conexiones entrantes (modo servidor)
- ❌ Acceso arbitrario a archivos
- ❌ Leer datos de otras apps

Después de agregar el entitlement:

```bash
# Reconstruir y ejecutar
✅ La app ahora obtiene precios exitosamente
✅ La resolución DNS funciona
✅ Las conexiones HTTPS tienen éxito
```

### Tips de Depuración que Aprendimos

1. Revisa Console.app: macOS registra violaciones de sandbox
2. Busca "Sandbox is preventing": Palabra clave para problemas de sandbox
3. Compara targets: Si uno funciona y otro no, revisa los entitlements
4. Lee códigos de error: -1003 = "No se pudo encontrar servidor" a menudo significa DNS bloqueado

---

## Paso 6: La UI Final - Más Allá del Texto Plano

Después de arreglar el sandbox, mejoramos la UI:

```swift
struct ContentView: View {
  @State private var viewModel = BTCPriceViewModel()

  var body: some View {
    VStack(spacing: 24) {
      // Ícono de Bitcoin
      Image(systemName: "bitcoinsign.circle.fill")
        .font(.system(size: 60))
        .foregroundStyle(.orange)

      // Precio
      VStack(spacing: 8) {
        Text(viewModel.priceText)
          .font(.system(size: 48, weight: .bold))
          .monospacedDigit()

        HStack {
          Image(systemName: "clock")
          Text(viewModel.timestampText)
        }
        .font(.subheadline)
        .foregroundStyle(.secondary)
      }

      // Información de Actualizaciones en Vivo
      GroupBox("Actualizaciones en Vivo") {
        VStack(alignment: .leading, spacing: 12) {
          InfoRow(
            icon: "arrow.triangle.2.circlepath",
            label: "Frecuencia de Actualización",
            value: "Cada segundo"
          )

          InfoRow(
            icon: "network",
            label: "Fuente de Datos",
            value: "API de Binance"
          )

          InfoRow(
            icon: "exclamationmark.triangle",
            label: "Respaldo",
            value: "CryptoCompare"
          )

          InfoRow(
            icon: "archivebox",
            label: "Soporte Offline",
            value: "Cacheado localmente"
          )
        }
      }
    }
    .padding()
    .frame(width: 400, height: 500)
    .onAppear { viewModel.startMonitoring() }
    .onDisappear { viewModel.stopMonitoring() }
  }
}

struct InfoRow: View {
  let icon: String
  let label: String
  let value: String

  var body: some View {
    HStack {
      Image(systemName: icon)
        .foregroundStyle(.blue)
        .frame(width: 20)

      VStack(alignment: .leading, spacing: 2) {
        Text(label)
          .font(.caption)
          .foregroundStyle(.secondary)
        Text(value)
          .font(.subheadline.weight(.medium))
      }

      Spacer()
    }
  }
}
```

Resultado: App de aspecto profesional con:

- Ícono de Bitcoin
- Visualización grande de precio con dígitos monoespaciados
- Timestamp
- Lista de características (frecuencia de actualización, fuente de datos, respaldo, soporte offline)

---

## Desafíos de Desarrollo Real que Resolvimos

### Desafío 1: "La App Muestra -- Para Siempre, Sin Mensajes de Error"

Problema: La app se inicia pero nunca actualiza el precio.

Síntomas:

- Sin errores obvios en la consola de Xcode
- La CLI funciona bien
- La vista SwiftUI aparece normal

Investigación:

- Revisamos Console.app (logs del sistema macOS)
- Encontramos: "Sandbox está impidiendo acceso a la red"

Causa raíz: El App Sandbox de macOS bloquea la red por defecto.

Solución: Agregar entitlement com.apple.security.network.client.

Lección: Revisa Console.app para violaciones de sandbox. Xcode no siempre las muestra.

### Desafío 2: "La CLI y la App Se Comportan Diferente"

Problema: El mismo código funciona en CLI, falla en la app.

Por qué:

- Herramientas CLI: No sandboxeadas, permisos completos del usuario
- Apps macOS: Sandboxeadas por defecto, capacidades restringidas

Solución: Entender diferencias de plataforma, configurar apropiadamente.

Lección: No asumas que todos los ejecutables Swift tienen las mismas capacidades.

### Desafío 3: "Cuándo Usar @Observable vs @ObservableObject"

Problema: SwiftUI tiene dos patrones de observación, ¿cuál usar?

Decisión:

- @Observable (iOS 17+): Moderno, menos boilerplate, mejor rendimiento
- @ObservableObject (iOS 13+): Legacy, más compatible, requiere @Published

Nuestra elección: @Observable (apuntando a iOS 17+)

Lección: Los patrones modernos son más simples, pero verifica los requisitos de plataforma.

### Desafío 4: "Cómo Detener Tareas en Background al Desaparecer la Vista"

Problema: El ViewModel sigue obteniendo precios incluso cuando la vista se fue.

Síntomas:

- Fugas de memoria
- Llamadas de red innecesarias
- Drenaje de batería

Solución:

```swift
.onDisappear {
  viewModel.stopMonitoring()  // Cancelar la Task
}
```

Lección: Siempre limpia recursos en .onDisappear.

---

## Insights de Arquitectura

### Validación Final - El Pago de Clean Architecture

Mira cómo fluyen las dependencias:

```plaintext
BTCPriceApp (Presentación)
  ↓ imports
BTCPriceComposer (Composition Root)
  ↓ imports
BTCPriceCore (Dominio + Casos de Uso)
  ↑ implementado por
BTCPriceNetworking (Infraestructura)
BTCPricePersistence (Infraestructura)
```

Victoria clave: El ViewModel solo conoce:

- AppDependencies (composition root)
- Tipos del dominio (PriceQuote)
- Protocolos de casos de uso

El ViewModel NO conoce:

- ❌ APIs de Binance/CryptoCompare
- ❌ UserDefaults
- ❌ Codificación/decodificación JSON
- ❌ URLSession

Resultado: Podemos intercambiar implementaciones sin tocar el ViewModel.

**Ejemplo: Cambiar a CoreData**

```swift
// Solo en AppDependencies
public init(...) {
  // self.priceStore = UserDefaultsPriceStore(...)  // Antiguo
  self.priceStore = CoreDataPriceStore(...)         // Nuevo

  // Todo lo demás sin cambios
  // El ViewModel no necesita saber
}
```

Promesa de Clean Architecture cumplida: Los cambios de infraestructura no se propagan a la lógica de negocio.

### Patrón Composition Root - Por Qué Importa

**Antes de Composition Root:**

```swift
// El ViewModel necesitaría saber:
let session = URLSession.shared
let binance = BinancePriceLoader(session: session)
let crypto = CryptoComparePriceLoader(session: session)
let fetchUseCase = FetchWithFallback(primary: binance, fallback: crypto)
// ... repetir en cada archivo
```

**Con Composition Root:**

```swift
// El ViewModel solo necesita:
let deps = AppDependencies()
```

Beneficios:

1. Fuente única de verdad para dependencias
2. Testing fácil - inyectar dependencias de test
3. Reutilizable entre CLI, app, previews
4. Cambios en un lugar - actualizar AppDependencies, todos los consumidores actualizados

**Ejemplo - SwiftUI Preview:**

```swift
#Preview {
  let testDeps = AppDependencies(
    userDefaults: .init(suiteName: "preview")!,
    urlSession: .mocked  // Mock hipotético
  )
  let viewModel = BTCPriceViewModel(dependencies: testDeps)
  return ContentView(viewModel: viewModel)
}
```

### Patrones Modernos de Swift Aplicados

1. @Observable (Swift 6 / iOS 17+)
   - Reemplaza boilerplate de @Published
   - Observación automática de todas las propiedades
   - Mejor rendimiento

2. Concurrencia Estructurada
   - Task { } en lugar de DispatchQueue
   - Cancelación automática con .cancel()
   - async/await en todas partes

3. Conformidad Sendable
   - AppDependencies: Sendable
   - Compartir seguro entre dominios de concurrencia
   - Seguridad de hilos impuesta por el compilador

4. Aislamiento de Actor (en stores)
   - actor UserDefaultsPriceStore
   - Seguridad de hilos automática
   - Sin locks manuales necesarios

---

## Decisiones Clave de Diseño que Tomamos

### 1. ¿Por Qué Módulo Composer Separado?

Alternativa: Poner AppDependencies en el target de la app.

Elección: Módulo dedicado para composition root.

Razones:

- Reutilizable entre targets CLI y App
- Hace explícito el grafo de dependencias
- Separación clara de responsabilidades
- Fácil de testear en aislamiento

Trade-off: Complejidad extra del módulo vs organización del código.

### 2. ¿Por Qué @Observable En Lugar de @ObservableObject?

Alternativa: Usar @ObservableObject legacy + @Published.

Elección: Macro moderno @Observable.

Razones:

- Menos boilerplate (sin @Published en cada propiedad)
- Mejor rendimiento (observación granular)
- A prueba de futuro (dirección de SwiftUI)

Trade-off: Requisito iOS 17+ vs mejor DX.

### 3. ¿Por Qué Task En Lugar de Timer?

Alternativa: Timer.scheduledTimer(...) (patrón antiguo).

Elección: Task con loop while + sleep.

Razones:

- Funciona naturalmente con async/await
- Cancelación fácil
- Sin ciclos de retención
- Código más limpio

Comparación:

```swift
// Forma antigua
var timer: Timer?
timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
  Task { await fetchPrice() }  // Conectando async en sync
}

// Forma nueva
updateTask = Task {
  while !Task.isCancelled {
    await fetchPrice()         // Ya async
    try? await Task.sleep(for: .seconds(1))
  }
}
```

### 4. ¿Por Qué Degradación Elegante En Lugar de Mostrar Error?

Alternativa: Mostrar mensaje de error cuando falla la red.

Elección: Fallback a datos cacheados silenciosamente (con indicador).

Razones:

- Experiencia de usuario: datos desactualizados > sin datos
- Escenarios offline comunes (modo avión, túneles)
- Reducir ansiedad del usuario

Implementación:

```swift
catch {
  if let cached = await dependencies.persistPrice.loadCached() {
    // Mostrar cacheado con indicador "offline"
    isUsingCache = true
  } else {
    // Solo mostrar error si realmente no hay datos
    errorMessage = "No se pudo cargar el precio"
  }
}
```

---

## Resultados Listos para Producción

Ahora tenemos dos apps completamente funcionales:

### Herramienta CLI

- ✅ Se ejecuta en terminal
- ✅ Actualiza cada segundo
- ✅ Muestra contador de actualizaciones
- ✅ Precio formateado + timestamp
- ✅ Fallback offline
- ✅ Sin configuración necesaria

### App macOS

- ✅ UI SwiftUI en tiempo real
- ✅ Actualizaciones automáticas
- ✅ Ícono de Bitcoin + precio formateado
- ✅ Visualización de información de características
- ✅ Soporte offline con indicador
- ✅ Limpieza apropiada de recursos

Ambas apps:

- Usan el mismo composition root
- Comparten toda la lógica de negocio
- Requieren cero duplicación
- Infraestructura testeada debajo

### Métricas de Código

**Código de la Aplicación:**

| Componente | Líneas de Código |
|-----------|------------------|
| AppDependencies | 49 LOC |
| BTCPriceViewModel | 76 LOC |
| ContentView (con estilos) | ~60 LOC |
| CLI main.swift | 39 LOC |
| **Total código app** | **~224 LOC** |

**Infraestructura (ya escrita):**

| Capa | Líneas de Código |
|------|------------------|
| Networking | ~150 LOC |
| Persistence | ~41 LOC |
| Casos de uso | ~120 LOC |
| Tests | ~500 LOC |
| **Total infraestructura** | **~811 LOC** |

**Resultado:** 224 líneas de código de app aprovechando 800+ líneas de base testeada.

---

## Lo Que Aprendimos

1. Composition Root Centraliza la Complejidad

   Problema: Creación de dependencias dispersa por el codebase.

   Solución: Clase única AppDependencies.

   Beneficio: Cambiar infraestructura en un lugar, todas las apps actualizadas.

   Lección: Complejidad en un lugar > complejidad en todas partes.

2. Las Diferencias de Plataforma Importan

   Descubrimiento: La CLI funciona, la app macOS no (mismo código).

   Razón: Las restricciones de sandbox difieren.

   Solución: Entender modelos de seguridad de plataforma.

   Lección: No asumas que todos los ejecutables tienen las mismas capacidades.

3. Las Violaciones de Sandbox No Siempre Son Obvias

   Problema: La app falla silenciosamente, sin errores en la consola de Xcode.

   Descubrimiento: Tuvimos que revisar Console.app (logs del sistema).

   Lección: Conoce tus herramientas de depuración. Xcode != imagen completa.

4. Swift Moderno Simplifica el Manejo de Estado

   Antiguo: @ObservableObject + @Published + seguimiento manual de cambios.

   Nuevo: @Observable + observación automática.

   Resultado: 30% menos código, misma funcionalidad.

   Lección: Mantente al día con la evolución de Swift.

5. La Degradación Elegante Vence a los Mensajes de Error

   Elección: Mostrar datos cacheados en lugar de "Error de Red".

   Impacto en usuario: La app se siente confiable, no rota.

   Lección: Pensar offline-first mejora la UX.

6. Clean Architecture Escala Sin Esfuerzo

   Verificación de realidad: Construimos CLI en 20 minutos, app macOS en 1 hora (ignorando depuración de sandbox).

   Por qué tan rápido: La infraestructura ya existía, solo la conectamos.

   Lección: El costo de arquitectura inicial se paga en velocidad de implementación.

---

## Conclusión

Comenzamos con módulos aislados: networking, persistencia, casos de uso.

Ahora tenemos dos apps de producción:

- Herramienta CLI para usuarios de terminal
- App macOS con UI en tiempo real

El viaje reveló:

1. Composition Root centraliza la creación de dependencias, haciendo todo testeable y reutilizable
2. @Observable es más simple que @ObservableObject, pero requiere iOS 17+
3. El App Sandbox de macOS bloquea la red por defecto - necesita entitlement explícito
4. Las herramientas CLI no tienen restricciones de sandbox (trade-off de seguridad)
5. Degradación elegante (mostrar caché) vence a mensajes de error para UX

La arquitectura valió la pena:

- Mismo AppDependencies para CLI y App
- Cero duplicación de lógica de negocio
- 224 LOC para ambas apps combinadas
- Todo respaldado por 500+ líneas de tests

Lección más sorprendente: El problema del sandbox tomó más tiempo depurar que construir las apps reales.

Las restricciones de seguridad son invisibles hasta que las encuentras. Siempre revisa Console.app, no solo Xcode.

---

## Qué Sigue

Las apps funcionan, pero no terminamos:

1. Soporte iOS - Hacerlo funcionar en iPhone/iPad
2. Mejoras SwiftUI - Gráficos, datos históricos, alertas de precio
3. Testing de la UI - Tests de ViewModel, snapshot tests
4. CI/CD - Builds y releases automatizados
5. Deployment del Mundo Real - Preparación para App Store

La base es sólida. El networking funciona. La persistencia funciona. Las apps funcionan.

Tiempo de pulir y enviar 🚀.

---

## Apéndice: Referencia de Entitlements de Sandbox

Entitlements comunes para apps macOS:

| Entitlement                                       | Permiso                              |
|---------------------------------------------------|--------------------------------------|
| com.apple.security.network.client                 | Conexiones de red salientes          |
| com.apple.security.network.server                 | Conexiones de red entrantes          |
| com.apple.security.files.user-selected.read-only  | Leer archivos que el usuario eligió  |
| com.apple.security.files.user-selected.read-write | Leer/escribir archivos que el usuario eligió |
| com.apple.security.files.downloads.read-only      | Leer carpeta Downloads               |
| com.apple.security.app-sandbox                    | Habilitar sandbox (requerido para App Store) |

Nuestra app solo necesita: network.client para obtener precios BTC.

Principio de seguridad: Solicitar permisos mínimos necesarios.

---

## Recursos

### Essential Developer Academy

Los patrones de arquitectura, metodologías de testing y principios de código limpio demostrados en esta serie de artículos están inspirados en las enseñanzas de **Caio Zullo** y **Mike Apostolakis** de Essential Developer.

Si quieres profundizar en arquitectura iOS, TDD, Clean Architecture y convertirte en un desarrollador iOS senior completo, revisa su programa **iOS Lead Essentials**:

👉 [Programa iOS Lead Essentials](https://iosacademy.essentialdeveloper.com/p/ios-lead-essentials/)

El programa cubre:

- Clean Architecture y principios SOLID
- Test-Driven Development (TDD)
- Diseño modular e inyección de dependencias
- Patrones modernos de Swift y mejores prácticas
- Desarrollo de proyectos del mundo real
- Code reviews y mentoring de desarrolladores senior

Miles de desarrolladores en todo el mundo han transformado sus carreras a través de este programa, obteniendo posiciones en empresas top y aumentando significativamente sus salarios.

### Documentación de App Sandbox de macOS

Para más información sobre App Sandbox de macOS y entitlements:

- [Guía de Diseño de App Sandbox](https://developer.apple.com/documentation/security/app_sandbox) - Documentación oficial de Apple sobre App Sandbox
- [Documentación de Entitlements](https://developer.apple.com/documentation/bundleresources/entitlements) - Lista completa de entitlements disponibles
- [App Sandbox en Profundidad](https://developer.apple.com/documentation/security/app_sandbox/app_sandbox_in_depth) - Análisis profundo del modelo de seguridad sandbox
- [Hardening Runtime](https://developer.apple.com/documentation/security/hardened_runtime) - Características de seguridad adicionales para apps macOS

### Artículos Relacionados en Esta Serie

1. [De Requerimientos a Casos de Uso: Construyendo una App de Precio BTC de la Forma Correcta](../desde-requerimientos-hasta-casos-de-uso-construyendo-una-aplicacion-para-precio-de-btc-de-la-forma-correcta) - Convirtiendo requerimientos en casos de uso claros
2. [De Casos de Uso a Código: Construyendo el Core con TDD](../from-use-cases-to-code-building-the-core-with-tdd) - Capa de dominio y casos de uso con TDD
3. [De Core a Realidad: Infraestructura, URLSession y Desafíos de APIs del Mundo Real](../from-core-to-reality-infrastructure-urlsession-real-world-api-challenges) - Implementación de capa de networking
4. [Decisiones de Persistencia: UserDefaults vs FileManager vs SwiftData](../persistence-decisions-userdefaults-filemanager-swiftdata) - Comparación e implementación de capa de persistencia

---

## Reflexiones Finales

Construir esta app de precio BTC desde cero nos enseñó más que solo cómo obtener precios y mostrarlos. Aprendimos:

- Cómo Clean Architecture hace el código testeable, mantenible y escalable
- Por qué TDD no es solo sobre tests—es sobre diseño
- Cómo Composition Root simplifica el manejo de dependencias
- Por qué las diferencias de plataforma (como restricciones de sandbox) importan
- Que depurar problemas a nivel de sistema requiere las herramientas correctas (Console.app)

El viaje desde requerimientos vagos hasta apps listas para producción no siempre fue suave. Encontramos bugs, descubrimos peculiaridades de plataforma y pasamos horas depurando problemas de sandbox. Pero cada desafío reforzó el valor de una arquitectura sólida y testing exhaustivo.

Si estás serio sobre convertirte en un desarrollador iOS senior completo y quieres aprender estos patrones de expertos de la industria, recomiendo encarecidamente revisar el programa **iOS Lead Essentials** de Caio Zullo y Mike Apostolakis en Essential Developer. Su metodología y enfoque de enseñanza han ayudado a miles de desarrolladores en todo el mundo a avanzar en sus carreras.

La base que construimos—networking, persistencia, casos de uso y composición—ahora está lista para escalar. Ya sea que estés agregando nuevas características, soportando nuevas plataformas o manejando requerimientos más complejos, la arquitectura te apoyará.

Sigue construyendo, sigue aprendiendo y recuerda: **la buena arquitectura se paga cuando más la necesitas** 🚀

---

*Este artículo es parte de una serie sobre construcción de apps iOS listas para producción usando Clean Architecture y TDD. Las metodologías y patrones demostrados están inspirados en las enseñanzas de Essential Developer Academy.*
