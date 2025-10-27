---
title: 'Decisiones de Persistencia: UserDefaults vs FileManager vs SwiftData'
description: 'Construyendo una capa de persistencia robusta con TDD: Cuando tres enfoques compiten, los benchmarks deciden. Un viaje a través de bugs de precisión Decimal, concurrencia de Swift 6, y arquitectura orientada al rendimiento.'
pubDate: 'Oct 27 2025'
heroImage: './hero.png'
lang: 'es'
translationKey: 'persistence-decisions'
slug: 'persistence-decisions-userdefaults-filemanager-swiftdata'
---

## Introducción

En el [artículo anterior](../from-core-to-reality-infrastructure-urlsession-real-world-api-challenges) construimos una capa de networking lista para producción que obtiene precios de BTC de APIs reales. Tuvimos loaders, manejo de errores y pruebas de integración.

Pero hay un problema: **cada lanzamiento de la app requiere una llamada de red**.

Los usuarios esperan un inicio instantáneo. Esperan que la app muestre el último precio conocido inmediatamente, luego actualice cuando lleguen datos frescos. Esperan resiliencia cuando están offline.

Necesitamos persistencia.

El desafío: **¿Dónde y cómo cacheamos un solo `PriceQuote`?**

Tres candidatos surgieron:

- **UserDefaults** - Almacenamiento clave-valor integrado de Apple
- **FileManager** - Persistencia personalizada de archivos JSON
- **SwiftData** - ORM moderno (iOS 17+)

La sorpresa: **Implementar los tres reveló bugs críticos, brechas de rendimiento y lecciones de arquitectura que moldearon nuestra decisión final.**

Al final de este artículo, verás por qué el benchmarking vence a las suposiciones, cómo el manejo de Decimal de SwiftData casi nos costó precisión financiera, y por qué la solución más simple a menudo gana.

---

## Paso 1: Configuración de Módulos - Separar Responsabilidades

**Primer principio**: la persistencia es infraestructura, no dominio.

```bash
btc-price/
├── BTCPriceCore/          # Capa de dominio (protocolo PriceStore)
├── BTCPriceNetworking/    # Infraestructura de networking
└── BTCPricePersistence/   # Infraestructura de persistencia (nuevo)
```

### El Contrato del Dominio (Ya Existe)

```swift
// En BTCPriceCore/Domain/Protocols/PriceStore.swift
public protocol PriceStore: Sendable {
    func save(_ quote: PriceQuote) async throws
    func loadCached() async -> PriceQuote?
}
```

**Insight clave**: El dominio define comportamiento, la infraestructura elige implementación.

El caso de uso ya está esperando:

```swift
// En BTCPriceCore/UseCases/PersistLastValidPrice.swift
public struct PersistLastValidPrice: Sendable {
  private let store: PriceStore

  public func execute(_ quote: PriceQuote) async throws {
    try await store.save(quote)
  }

  public func loadCached() async -> PriceQuote? {
    await store.loadCached()
  }
}
```

**Ganancia de Clean Architecture**: El caso de uso fue escrito hace meses, ahora solo conectamos almacenamiento concreto.

## Paso 2: El Enfoque de Evaluación TDD

En lugar de elegir basándonos en suposiciones, decidimos: implementar los tres con TDD, luego medir.

### Contrato Primero-Pruebas

Cada implementación debe pasar estas pruebas:

```swift
@Test("save and load returns same quote")
func saveAndLoadCycle() async throws {
  let sut = /* concrete store */

  let quote = PriceQuote(
    value: 68_901.23,
    currency: "USD",
    timestamp: Date(timeIntervalSince1970: 1_700_000_000)
  )

  try await sut.save(quote)
  let loaded = await sut.loadCached()

  #expect(loaded == quote)
}

@Test("loadCached returns nil when empty")
@Test("corrupted data returns nil instead of crashing")
```

**Beneficio TDD**: Las pruebas definen el contrato antes de escribir código de almacenamiento.

## Paso 3: Implementación UserDefaults - La Base

### 🔴 RED - Escribe la prueba

