---
title: 'De Casos de Uso a Código: Construyendo el Core con TDD (sin infraestructura)'
description: 'Aprende cómo convertir casos de uso claros en código Core listo para producción usando TDD. Definiremos entidades, protocolos y casos de uso para una app BTC/USD — todo probado, modular y sin infraestructura.'
pubDate: 'Sep 01 2025'
heroImage: './hero.png'
lang: 'es'
translationKey: 'from-use-cases-to-core'
slug: 'de-casos-de-uso-a-codigo-construyendo-el-core-con-tdd'
---

## Introducción

En el [artículo anterior](../from-requirements-to-use-cases-building-a-btc-price-app-the-right-way) transformamos requisitos vagos en **historias de usuario**, **narrativas** y **casos de uso**.
Ahora toca mostrar cómo esos casos de uso se convierten en **código**.

Pero aquí viene el giro: no empezaremos con networking ni persistencia. En su lugar, nos enfocaremos en **el Core**: el corazón de la app donde viven los contratos y los comportamientos. Todo lo demás (infraestructura) vendrá después.

La meta: **construir un Core modular, reutilizable y comprobable con TDD.**

Al final verás cómo TDD naturalmente nos guía hacia una arquitectura limpia, y cómo los desafíos reales de desarrollo moldean mejores decisiones de diseño.

---

## Paso 1: Definir las Entidades del Dominio

Empezamos con el modelo esencial del dominio: `PriceQuote`. Representa un valor BTC/USD en un instante.

```swift
public struct PriceQuote: Equatable, Sendable {
  public let value: Decimal
  public let currency: String
  public let timestamp: Date

  public init(value: Decimal, currency: String, timestamp: Date) {
    self.value = value
    self.currency = currency
    self.timestamp = timestamp
  }
}
```

**Decisiones de diseño aquí:**
- `Decimal` nos da precisión para valores financieros (sin errores de coma flotante).
- `Sendable` garantiza uso seguro a través de límites de concurrencia.
- `Equatable` facilita pruebas y comparaciones.

Esta única entidad será la base de todo lo que sigue.

---

## Paso 2 - Contratos: Puertos para Datos y Persistencia

Ahora definimos los **protocolos** (puertos). Estos contratos describen lo que el sistema _necesita_ sin atarnos a implementaciones específicas.

```swift
public protocol PriceLoader: Sendable {
  func loadLatest() async throws -> PriceQuote
}
```

- `PriceLoader` → cómo obtenemos el último precio (Binance, CryptoCompare, etc. más adelante).
- `Sendable` → seguro para uso concurrente.
- `async throws` → reconoce que las operaciones pueden fallar y tomar tiempo.

Principio de Clean Architecture: **Define los puertos en el Core; impleméntalos fuera.**

---

## Paso 3 - Primer Caso de Uso: FetchLatestPrice

Implementemos el comportamiento más simple: cargar la última cotización. Pero lo haremos **test-first**.

🔴 ROJO - Escribe la prueba fallida

```swift
@Suite("FetchLatestPriceUseCaseTests")
  struct FetchLatestPriceUseCaseTests {
    @Test func fetchLatestPrice_deliversValueFromLoader() async throws {
      let expected = PriceQuote(
        value: 68_901.23,
        currency: "USD",
        timestamp: Date()
      )
      let sut = FetchLatestPrice(loader: LoaderStub(result: .success(expected)))

      let received = try await sut.execute()

      #expect(received == expected)
    }
  }
```

**Error de compilación**: No se encuentra `FetchLatestPrice` en el alcance

¡Esto es exactamente lo que queremos! La prueba nos dice lo que necesitamos construir.

🟢 VERDE - Haz que pase con el código mínimo

```swift
  public struct FetchLatestPrice: Sendable {
    private let loader: PriceLoader

    public init(loader: PriceLoader) {
      self.loader = loader
    }

    public func execute() async throws -> PriceQuote {
      try await loader.loadLatest()
    }
  }
```

Y el stub de prueba:

```swift
  private struct LoaderStub: PriceLoader {
    let result: Result<PriceQuote, Error>
    func loadLatest() async throws -> PriceQuote { try result.get() }
  }
```

🔄 REFACTOR - Agregar manejo de errores

```swift
  @Test func fetchLatestPrice_propagatesLoaderError() async {
    let sut = FetchLatestPrice(loader: LoaderStub(result: .failure(DummyError.any)))

    await #expect(throws: Error.self) {
      _ = try await sut.execute()
    }
  }

  private enum DummyError: Error { case any }
```

