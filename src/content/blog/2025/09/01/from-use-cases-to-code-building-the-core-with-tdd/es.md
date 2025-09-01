---
title: 'De Casos de Uso a Código: Construyendo el Core con TDD (sin infraestructura)'
description: 'Aprende a transformar casos de uso claros en código listo para producción usando TDD. Definiremos entidades, protocolos y casos de uso para una app de BTC/USD — todo probado, modular y sin depender aún de infraestructura.'
pubDate: 'Sep 01 2025'
heroImage: './hero.png'
lang: 'es'
translationKey: 'from-use-cases-to-core'
slug: 'de-casos-de-uso-a-codigo-construyendo-el-core-con-tdd'
---

## Introducción

En el [artículo anterior](../desde-requerimientos-hasta-casos-de-uso-construyendo-una-aplicacion-para-precio-de-btc-de-la-forma-correcta) transformamos requerimientos vagos en **historias de usuario**, **narrativas** y **casos de uso**.  
Ahora toca mostrar cómo esos casos de uso se convierten en **código real**.

Pero aquí está lo interesante: no vamos a empezar con red ni con persistencia. Primero vamos a enfocarnos en **el Core** — el corazón de la app, donde viven los contratos y comportamientos. Lo demás (infraestructura) vendrá después.

La meta: **construir un Core modular, reutilizable y 100% testeable con TDD.**

---

## Paso 1 - Definiendo las Entidades del Dominio

Arrancamos con el modelo esencial: `PriceQuote`.  
Representa el precio BTC/USD en un instante de tiempo.

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

- `Decimal` nos da precisión para valores financieros.
- `Sendable` garantiza seguridad en concurrencia.

⸻

## Paso 2 - Contratos: Puertos para Datos y Persistencia

Lo que sigue es definir los **protocolos** (puertos).
Estos contratos describen lo que el sistema necesita sin amarrarse todavía a implementaciones específicas.

```swift
public protocol PriceLoader: Sendable {
  func loadLatest() async throws -> PriceQuote
}

public protocol PriceStore: Sendable {
  func save(_ quote: PriceQuote) async throws
  func load() async throws -> PriceQuote?
}
```

- `PriceLoader` → cómo obtenemos el precio más reciente (después usaremos Binance, CryptoCompare, etc.).
- `PriceStore` → cómo guardamos en caché el último valor conocido.

Principio de Clean Architecture: **Define los puertos en el Core, impleméntalos en otro lado**.

⸻

## Paso 3 - Primer Caso de Uso: FetchLatestPrice

El comportamiento más simple: obtener la última cotización.

### Primero la Prueba

```swift
@Suite("FetchLatestPriceUseCaseTests")
struct FetchLatestPriceUseCaseTests {
  @Test func fetchLatestPrice_deliversValueFromLoader() async throws {
    let expected = PriceQuote(value: 68_901.23, currency: "USD", timestamp: Date())
    let sut = FetchLatestPrice(loader: LoaderStub(result: .success(expected)))
    let received = try await sut.execute()
    #expect(received == expected)
  }

  @Test
  func fetchLatestPrice_propagatesLoaderError() async {
    let sut = FetchLatestPrice(loader: LoaderStub(result: .failure(DummyError.any)))
    await #expect(throws: Error.self) {
      _ = try await sut.execute()
    }
  }
}
```

Arrancamos con la ruta feliz y la ruta de error.
Estas pruebas nos obligan a definir el caso de uso `FetchLatestPrice` y un `LoaderStub`.

### Implementación

El caso de uso es trivial: delega al loader.
Lo importante: **solo lo escribimos después de que la prueba lo pidió**.

⸻

### Paso 4 - Agregando Resiliencia: FetchWithFallback

El requerimiento decía: _usar una fuente secundaria si la primaria falla_.
Así que primero escribimos las pruebas:

```swift
@Suite("FetchWithFallbackUseCaseTests")
struct FetchWithFallbackUseCaseTests {
  @Test
  func fetchWithFallback_usesPrimaryOnSuccess() async throws { ... }

  @Test
  func fetchWithFallback_usesFallbackWhenPrimaryFails() async throws { ... }

  @Test
  func fetchWithFallback_throwsWhenBothFail() async throws { ... }
}
```

De estas pruebas nace la implementación de `FetchWithFallback`.
Otra vez: primero la especificación, luego el código.

⸻

## Paso 5 - Manejo de Timeouts

¿Y si una fuente tarda _demasiado_?
No podemos quedarnos colgados esperando. Aquí metemos un timeout.

### Prueba con un Reloj Falso

```swift
@Suite("FetchWithFallback + Timeout")
struct Test {
  @Test
  func usesPrimary_whenPrimaryFinishesBeforeTimeout() async throws { ... }

  private struct TestClock: Clock {
    func now() -> Date { Date() }
    func sleep(for seconds: TimeInterval) async { /* no-op */ }
  }
}
```

La prueba usa un `TestClock` que nunca duerme realmente.
Así simulamos "timeouts" de manera instantánea y mantenemos las pruebas rápidas.

La implementación corre una carrera entre el loader primario y una tarea de timeout.
Si gana el timeout, usamos el fallback.

⸻

## Paso 6 - Introduciendo Caché: Casos de Uso de PriceStore

El siguiente paso es definir el comportamiento de caché.
El protocolo `PriceStore` ya existe, así que agregamos dos casos de uso sencillos: `SavePriceToStore` y `LoadPriceFromStore`.

### Pruebas

```swift
@Suite("PriceStore UseCases")
struct PriceStoreUseCasesTests {
  @Test
  func saveThenLoad_returnsTheSameQuote() async throws { ... }

  @Test
  func load_onEmptyStore_returnsNil() async throws { ... }

  @Test
  func save_overwritesPreviousValue() async throws { ... }
}
```

Las pruebas usan un **InMemoryPriceStore fake**:

```swift
private struct InMemoryPriceStore: PriceStore {
  private var box = Box()
  func save(_ quote: PriceQuote) async throws { box.value = quote }
  func load() async throws -> PriceQuote? { box.value }
  private final class Box: @unchecked Sendable { var value: PriceQuote? }
}
```

Este fake valida el contrato sin necesidad de tocar disco o bases de datos.

⸻

## Paso 7 - Core en Verde: Todas las Pruebas Pasando

A este punto todas nuestras pruebas de Core están ✅ verdes.
Ahora tenemos:

- **Entidades**: `PriceQuote`
- **Protocolos**: `PriceLoader`, `PriceStore`
- **Casos de Uso**
  - `FetchLatestPrice`
  - `FetchWithFallback` (+ timeout)
  - `SavePriceToStore` / `LoadPriceFromStore`

Todos los comportamientos están definidos y probados.
Y aún no escribimos ni una línea de red o persistencia.

Ese es el poder de **guiar el código desde los casos de uso**.

⸻

## Conclusión

En este artículo pasamos de **definiciones de casos de uso → código real del Core**.
Practicamos TDD: escribe una prueba, vela fallar, implementa lo mínimo, vela pasar.
Y aplicamos Clean Architecture: el Core define los contratos y la infraestructura se conecta después.

Hasta ahora, nuestra app de BTC/USD puede:

- Obtener una cotización de un loader.
- Usar un fallback si el primario falla.
- Enforzar un timeout.
- Guardar y cargar valores en caché.

Todo modular. Todo probado. Todo sin IO.

⸻

## ¿Qué Sigue?

En el próximo artículo conectaremos el Core con el mundo real:

- **BTCPriceNetworking** → loaders para Binance y CryptoCompare.
- **BTCPricePersistence** → un store concreto usando `UserDefaults` o archivos.
- **BTCPriceFeature** → un ViewModel con un ticker de 1 segundo que guarda en caché cuando hay éxito y carga de caché cuando falla.

Y después construiremos la app CLI y la app iOS que mostrarán la info en pantalla.
¡Nos leemos pronto 🚀!