```swift
@Suite(.serialized)
struct UserDefaultsPriceStoreTests {
  @Test func saveAndLoadCycle() async throws {
    let suiteName = "com.btcprice.tests.\(UUID().uuidString)"
    let defaults = UserDefaults(suiteName: suiteName)!
    defer { defaults.removePersistentDomain(forName: suiteName) }

    let sut = UserDefaultsPriceStore(userDefaults: defaults)
    // ... código de prueba
  }
}
```

**Aislamiento de pruebas**: Cada prueba usa nombre de suite único, limpieza en defer.

### Desafío 1: Cumplimiento de Concurrencia Swift 6

```bash
Compilation error:
  error: sending 'defaults' risks causing data races
  note: sending to actor-isolated initializer 'init(userDefaults:)'
```

**Causa raíz**: `UserDefaults` no es `Sendable` por defecto en Swift 6.

**Solución descubierta**: `@unchecked @retroactive Sendable`

```swift
// UserDefaults+Sendable.swift
extension UserDefaults: @unchecked @retroactive Sendable {}
```

¿Por qué `@retroactive`? (Nuevo en Swift 6)

- Marca la conformidad como "retroactiva" - agregada a un tipo que no poseemos
- Si Apple hace que `UserDefaults: Sendable` en el futuro, nuestro código no se romperá
- Previene errores de conformidad duplicada entre módulos

¿Por qué `@unchecked`?

- `UserDefaults` ES thread-safe (documentado por Apple)
- Pero es una clase, no puede probarlo al compilador
- `@unchecked` dice "garantizo que esto es seguro"

**Lección**: Swift 6 de concurrencia estricta detecta riesgos reales, pero confiar en la documentación de Apple a veces es necesario.

### 🟢 GREEN - Implementación mínima

```swift
public actor UserDefaultsPriceStore: PriceStore {
  private let userDefaults: UserDefaults
  private let key: String

  public init(
    userDefaults: UserDefaults = .standard,
    key: String = "btc_price_cache"
  ) {
    self.userDefaults = userDefaults
    self.key = key
  }

  public func save(_ quote: PriceQuote) async throws {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .secondsSince1970

    let data = try encoder.encode(quote)
    userDefaults.set(data, forKey: key)
  }

  public func loadCached() async -> PriceQuote? {
    guard let data = userDefaults.data(forKey: key) else {
      return nil
    }

    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .secondsSince1970

    return try? decoder.decode(PriceQuote.self, from: data)
  }
}
```

### Decisiones de diseño

- `actor`: Thread-safe por diseño (aunque `UserDefaults` ya lo es)
- `try?` en load: Datos corruptos retornan `nil`, no falla
- `.secondsSince1970`: Formato de fecha compacto, coincide con expectativas de prueba
- Clave configurable: Permite múltiples cachés si es necesario

### Haciendo `PriceQuote` `Codable`

Requerimiento rápido descubierto:

```swift
// En BTCPriceCore/Domain/Entities/PriceQuote.swift
public struct PriceQuote: Equatable, Sendable, Codable {
  public let value: Decimal
  public let currency: String
  public let timestamp: Date
}
```

**Síntesis automática**: Swift genera `Codable` para nosotros, Decimal ya es `Codable`.

```bash
Resultado de pruebas: ✅ 3 pruebas pasando, 41 líneas de código.
```

## Paso 4: Implementación FileManager - Control vs Complejidad

Mismo enfoque TDD, desafíos diferentes.

### 🔴 RED - Pruebas específicas de FileManager

```swift
@Test("save creates directory if it doesn't exist")
func savesCreatesDirectories() async throws {
  let tempDir = FileManager.default.temporaryDirectory
    .appendingPathComponent("nested/deep/cache.json")

  let sut = FileManagerPriceStore(fileURL: tempDir)

  try await sut.save(quote)

  // Verificar que el directorio fue creado
  let dirExists = FileManager.default.fileExists(
    atPath: tempDir.deletingLastPathComponent().path
  )
  #expect(dirExists)
}
```

### 🟢 GREEN - Implementación FileManager