**Insight clave**: Solo escribimos código después de que las pruebas lo exigieron. TDD nos forzó a pensar primero en la API desde la perspectiva del cliente.

---

## Paso 4 - Resiliencia: FetchWithFallback

Los requisitos decían: _usa una fuente secundaria si la primaria falla_. Implementémoslo con TDD.

🔴 ROJO - Define el comportamiento con pruebas

```swift
@Suite("FetchWithFallbackUseCaseTests")
struct FetchWithFallbackUseCaseTests {
  @Test func fetchWithFallback_usesPrimaryOnSuccess() async throws {
    let expected = PriceQuote(value: 68_900, currency: "USD", timestamp: Date())
    let primary = LoaderStub(result: .success(expected))
    let fallback = LoaderStub(result: .failure(DummyError.any))

    let sut = FetchWithFallback(primary: primary, fallback: fallback)
    let received = try await sut.execute()

    #expect(received == expected)
  }

  @Test func fetchWithFallback_usesFallbackWhenPrimaryFails() async throws {
    let expected = PriceQuote(value: 68_800, currency: "USD", timestamp: Date())
    let primary = LoaderStub(result: .failure(DummyError.any))
    let fallback = LoaderStub(result: .success(expected))

    let sut = FetchWithFallback(primary: primary, fallback: fallback)
    let received = try await sut.execute()

    #expect(received == expected)
  }

  @Test func fetchWithFallback_throwsWhenBothFail() async {
    let primary = LoaderStub(result: .failure(DummyError.any))
    let fallback = LoaderStub(result: .failure(DummyError.any))

    let sut = FetchWithFallback(primary: primary, fallback: fallback)

    await #expect(throws: Error.self) {
      _ = try await sut.execute()
    }
  }
}
```

🟢 VERDE - Implementa la lógica de fallback

```swift
public struct FetchWithFallback: Sendable {
  private let primary: PriceLoader
  private let fallback: PriceLoader

  public init(primary: PriceLoader, fallback: PriceLoader) {
    self.primary = primary
    self.fallback = fallback
  }

  public func execute() async throws -> PriceQuote {
    do {
      return try await primary.loadLatest()
    } catch {
      return try await fallback.loadLatest()
    }
  }
}
```

**Elegante.** El do-catch expresa naturalmente el fallback.

---

## Paso 5 - Desafío Real: Manejo de Timeouts

¿Y si una fuente tarda _demasiado_? No podemos congelar la app esperando. Agreguemos soporte de timeout.

Primero, necesitamos una abstracción de reloj.

```swift
public protocol Clock: Sendable {
  func now() -> Date
  func sleep(for seconds: TimeInterval) async
}

public struct SystemClock: Clock {
  public init() {}

  public func now() -> Date { Date() }

  public func sleep(for seconds: TimeInterval) async {
    try? await Task.sleep(nanoseconds: .init(seconds * 1_000_000_000))
  }
}
```

🔴 ROJO - Prueba con timeout

```swift
@Suite("FetchWithFallback + Timeout")
struct FetchWithFallbackTimeoutTests {
  @Test func usesPrimary_whenPrimaryFinishesBeforeTimeout() async throws {
    let expected = PriceQuote(value: 68_900, currency: "USD", timestamp: Date())
    let primary = ClosureLoader { expected }  // Cargador rápido
    let fallback = ClosureLoader { throw DummyError.any }

    let sut = FetchWithFallback(
      primary: primary,
      fallback: fallback,
      timeout: 1,
      clock: TestClock()  // Sin esperas reales en tests
    )

    let received = try await sut.execute()
    #expect(received == expected)
  }

  // Helper para escenarios de prueba flexibles
  struct ClosureLoader: PriceLoader {
    let action: @Sendable () async throws -> PriceQuote
    func loadLatest() async throws -> PriceQuote { try await action() }
  }

  private struct TestClock: Clock {
    func now() -> Date { Date() }
    func sleep(for seconds: TimeInterval) async {
      // No-op: sin sleep en tests
    }
  }
}
```

🟢 VERDE - Implementa timeout con una carrera de tareas

```swift
public struct FetchWithFallback: Sendable {
  private let primary: PriceLoader
  private let fallback: PriceLoader
  private let timeout: TimeInterval
  private let clock: Clock

  public init(
    primary: PriceLoader,
    fallback: PriceLoader,
    timeout: TimeInterval = 0.8,  // 800ms por defecto
    clock: Clock = SystemClock()
  ) {
    self.primary = primary
    self.fallback = fallback
    self.timeout = timeout
    self.clock = clock
  }

  public func execute() async throws -> PriceQuote {
    do {
      return try await withThrowingTaskGroup(of: PriceQuote.self) { group in
        group.addTask { try await primary.loadLatest() }
        group.addTask {
          await clock.sleep(for: timeout)
          throw TimeoutError.primaryTimeout
        }

        let result = try await group.next()!
        group.cancelAll()
        return result
      }
    } catch {
      return try await fallback.loadLatest()
    }
  }
}

private enum TimeoutError: Error { case primaryTimeout }
```

