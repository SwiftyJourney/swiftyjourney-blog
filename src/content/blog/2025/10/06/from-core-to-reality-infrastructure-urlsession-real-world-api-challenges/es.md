---
title: 'Del Core a la Realidad: Infraestructura, URLSession y Desafíos de APIs del Mundo Real'
description: 'Construyendo la capa de networking con TDD: Cuando los modelos de dominio perfectos se encuentran con APIs desordenadas del mundo real. Un viaje a través del parsing JSON, mapeo de errores y patrones de Swift Concurrency.'
pubDate: 'Oct 06 2025'
heroImage: './hero.png'
lang: 'es'
translationKey: 'from-core-to-infrastructure'
slug: 'del-core-a-la-realidad-infraestructura-urlsession-desafios-apis-mundo-real'
---

## Introducción

En el [artículo anterior](../from-use-cases-to-code-building-the-core-with-tdd) construimos un Core sólido con casos de uso, entidades y protocolos usando TDD. Teníamos contratos de `PriceLoader` y lógica de dominio, pero todo eran abstracciones puras.

Ahora viene la prueba de realidad: **conectar nuestro hermoso Core a APIs reales**.

El desafío: Binance devuelve `"price": "68901.23000000"` (String), mientras que CryptoCompare devuelve `"PRICE": 68910.12` (Number). Diferentes formatos, diferentes escenarios de error, y necesitamos mantener nuestros principios de Clean Architecture.

El objetivo: **Construir una capa de networking lista para producción que adapte APIs reales a nuestros contratos de dominio**.

Al final de este artículo, verás cómo los desafíos de infraestructura del mundo real impulsan mejores decisiones arquitectónicas, y cómo TDD detecta bugs que podrían afectar la producción.

---

## Paso 1: Separación de Módulos y Dependencias

Primera decisión: módulo separado para las preocupaciones de networking.

```bash
btc-price/
├── BTCPriceCore/          # Capa de dominio (terminada)
└── BTCPriceNetworking/    # Capa de infraestructura (nueva)
```

¿Por qué módulos separados?

- **Límites claros**: La infraestructura no puede contaminar el dominio
- **Pruebas independientes**: Las pruebas de red no necesitan complejidad del dominio
- **Intercambiable**: Podríamos reemplazar con un enfoque de networking diferente después

### Dependencias Package.swift

```swift
let package = Package(
    name: "BTCPriceNetworking",
    dependencies: [
      .package(path: "../BTCPriceCore"),  // ← Contratos de dominio
    ],
    targets: [
      .target(name: "BTCPriceNetworking", dependencies: ["BTCPriceCore"])
    ]
)
```

**Insight clave**: La infraestructura depende del dominio, nunca al revés.

---

## Paso 2: Abstracción de URLSession con TDD

### 🔴 ROJO - La prueba fallida impulsa el diseño

```swift
@Suite("BinancePriceLoaderTests")
struct BinancePriceLoaderTests {
    @Test func loadLatest_withValidBinanceResponse_deliversPriceQuote() async throws {
        let jsonData = """
        {
            "symbol": "BTCUSDT",
            "price": "68901.23000000"
        }
        """.data(using: .utf8)!
        
        let session = URLSessionStub(data: jsonData, response: httpResponse(200))
        let sut = BinancePriceLoader(session: session)
        
        let quote = try await sut.loadLatest()
        
        #expect(quote.value == Decimal(string: "68901.23")!)
        #expect(quote.currency == "USD")
    }
}
```

Errores de compilación: `BinancePriceLoader` no existe, `URLSessionStub` no existe.

**Beneficio de TDD**: La prueba nos dice exactamente qué necesitamos construir.

### 🟢 VERDE - Abstracción del protocolo URLSession

```swift
public protocol URLSessionProtocol: Sendable {
  func data(for request: URLRequest) async throws -> (Data, URLResponse)
}

extension URLSession: URLSessionProtocol {}
```

**¿Por qué el protocolo?**

- **Testabilidad**: Podemos inyectar stubs para pruebas
- **Clean Architecture**: Abstraer detalles del framework
- **Cumplimiento Sendable**: Seguro para acceso concurrente

---

## Paso 3: Primer Adaptador de API - Implementación de Binance

### 🟢 VERDE - BinancePriceLoader mínimo