```swift
public actor FileManagerPriceStore: PriceStore {
  private let fileURL: URL
  private let fileManager: FileManager

  public func save(_ quote: PriceQuote) async throws {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .secondsSince1970
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]

    let data = try encoder.encode(quote)

    // Crear directorios intermedios
    let directory = fileURL.deletingLastPathComponent()
    try fileManager.createDirectory(
      at: directory,
      withIntermediateDirectories: true
    )

    // Escritura atómica - previene corrupción
    try data.write(to: fileURL, options: .atomic)
  }

  public func loadCached() async -> PriceQuote? {
    guard fileManager.fileExists(atPath: fileURL.path) else {
      return nil
    }

    guard let data = try? Data(contentsOf: fileURL) else {
      return nil
    }

    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .secondsSince1970
    return try? decoder.decode(PriceQuote.self, from: data)
  }
}
```

### Diferencias clave con `UserDefaults`

- Creación de directorios: Debe crear directorios padre
- Escrituras atómicas: `.atomic` previene escrituras parciales si la app falla
- JSON formateado: Legible por humanos para debugging
- Claves ordenadas: Diffs consistentes en git

```bash
Resultado de pruebas: ✅ 6 pruebas pasando, 54 líneas de código (+32% vs UserDefaults).
```

**Trade-off**: Más control, más complejidad.

## Paso 5: Implementación SwiftData - Moderno pero Sorprendente

Solo iOS 17+, pero vale la pena evaluar para apps modernas.

### 🔴 RED - Configuración de pruebas SwiftData

```swift
@Test func saveAndLoadCycle() async throws {
  let schema = Schema([PriceQuoteModel.self])
  let config = ModelConfiguration(isStoredInMemoryOnly: true)
  let container = try ModelContainer(for: schema, configurations: config)

  let sut = SwiftDataPriceStore(modelContainer: container)
  // ... prueba
}
```

**Desafío**: SwiftData requiere clase `@Model`, pero el dominio tiene struct `PriceQuote`.

**Solución**: Separar modelo de persistencia del modelo de dominio.

### Desafío 2: El Bug de Precisión Decimal 🐛

Primera implementación:

```swift
@Model
final class PriceQuoteModel {
  var value: Decimal  // ← Parece razonable
  var currency: String
  var timestamp: Date
}
```

```bash
Falló la prueba:
Expectativa fallida:
  loaded → PriceQuote(value: 68901.22999999998976, ...)
  quote  → PriceQuote(value: 68901.23, ...)
```

¡Qué?! ¡Se perdió la precisión Decimal!

**Investigación reveló**: SwiftData convierte `Decimal` → `Double` → `SQLite`

Esto es catastrófico para apps financieras:

- Esperado: 68901.23
- Almacenado: 68901.22999999998976
- Errores de punto flotante en cálculos de dinero

### 🟢 GREEN - La Solución con String

```swift
@Model
final class PriceQuoteModel {
  // Almacenar Decimal como String para preservar precisión
  private var valueString: String
  var currency: String
  var timestamp: Date

  // Propiedad calculada por conveniencia
  var value: Decimal {
    Decimal(string: valueString) ?? 0
  }

  init(value: Decimal, currency: String, timestamp: Date) {
    self.valueString = value.description  // ← "68901.23"
    self.currency = currency
    self.timestamp = timestamp
  }

  func toDomain() -> PriceQuote {
    PriceQuote(value: value, currency: currency, timestamp: timestamp)
  }
}
```

### Por Qué Esto Funciona

- `Decimal.description` preserva precisión exacta: 68901.23 → "68901.23"
- `Decimal(string:)` restaura valor exacto: "68901.23" → 68901.23
- Evita conversión `Double` completamente

**Resultado de prueba**: ✅ Ahora pasa con precisión exacta.

**Lección aprendida**: Nunca asumas que los frameworks manejan tus tipos de dominio correctamente.

### Implementación Completa de SwiftData

```swift
@available(macOS 14, iOS 17, *)
public actor SwiftDataPriceStore: PriceStore {
  private let modelContainer: ModelContainer

  public func save(_ quote: PriceQuote) async throws {
    let context = ModelContext(modelContainer)

    // Eliminar existente (solo almacenamos uno)
    let fetchDescriptor = FetchDescriptor<PriceQuoteModel>()
    let existing = try context.fetch(fetchDescriptor)
    for model in existing {
      context.delete(model)
    }

    // Insertar nuevo
    let model = PriceQuoteModel(
      value: quote.value,
      currency: quote.currency,
      timestamp: quote.timestamp
    )
    context.insert(model)
    try context.save()
  }

  public func loadCached() async -> PriceQuote? {
    let context = ModelContext(modelContainer)
    let fetchDescriptor = FetchDescriptor<PriceQuoteModel>()

    guard let models = try? context.fetch(fetchDescriptor),
          let firstModel = models.first else {
      return nil
    }

    return firstModel.toDomain()
  }
}
```