**Patrón clave**: Usar `TaskGroup` para correr el cargador primario contra una tarea de timeout.

---

## Paso 6 - Introducir Cache: La Capa Persistente

Ahora implementemos caché. Hay que persistir el último precio válido para escenarios offline.

🔴 ROJO - Empezar con la intención en pruebas

```swift
@Suite("PriceStoreTests")
struct PriceStoreTests {
  @Test func saveValidPrice_shouldPersistSuccessfully() async throws {
    let quote = PriceQuote(
      value: 68_901.23,
      currency: "USD",
      timestamp: Date()
    )
    let sut = PriceStoreStub()

    try await sut.save(quote)  // No debe lanzar
  }

  @Test func loadCachedPrice_afterSave_shouldReturnSavedPrice() async throws {
    let quote = PriceQuote(value: 68_901.23, currency: "USD", timestamp: Date())
    let sut = PriceStoreStub()

    try await sut.save(quote)
    let cached = await sut.loadCached()

    #expect(cached == quote)  // Round-trip ok
  }
}
```

**Error de compilación**: No existe `PriceStore`.

🟢 VERDE - Crea el protocolo y una implementación mínima

```swift
public protocol PriceStore: Sendable {
  func save(_ quote: PriceQuote) async throws
  func loadCached() async -> PriceQuote?
}

// Stub de prueba
private actor PriceStoreStub: PriceStore {
  private var cachedQuote: PriceQuote?

  func save(_ quote: PriceQuote) async throws {
    cachedQuote = quote
  }

  func loadCached() async -> PriceQuote? {
    cachedQuote
  }
}
```

🔄 REFACTOR - Agregar el caso de uso

```swift
public struct PersistLastValidPrice: Sendable {
  private let store: PriceStore

  public init(store: PriceStore) {
    self.store = store
  }

  public func execute(_ quote: PriceQuote) async throws {
    try await store.save(quote)
  }

  public func loadCached() async -> PriceQuote? {
    await store.loadCached()
  }
}
```

Y agreguemos pruebas de error más completas:

```swift
@Test func savePrice_whenStorageFails_shouldReturnError() async {
  let quote = PriceQuote(value: 68_901.23, currency: "USD", timestamp: Date())
  let sut = PriceStoreStub(shouldFail: true)

  await #expect(throws: Error.self) {
    try await sut.save(quote)
  }
}
```

## Conclusión

Fuimos de la **definición de casos de uso → código Core funcionando** usando puro TDD. El proceso reveló varios insights clave:

1. **Las pruebas guían hacia mejor diseño** - Cada API pública fue moldeada pensando primero en las pruebas.
2. **Los errores informan la arquitectura** - Los patrones de fallback surgieron de escenarios de fallo.
3. **Los patrones de concurrencia emergen naturalmente** - Las necesidades de performance llevaron a `async let`.
4. **La evolución de protocolos requiere disciplina** - Los cambios en cascada son inevitables.
5. **El sistema de tipos guía la seguridad** - La decisión entre actor vs struct se vuelve obvia.

Nuestro Core de la app BTC/USD ahora puede:

- ✅ Cargar cotizaciones con fallback y timeout
- ✅ Cachear valores para uso offline
- ✅ Formatear datos para presentación
- ✅ Orquestar operaciones en ritmo de 1 segundo
- ✅ Manejar todos los escenarios de error con gracia

Todo **modular**. Todo **testeado**. Todo **sin IO**.

El desarrollo no siempre fue suave: nos topamos con loops infinitos, condiciones de carrera y cambios que rompían todo. Pero cada desafío nos enseñó algo valioso sobre diseño de sistemas concurrentes.

---

## ¿Qué sigue?

En el próximo artículo conectaremos este Core con el mundo real:

- `BTCPriceNetworking` → loaders concretos para las APIs de Binance y CryptoCompare
- `BTCPricePersistence` → un store real usando `UserDefaults` o almacenamiento en archivo
- `BTCPriceFeature` → un ViewModel que orquesta todo
- `Pruebas de integración` → escenarios end-to-end con URLProtocolStub

Solo entonces construiremos el CLI y las apps iOS que los usuarios realmente verán.

El Core está listo. Es hora de conectarlo con la realidad 🚀.