```swift
public struct BinancePriceLoader: PriceLoader {
  private let session: URLSessionProtocol

  public func loadLatest() async throws -> PriceQuote {
    let url = URL(string: "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")!
    let request = URLRequest(url: url)

    let (data, response) = try await session.data(for: request)

    // Validación de estado HTTP
    guard let httpResponse = response as? HTTPURLResponse,
          200...299 ~= httpResponse.statusCode else {
      throw PriceLoadingError.networkFailure
    }

    do {
      let response = try JSONDecoder().decode(BinanceResponse.self, from: data)

      guard let price = Decimal(string: response.price) else {
        throw PriceLoadingError.invalidPrice
      }

      return PriceQuote(value: price, currency: "USD", timestamp: Date())

    } catch is DecodingError {
      throw PriceLoadingError.invalidData
    }
  }
}

private struct BinanceResponse: Codable {
  let symbol: String
  let price: String  // ← Nota: String, no Number
}
```

**Patrones clave:**

- **Mapeo de errores de dominio**: `DecodingError` → `PriceLoadingError.invalidData`
- **Validación de estado HTTP**: No confíes en que 200 es el único éxito
- **Parsing Decimal**: Precisión financiera sobre Double

### 🔄 REFACTOR - Pruebas comprehensivas de errores

```swift
@Test func loadLatest_withInvalidJSON_throwsInvalidDataError() async throws {
  let invalidJSON = "{ invalid json }".data(using: .utf8)!
  let session = URLSessionStub(data: invalidJSON, response: httpResponse(200))
  let sut = BinancePriceLoader(session: session)

  await #expect(throws: PriceLoadingError.invalidData) {
    _ = try await sut.loadLatest()
  }
}

@Test func loadLatest_withHTTPError_throwsNetworkFailure() async throws {
  let session = URLSessionStub(data: Data(), response: httpResponse(500))
  let sut = BinancePriceLoader(session: session)

  await #expect(throws: PriceLoadingError.networkFailure) {
    _ = try await sut.loadLatest()
  }
}
```

**Resultado**: 5 pruebas cubriendo camino feliz, datos diferentes, errores JSON, errores HTTP.

---

## Paso 4: API Diferente, Desafíos Diferentes - CryptoCompare

Mismo enfoque TDD, pero una estructura JSON diferente revela nuevos desafíos:

### 🔴 ROJO - Formato JSON diferente

```swift
@Test func loadLatest_withValidCryptoCompareResponse_deliversPriceQuote() async throws {
  let jsonData = """
  {
    "RAW": {
      "PRICE": 68910.12,          // ← ¡Number, no String!
      "FROMSYMBOL": "BTC",
      "TOSYMBOL": "USD"
    }
  }
  """.data(using: .utf8)!

  // ... resto de la prueba
}
```

### Desafío 1: Estructura JSON Compleja

```swift
private struct CryptoCompareResponse: Codable {
  let raw: RAWData

  struct RAWData: Codable {
    let price: Double           // ← Double de la API
    let fromSymbol: String
    let toSymbol: String

    enum CodingKeys: String, CodingKey {
      case price = "PRICE"      // ← Mayúsculas en la API
      case fromSymbol = "FROMSYMBOL"
      case toSymbol = "TOSYMBOL"
    }
  }

  enum CodingKeys: String, CodingKey {
    case raw = "RAW"
  }
}
```

### Desafío 2: Bug de Precisión de Punto Flotante Descubierto

La falla de la prueba reveló un bug real:

- **Esperado**: `75500.99`
- **Actual**: `75500.990000000001024`

**Causa raíz**: `Decimal(double: 75500.99)` introduce errores de punto flotante.

### 🟢 VERDE - Solución: Conversión String para precisión

```swift
let price = Decimal(string: String(response.raw.price)) ?? Decimal(response.raw.price)
```

**Beneficio de TDD**: ¡Detectó un bug de precisión financiera que podría afectar la producción!

---

## Paso 5: Pruebas de Integración con URLProtocolStub

Las pruebas unitarias fueron geniales, pero necesitábamos probar con URLSession real sin tocar redes reales.

### El Desafío: URLProtocolStub con Swift Concurrency

```swift
final class URLProtocolStub: URLProtocol, @unchecked Sendable {
  static let stubStore = StubStore()

  actor StubStore {  // ← Actor para seguridad de hilos
    private var stubs: [URL: Stub] = [:]

    func setStub(url: URL, data: Data?, response: URLResponse?, error: Error?) {
      stubs[url] = Stub(data: data, response: response, error: error)
    }

    func getStub(for url: URL) -> Stub? {
      stubs[url]
    }
  }

  // API Pública
  static func stub(url: URL, data: Data?, response: URLResponse?, error: Error?) async {
    await stubStore.setStub(url: url, data: data, response: response, error: error)
  }
}
```

**Patrones modernos de Swift:**

- **Actor**: Estado compartido seguro para hilos
- **@unchecked Sendable**: URLProtocol no es Sendable por defecto
- **Métodos estáticos**: Evitar problemas de captura en contextos async

### Desafío de Implementación URLProtocol

**Problema**: `startLoading()` es síncrono pero necesitamos acceso async al actor

**Solución**: Manejo adecuado de tareas