**Resultado de prueba**: ✅ 5 pruebas pasando, 76 líneas de código (+85% vs UserDefaults).

**Complejidad**: `Schema`, `container`, `context`, patrón delete-before-insert.

## Paso 6: La Discusión de Abstracción - Cuándo NO Abstraer

Antes de implementar, tuvimos una discusión de diseño.

### La Tentación: Protocolo KeyValueStore

```swift
// Abstracción tentadora
protocol KeyValueStore {
  func data(forKey key: String) -> Data?
  func set(_ value: Data?, forKey key: String)
}

extension UserDefaults: KeyValueStore {}
```

¿Parece buena Inversión de Dependencia, cierto?

La Realización: Abstracción Inútil

**Problema**: Este protocolo solo funciona para `UserDefaults`.

- ❌ FileManager usa URL, no claves
- ❌ SwiftData usa `ModelContext`, no claves
- ❌ CoreData usa `NSManagedObjectContext`, no claves

**¡Esto es una violación del Principio de Segregación de Interfaces!**

Estaríamos creando una abstracción que:

- Solo tiene una implementación real
- No ayuda realmente con las pruebas (podemos inyectar test suite de `UserDefaults`)
- Agrega complejidad sin beneficio

### La Abstracción Correcta Ya Existe

```swift
// Esta es la abstracción real
public protocol PriceStore: Sendable {
  func save(_ quote: PriceQuote) async throws
  func loadCached() async -> PriceQuote?
}
```

**Insight clave**: Abstrae a nivel de dominio, no a nivel de implementación.

- `PriceStore` abstrae "persistencia de precio" (concepto de dominio)
- `KeyValueStore` abstraería "API de UserDefaults" (detalle de implementación)

Cada store concreto usa lo que necesita:

- `UserDefaultsPriceStore` → inyecta `UserDefaults`
- `FileManagerPriceStore` → inyecta `FileManager`
- `SwiftDataPriceStore` → inyecta `ModelContainer`

**Lección**: No cada dependencia necesita un protocolo. Inyecta tipos concretos cuando la abstracción no agrega valor.

## Paso 7: Benchmarking de Rendimiento - Dejar que los Datos Decidan

Teníamos tres implementaciones funcionando. Hora de medir.

### Suite de Pruebas de Benchmark

```swift
@Suite("Performance Comparison")
struct PerformanceComparisonTests {
  let iterations = 100

  @Test func userDefaultsWrite() async throws {
    let start = Date()
    for _ in 0..<iterations {
      try await sut.save(quote)
    }
    let elapsed = Date().timeIntervalSince(start)
    print("UserDefaults: \(iterations) writes in \(String(format: "%.3f", elapsed))s")
  }

  @Test func fileManagerWrite() async throws {
    // Mismo patrón
  }

  @Test func swiftDataWrite() async throws {
    // Mismo patrón
  }
}
```

```bash
Números Reales de Mac M1

  UserDefaults: 100 writes in 0.027s  ⚡ (1.0x baseline)
  FileManager:  100 writes in 0.049s    (1.8x slower)
  SwiftData:    100 writes in 0.072s    (2.7x slower)

UserDefaults es 2.7x más rápido que SwiftData para nuestro caso de uso.
```

## Paso 8: La Matriz de Comparación

| Métrica            | UserDefaults | FileManager         | SwiftData          |
|-------------------|--------------|---------------------|--------------------|
| Líneas de Código     | 41           | 54 (+32%)           | 76 (+85%)          |
| Rendimiento       | 0.027s       | 0.049s              | 0.072s             |
| Velocidad vs baseline | 1.0x         | 1.8x slower         | 2.7x slower        |
| Plataforma Mín      | iOS 13+      | iOS 13+             | iOS 17+            |
| Código de Setup        | 0 líneas      | 0 líneas             | Schema + Container |
| Soporte Decimal   | Nativo ✅     | Nativo ✅            | Workaround ⚠️      |
| Thread-Safety     | Built-in     | Via actor           | Via actor          |
| Debugging         | Difícil    | Fácil (JSON)         | Medio (SQLite)    |
| Formato            | Binary plist | Human-readable JSON | Database           |