```swift
override func startLoading() {
  let request = self.request
  let client = self.client

  Task { @Sendable in
    await URLProtocolStub.handleRequestAsync(
      urlProtocol: self,
      request: request,
      client: client
    )
  }
}
```

```swift
private static func handleRequestAsync(
  urlProtocol: URLProtocolStub,
  request: URLRequest,
  client: URLProtocolClient?
) async {
  guard let url = request.url,
        let stub = await URLProtocolStub.stubStore.getStub(for: url) else {
    client?.urlProtocol(urlProtocol, didFailWithError: URLError(.badURL))
    return
  }

  // Entregar respuesta simulada...
}
```

### Éxito de Prueba de Integración

```swift
@Test func binanceLoader_withURLProtocolStub_deliversResponse() async throws {
  let binanceURL = URL(string: "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")!
  let jsonData = """
  {
    "symbol": "BTCUSDT",
    "price": "68901.23000000"
  }
  """.data(using: .utf8)!

  await URLProtocolStub.stub(url: binanceURL, data: jsonData, response: httpResponse(200), error: nil)

  // URLSession real con configuración personalizada
  let config = URLSessionConfiguration.ephemeral
  config.protocolClasses = [URLProtocolStub.self]
  let session = URLSession(configuration: config)

  let sut = BinancePriceLoader(session: session)
  let quote = try await sut.loadLatest()

  #expect(quote.value == Decimal(string: "68901.23")!)
}
```

**Insight clave**: URLProtocolStub intercepta llamadas de red, permitiéndonos probar con URLSession real pero con respuestas controladas.

---

## Desafíos Reales de Desarrollo que Resolvimos

### Desafío 1: "Las APIs JSON No Siguen Estándares"

**Problema**: Binance usa strings para números, CryptoCompare usa números para números.

**Solución**: Modelos de respuesta separados por API, mapear a modelo de dominio común.

**Lección**: La infraestructura se adapta al dominio, no al revés.

### Desafío 2: "Los Números de Punto Flotante Son Malvados en Finanzas"

**Problema**: `Decimal(75500.99)` se convirtió en `75500.990000000001024`

**Solución**: Siempre convertir a través de String para precisión financiera.

**Beneficio de TDD**: Probar con diferentes valores detectó esto inmediatamente.

### Desafío 3: "Swift Concurrency en Protocolos Legacy"

**Problema**: URLProtocol es pre-async/await, pero nuestros loaders son async.

**Solución**: Manejo de estado basado en Actor con manejo adecuado de Task.

**Patrón**: Las funciones async estáticas evitan la complejidad de captura.

### Desafío 4: "HTTP 200 No Significa Éxito"

**Problema**: Las APIs pueden devolver 200 con JSON de error.

**Solución**: Siempre validar códigos de estado HTTP explícitamente.

**Mejor práctica**: No asumir nada sobre el comportamiento HTTP.

---

## Insights Arquitectónicos

### Mapeo de Errores de Dominio

```swift
// Errores de infraestructura → Errores de dominio
catch let error as DecodingError {
  throw PriceLoadingError.invalidData
} catch {
  throw PriceLoadingError.networkFailure
}
```

**Beneficio**: La capa Core nunca sabe sobre JSON, HTTP o APIs específicas.

### Pruebas Basadas en Protocolos

```swift
public protocol URLSessionProtocol: Sendable {
  func data(for request: URLRequest) async throws -> (Data, URLResponse)
}
```

**Beneficio:**

- Las pruebas unitarias usan stubs simples
- Las pruebas de integración usan URLProtocolStub
- La producción usa URLSession real
- Todos implementan el mismo contrato

### Patrones Modernos de Swift

- **Actor**: Estado compartido seguro para hilos (StubStore)
- **Closures @Sendable**: Callbacks seguros para concurrencia
- **Concurrencia estructurada**: Manejo adecuado del ciclo de vida de Task
- **Extensiones de protocolo**: `URLSession: URLSessionProtocol`

---

## Los Números: Lo que Construimos

Infraestructura de networking completa:

- **2 adaptadores de API**: Binance + CryptoCompare
- **13 pruebas en total**: Pruebas unitarias + Pruebas de integración
- **3 suites de pruebas**: BinancePriceLoaderTests, CryptoComparePriceLoaderTests, IntegrationTests
- **5 escenarios de error por loader**: Errores HTTP, errores JSON, errores de validación
- **0 dependencias en frameworks de UI**: Capa de networking pura

**Métricas de ejecución de pruebas:**
✔ Ejecución de pruebas con 13 pruebas en 3 suites pasó después de 0.008 segundos

**Por qué esto importa**: Suite de pruebas de 8ms permite retroalimentación instantánea durante el desarrollo.

---