## Paso 9: La Decisión - UserDefaults Gana

### Por Qué UserDefaults Ganó

1. ⚡ **Más rápido**: 2.7x más rápido que SwiftData
2. 📦 **Más simple**: 41 LOC vs 76 (SwiftData)
3. 🎯 **Construido con propósito** para almacenamiento clave-valor
4. 🔧 **Cero configuración** - sin schemas, containers
5. 📱 **Amplio alcance**: iOS 13+ vs iOS 17+
6. 💰 **Sin workarounds** - `Decimal` funciona nativamente
7. 🧵 **Thread-safe** por diseño

### Cuándo NO Usar UserDefaults

❌ **No uses** `UserDefaults` si:

- Almacenas >1MB de datos (límite recomendado ~4MB)
- Necesitas consultas/complejos
- Necesitas relaciones entre entidades
- Necesitas datos históricos (solo cacheamos 1 valor)

### Nuestro Caso de Uso = Ajuste Perfecto

✅ **Valor único** (último precio BTC)
✅ **Lecturas frecuentes** (cada lanzamiento de app)
✅ **Escrituras infrecuentes** (cada 1 segundo máx)
✅ **Estructura de datos simple**

**Decisión tomada**: Mantener `UserDefaults`, eliminar implementaciones de `FileManager` y `SwiftData`.

## Paso 10: Pruebas de Robustez - Hacerlo a Prueba de Balas

Después de elegir UserDefaults, agregamos pruebas comprehensivas:

```swift
@Test("save overwrites previous value")
@Test("handles very large Decimal values")  // 999,999,999,999.99999999
@Test("handles very small Decimal values")  // 0.00000001 (satoshi)
@Test("handles edge case timestamps")       // epoch 0
@Test("different keys don't interfere")     // multiple stores
@Test("concurrent reads and writes are safe")  // 10 writes + 10 reads
```

Conteo final de pruebas: 9 pruebas cubriendo todos los casos límite.

Tiempo de ejecución: 0.006 segundos para toda la suite.

## Paso 11: Pruebas de Integración - Conexión del Caso de Uso Real

Validación final: ¿Funciona con casos de uso reales?

```swift
@Test("PersistLastValidPrice with UserDefaults end-to-end")
func persistAndRetrieveWithRealStorage() async throws {
  let suiteName = "integration.test.\(UUID().uuidString)"
  let defaults = UserDefaults(suiteName: suiteName)!
  defer { defaults.removePersistentDomain(forName: suiteName) }

  // Store real
  let store = UserDefaultsPriceStore(userDefaults: defaults)

  // Caso de uso real
  let sut = PersistLastValidPrice(store: store)

  let quote = PriceQuote(value: 68_901.23, currency: "USD", timestamp: Date())

  // Guardar vía caso de uso
  try await sut.execute(quote)

  // Cargar vía caso de uso
  let cached = await sut.loadCached()

  #expect(cached == quote)
}
```

✅ La prueba de integración pasa: Caso de uso + storage real funcionan juntos.

## Desafíos Reales de Desarrollo que Resolvimos

### Desafío 1: "SwiftData Pierde Silenciosamente Precisión Financiera"

**Problema**: `Decimal(68901.23)` se convirtió en `68901.22999999998976` en la base de datos.

**Causa raíz**: SwiftData convierte `Decimal` → `Double` → `SQLite`.

**Solución**: Almacenar como `String`, convertir de vuelta a `Decimal`.

**Lección**: Siempre prueba con valores financieros realistas. Pruebas unitarias con 100.00 no detectarían esto.

### Desafío 2: "Concurrencia de Swift 6 Rompió la Inyección de UserDefaults"

**Problema**: `UserDefaults` no es `Sendable`, no se puede pasar a actor.

**Solución**:

```swift
extension UserDefaults: @unchecked @retroactive Sendable {}
```

**Lección**: Swift 6 de concurrencia estricta requiere declaraciones explícitas de confianza para APIs legacy.

### Desafío 3: "La Abstracción No Siempre Es Mejor"

**Problema**: Tentación de crear protocolo `KeyValueStore`.

**Realidad**: Solo útil para `UserDefaults`, no para `FileManager`/`SwiftData`.

**Solución**: Inyecta tipos concretos, abstrae a nivel de dominio (`PriceStore`).

**Lección**: Sigue YAGNI (You Aren't Gonna Need It). No abstraigas prematuramente.

### Desafío 4: "Las Suposiciones No Escalan"

**Problema**: "SwiftData es moderno, debe ser mejor."

**Realidad**: 2.7x más lento, 85% más código, solo iOS 17+.

**Solución**: Haz benchmark antes de decidir.

**Lección**: Mide, no adivines. La simplicidad a menudo vence a la sofisticación.

## Insights de Arquitectura

### Ganancia de Clean Architecture

El enfoque orientado al dominio habilitó toda esta evaluación:

1. Capa de dominio definió protocolo PriceStore (hace meses)
2. Caso de uso usó PriceStore (nunca cambió)
3. Infraestructura compitió con 3 implementaciones
4. Pruebas validaron las tres contra el mismo contrato
5. Decisión basada en datos, no opiniones

**Insight clave**: Buena arquitectura te permite intercambiar implementaciones sin tocar lógica de negocio.

### Dirección de Dependencia Mantenida

```bash
BTCPricePersistence (Infraestructura)
  ↓ imports
BTCPriceCore (Dominio + Casos de Uso)
```

**Nunca al revés.**

- Los casos de uso no saben sobre `UserDefaults`
- Las entidades de dominio no saben sobre encoding JSON
- Las pruebas pueden inyectar cualquier implementación de `PriceStore`

**Ganancia de Clean Architecture**: Los detalles de infraestructura son conectables.

### Patrones Modernos de Swift Aplicados

- **Actor**: Operaciones de almacenamiento thread-safe
- **@retroactive**: Conformidades forward-compatible (Swift 6)
- **async/await**: Todas las operaciones son async-first
- **Concurrencia estructurada**: Manejo adecuado del tiempo de vida de Task

## Decisiones Clave de Diseño que Tomamos

1. **¿Por Qué Evaluar los Tres?**

   - **Alternativa**: Elegir basándose en familiaridad
   - **Decisión**: Implementar los tres con pruebas
   - **Razón**: Decisiones basadas en datos vencen suposiciones
   - **Resultado**: Descubrimos el bug de `Decimal` de `SwiftData` que nunca habríamos encontrado.

2. **¿Por Qué Mantener UserDefaults?**

   - **Alternativa**: Usar `SwiftData` "moderno"
   - **Decisión**: Solución más simple y rápida
   - **Razón**: YAGNI - no sobre-ingeniar
   - **Resultado**: 41 LOC vs 76, 2.7x más rápido, mayor soporte de plataforma.

3. **¿Por Qué No Abstraer KeyValueStore?**

   - **Alternativa**: Protocol para API de `UserDefaults`
   - **Decisión**: Inyectar `UserDefaults` concreto
   - **Razón**: La abstracción no ayudaría a `FileManager`/`SwiftData`
   - **Resultado**: Menos código, intención más clara.

4. **¿Por Qué Probar Casos Límite Decimal?**

   - **Alternativa**: Confiar en frameworks
   - **Decisión**: Probar con valores financieros realistas
   - **Razón**: La precisión del dinero importa
   - **Resultado**: Capturamos el bug de `SwiftData` antes de producción.

## Resultados Listos para Producción

Nuestra capa de persistencia ahora puede:

- ✅ Cachear el último precio BTC válido con precisión de nanosegundos
- ✅ Manejar corrupción gracefully (retorna nil, no falla)
- ✅ Soportar lecturas/escrituras concurrentes de forma segura
- ✅ Preservar precisión Decimal para datos financieros
- ✅ Funcionar en dispositivos iOS 13+
- ✅ Ejecutar 100 saves en 27ms

Todo modular. Todo probado. Todo con benchmark.

Organización del código:

```bash
BTCPricePersistence/
├── Sources/BTCPricePersistence/
│   ├── UserDefaultsPriceStore.swift      (41 LOC)
│   └── UserDefaults+Sendable.swift       (Extension)
└── Tests/BTCPricePersistenceTests/
  ├── UserDefaultsPriceStoreTests.swift (9 tests)
  └── PersistenceIntegrationTests.swift (1 test)

Métricas de prueba:
✔ Ejecución con 10 pruebas en 2 suites pasó después de 0.014 segundos
```

## Lo que Aprendimos

1. **El Benchmarking Revela la Verdad**

   Todas nuestras opiniones estuvieron equivocadas:

   - "SwiftData es moderno, debe ser mejor" → 2.7x más lento
   - "FileManager da más control" → Más código, mismo resultado
   - "UserDefaults es demasiado simple" → Perfecto para este caso de uso

   **Lección**: Mide antes de comprometerte.

2. **La Precisión Financiera No Es Automática**

   La conversión `Decimal` → `Double` de SwiftData habría perdido dinero en producción.

   **Lección**: Prueba con valores de dominio realistas. 100.00 se ve bien, 68901.23 expone bugs.

3. **La Abstracción Tiene un Costo**

   El protocolo `KeyValueStore` parecía "limpio" pero:

   - Solo funcionaba para `UserDefaults`
   - Agregó complejidad
   - No mejoró la testeabilidad

   **Lección**: Abstrae en los límites del dominio, no en detalles de implementación.

4. **TDD Habilita Comparación Sin Miedo**

   Evaluamos confiadamente tres enfoques porque:

   - Las pruebas definieron el contrato
   - Los tres tuvieron que pasar las mismas pruebas
   - El refactoring era seguro

   **Lección**: TDD hace que los experimentos arquitectónicos sean de bajo riesgo.

5. **La Concurrencia de Swift 6 Requiere Confianza Explícita**

   `@unchecked @retroactive Sendable` parece aterrador pero:

   - `UserDefaults` ES thread-safe (documentado por Apple)
   - No controlamos Foundation
   - Explícito es mejor que implícito

   **Lección**: A veces tienes que confiar en garantías de plataforma.

## Conclusión

Empezamos con una pregunta simple: "¿Dónde debemos cachear un `PriceQuote`?"

Tres implementaciones después, descubrimos:

1. SwiftData pierde precisión `Decimal` - requiere workaround con `String`
2. `UserDefaults` es 2.7x más rápido que SwiftData para almacenamiento de valor único
3. La abstracción innecesaria agrega complejidad - inyecta tipos concretos cuando tiene sentido
4. La concurrencia estricta de Swift 6 captura problemas reales, pero confiar en Apple a veces es necesario

El ganador: `UserDefaults`

- 41 líneas de código (vs 76 para SwiftData)
- 0.027s para 100 writes (vs 0.072s)
- Soporte iOS 13+ (vs iOS 17+)
- Precisión Decimal nativa (vs workaround)

Todo listo para producción. Todo con benchmark. Todo test-driven.

El viaje no era sobre probar que SwiftData es malo o que FileManager es inferior. Era sobre hacer coincidir la solución con el problema.

Para almacenamiento clave-valor de valor único, UserDefaults está construido con propósito. Para datos relacionales complejos, SwiftData brilla.
La arquitectura no es sobre usar el framework más nuevo - es sobre usar la herramienta correcta.

Nuestra app BTC/USD ahora tiene:

- ✅ Networking robusto (Binance + CryptoCompare)
- ✅ Persistencia confiable (UserDefaults con 10 pruebas)
- ✅ Arquitectura limpia (dominio independiente de infraestructura)

Próximo: juntar todo.

## ¿Qué Sigue?

En el siguiente artículo conectaremos todo con ViewModels y construiremos las apps reales:

- Composition Root → cablear dependencias reales (AppDependencies)
- ViewModels → conectar casos de uso a SwiftUI (@Observable)
- SwiftUI App → actualizaciones de precio en tiempo real con soporte offline
- CLI Tool → app terminal para desarrolladores
- Manejo de errores → degradación graceful cuando falla red/cache

La fundación está completa. El networking funciona. La persistencia funciona. Hora de construir la experiencia de usuario 🚀.

## Nota sobre Implementaciones Eliminadas

Las implementaciones de FileManager y SwiftData fueron completamente prototipadas durante la evaluación
pero eliminadas después de que el benchmarking reveló a UserDefaults como el claro ganador. El código de comparación existe en el historial de git
para referencia y aprendizaje. Construir (y eliminar) código es parte de una buena arquitectura.