## Decisiones Clave de Diseño que Tomamos

### 1. ¿Por qué Módulos Separados?

**Alternativa**: Agregar networking a BTCPriceCore
**Elección**: Módulo BTCPriceNetworking separado
**Razón**: Límites arquitectónicos claros, pruebas independientes

### 2. ¿Por qué Abstracción de Protocolo para URLSession?

**Alternativa**: Usar URLSession directamente en loaders
**Elección**: Abstracción URLSessionProtocol
**Razón**: Testabilidad sin frameworks de mocking complejos

### 3. ¿Por qué Actor para Estado URLProtocolStub?

**Alternativa**: @MainActor o framework de Sincronización
**Elección**: Actor personalizado StubStore
**Razón**: Aislamiento adecuado sin dependencia del hilo principal

### 4. ¿Por qué Mapeo de Errores de Dominio?

**Alternativa**: Dejar que los errores de infraestructura suban
**Elección**: Mapear todos los errores a PriceLoadingError
**Razón**: Clean Architecture - el dominio no sabe sobre JSON/HTTP

---

## Resultados Listos para Producción

Nuestra capa de networking ahora puede:

- ✅ Cargar cotizaciones de Binance con conversión string-to-decimal
- ✅ Cargar cotizaciones de CryptoCompare con manejo seguro de números para precisión
- ✅ Manejar todos los escenarios de error HTTP (404, 500, timeouts)
- ✅ Parsear diferentes formatos JSON con mapeo adecuado de errores
- ✅ Integrarse con cualquier URLSession (real o simulada)
- ✅ Mantener Clean Architecture (independencia del dominio)

**Todo modular. Todo probado. Todo compatible con Swift Concurrency.**

---

## Lo que Aprendimos

### 1. TDD Impulsa Mejor Diseño de API

Cada interfaz pública fue moldeada por pensamiento test-first:

```swift
// La prueba demandó esta API simple y enfocada
let quote = try await loader.loadLatest()

// No esta compleja y pesada en configuración
let loader = NetworkLoader(config: config, retries: 3, timeout: 30)
loader.setBaseURL(url)
let quote = try await loader.fetchPriceQuote()
```

### 2. Las APIs Reales Son Más Desordenadas que las Especificaciones

- **Binance**: `"price": "68901.23000000"` (string)
- **CryptoCompare**: `"PRICE": 68910.12` (number)
- **HTTP 200** no garantiza éxito
- **Precisión de punto flotante** importa en finanzas

La infraestructura existe para ocultar esta complejidad de la lógica de dominio.

### 3. Swift Concurrency Requiere Disciplina

- Usar **actor** para estado mutable compartido
- Preferir **métodos estáticos** para evitar complejidad de captura
- Siempre pensar en **cumplimiento Sendable**
- URLProtocol es anterior a async/await - adaptar cuidadosamente

### 4. Las Pruebas de Integración Detectan Bugs Diferentes

- **Pruebas unitarias**: Corrección de lógica
- **Pruebas de integración**: Cumplimiento de protocolo, comportamiento real de URLSession
- **Ambas necesarias** para confianza

---

## Conclusión

Pasamos de contratos de dominio abstractos → integración de API real usando TDD puro. El proceso reveló varios insights:

1. **Las APIs mienten sobre sus contratos** - siempre validar y probar con datos reales
2. **La precisión de punto flotante importa** - las apps financieras necesitan precisión Decimal
3. **Swift Concurrency es poderoso** - pero requiere diseño cuidadoso de actor
4. **Clean Architecture vale la pena** - el dominio se mantiene puro a pesar de la complejidad de infraestructura

Nuestra capa de networking de la app BTC/USD ahora puede:

- Cargar cotizaciones de múltiples APIs con diferentes formatos
- Manejar todos los escenarios de error graciosamente
- Integrarse con cualquier implementación de URLSession
- Mantener límites de Clean Architecture

**Todo modular. Todo probado. Todo listo para producción.**

El desarrollo no siempre fue suave - encontramos bugs de punto flotante, desafíos de concurrencia y sorpresas de formato JSON. Pero cada desafío nos enseñó algo valioso sobre construir infraestructura robusta.

---

## Qué Sigue

En el próximo artículo abordaremos la capa de persistencia:

- **BTCPricePersistence** → comparando UserDefaults vs FileManager vs SwiftData
- **Estrategias de caché** → cuándo persistir, cómo manejar corrupción
- **Análisis de rendimiento** → midiendo velocidades de lectura/escritura entre enfoques
- **Patrones de migración** → intercambiando implementaciones de persistencia fácilmente

Solo entonces conectaremos todo con ViewModels y construiremos las apps iOS/CLI reales que ven los usuarios.

La base de networking está sólida. Hora de hacer que los datos se queden 💾.
