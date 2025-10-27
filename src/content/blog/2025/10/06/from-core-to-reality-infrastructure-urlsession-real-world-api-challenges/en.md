---
title: 'From Core to Reality: Infrastructure, URLSession & Real-World API Challenges'
description: 'Building the networking layer with TDD: When perfect domain models meet messy real-world APIs. A journey through JSON parsing, error mapping, and Swift Concurrency patterns.'
pubDate: 'Oct 06 2025'
heroImage: './hero.png'
lang: 'en'
translationKey: 'from-core-to-infrastructure'
slug: 'from-core-to-reality-infrastructure-urlsession-real-world-api-challenges'
---

## Introduction

In the [previous article](../from-use-cases-to-code-building-the-core-with-tdd) we built a solid Core with use cases, entities, and protocols using TDD. We had `PriceLoader` contracts and domain logic, but everything was pure abstractions.

Now comes the reality check: **connecting our beautiful Core to actual APIs**.

The challenge: Binance returns `"price": "68901.23000000"` (String), while CryptoCompare returns `"PRICE": 68910.12` (Number). Different formats, different error scenarios, and we need to maintain our Clean Architecture principles.

The goal: **Build a production-ready networking layer that adapts real APIs to our domain contracts**.

By the end of this article, you'll see how real-world infrastructure challenges drive better architectural decisions, and how TDD catches bugs that could affect production.

---

## Step 1: Module Separation and Dependencies

First decision: separate module for networking concerns.

```bash
btc-price/
├── BTCPriceCore/          # Domain layer (done)
└── BTCPriceNetworking/    # Infrastructure layer (new)
```

Why separate modules?

- Clear boundaries: Infrastructure can't pollute domain
- Independent testing: Network tests don't need domain complexity
- Swappable: Could replace with different networking approach later

### Package.swift Dependencies

```swift
let package = Package(
    name: "BTCPriceNetworking",
    dependencies: [
      .package(path: "../BTCPriceCore"),  // ← Domain contracts
    ],
    targets: [
      .target(name: "BTCPriceNetworking", dependencies: ["BTCPriceCore"])
    ]
)
```

Key insight: Infrastructure depends on domain, never the other way around.

---

## Step 2: URLSession Abstraction with TDD

### 🔴 RED - The failing test drives the design

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

Compilation errors: `BinancePriceLoader` doesn't exist, `URLSessionStub` doesn't exist.

TDD benefit: The test tells us exactly what we need to build.

### 🟢 GREEN - URLSession protocol abstraction

```swift
public protocol URLSessionProtocol: Sendable {
  func data(for request: URLRequest) async throws -> (Data, URLResponse)
}

extension URLSession: URLSessionProtocol {}
```

**Why the protocol?**

- **Testability**: Can inject stubs for testing
- **Clean Architecture**: Abstract away framework details
- **Sendable compliance**: Safe for concurrent access

---

## Step 3: First API Adapter - Binance Implementation

### 🟢 GREEN - Minimal BinancePriceLoader

```swift
public struct BinancePriceLoader: PriceLoader {
  private let session: URLSessionProtocol

  public func loadLatest() async throws -> PriceQuote {
    let url = URL(string: "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT")!
    let request = URLRequest(url: url)

    let (data, response) = try await session.data(for: request)

    // HTTP status validation
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
  let price: String  // ← Note: String, not Number
}
```

**Key patterns:**

- **Domain error mapping**: `DecodingError` → `PriceLoadingError.invalidData`
- **HTTP status validation**: Don't trust 200 is the only success
- **Decimal parsing**: Financial precision over Double

### 🔄 REFACTOR - Comprehensive error testing

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

**Result**: 5 tests covering happy path, different data, JSON errors, HTTP errors.

---

## Step 4: Different API, Different Challenges - CryptoCompare

Same TDD approach, but different JSON structure reveals new challenges:

### 🔴 RED - Different JSON format

```swift
@Test func loadLatest_withValidCryptoCompareResponse_deliversPriceQuote() async throws {
  let jsonData = """
  {
    "RAW": {
      "PRICE": 68910.12,          // ← Number, not String!
      "FROMSYMBOL": "BTC",
      "TOSYMBOL": "USD"
    }
  }
  """.data(using: .utf8)!

  // ... rest of test
}
```

### Challenge 1: Complex JSON Structure

```swift
private struct CryptoCompareResponse: Codable {
  let raw: RAWData

  struct RAWData: Codable {
    let price: Double           // ← Double from API
    let fromSymbol: String
    let toSymbol: String

    enum CodingKeys: String, CodingKey {
      case price = "PRICE"      // ← Uppercase in API
      case fromSymbol = "FROMSYMBOL"
      case toSymbol = "TOSYMBOL"
    }
  }

  enum CodingKeys: String, CodingKey {
    case raw = "RAW"
  }
}
```

### Challenge 2: Floating-Point Precision Bug Discovered

Test failure revealed a real bug:

- **Expected**: `75500.99`
- **Actual**: `75500.990000000001024`

**Root cause**: `Decimal(double: 75500.99)` introduces floating-point errors.

### 🟢 GREEN - Solution: String conversion for precision

```swift
let price = Decimal(string: String(response.raw.price)) ?? Decimal(response.raw.price)
```

**TDD benefit**: Caught a financial precision bug that could affect production!

---

## Step 5: Integration Testing with URLProtocolStub

Unit tests were great, but we needed to test with real URLSession without hitting real networks.

### The Challenge: URLProtocolStub with Swift Concurrency

```swift
final class URLProtocolStub: URLProtocol, @unchecked Sendable {
  static let stubStore = StubStore()

  actor StubStore {  // ← Actor for thread safety
    private var stubs: [URL: Stub] = [:]

    func setStub(url: URL, data: Data?, response: URLResponse?, error: Error?) {
      stubs[url] = Stub(data: data, response: response, error: error)
    }

    func getStub(for url: URL) -> Stub? {
      stubs[url]
    }
  }

  // Public API
  static func stub(url: URL, data: Data?, response: URLResponse?, error: Error?) async {
    await stubStore.setStub(url: url, data: data, response: response, error: error)
  }
}
```

**Modern Swift patterns:**

- **Actor**: Thread-safe shared state
- **@unchecked Sendable**: URLProtocol isn't Sendable by default
- **Static methods**: Avoid capture issues in async contexts

### URLProtocol Implementation Challenge

**Problem**: `startLoading()` is synchronous but we need async access to actor

**Solution**: Proper task management

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

  // Deliver stubbed response...
}
```

### Integration Test Success

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

  // Real URLSession with custom configuration
  let config = URLSessionConfiguration.ephemeral
  config.protocolClasses = [URLProtocolStub.self]
  let session = URLSession(configuration: config)

  let sut = BinancePriceLoader(session: session)
  let quote = try await sut.loadLatest()

  #expect(quote.value == Decimal(string: "68901.23")!)
}
```

**Key insight**: URLProtocolStub intercepts network calls, letting us test with real URLSession but controlled responses.

---

## Real Development Challenges We Solved

### Challenge 1: "JSON APIs Don't Follow Standards"

**Problem**: Binance uses strings for numbers, CryptoCompare uses numbers for numbers.

**Solution**: Separate response models per API, map to common domain model.

**Lesson**: Infrastructure adapts to domain, not the other way around.

### Challenge 2: "Floating-Point Numbers Are Evil in Finance"

**Problem**: `Decimal(75500.99)` became `75500.990000000001024`

**Solution**: Always convert through String for financial precision.

**TDD benefit**: Test with different values caught this immediately.

### Challenge 3: "Swift Concurrency in Legacy Protocols"

**Problem**: URLProtocol is pre-async/await, but our loaders are async.

**Solution**: Actor-based state management with proper Task handling.

**Pattern**: Static async functions avoid capture complexity.

### Challenge 4: "HTTP 200 Doesn't Mean Success"

**Problem**: APIs can return 200 with error JSON.

**Solution**: Always validate HTTP status codes explicitly.

**Best practice**: Assume nothing about HTTP behavior.

---

## Architecture Insights

### Domain Error Mapping

```swift
// Infrastructure errors → Domain errors
catch let error as DecodingError {
  throw PriceLoadingError.invalidData
} catch {
  throw PriceLoadingError.networkFailure
}
```

**Benefit**: Core layer never knows about JSON, HTTP, or specific APIs.

### Protocol-Based Testing

```swift
public protocol URLSessionProtocol: Sendable {
  func data(for request: URLRequest) async throws -> (Data, URLResponse)
}
```

**Benefit:**

- Unit tests use simple stubs
- Integration tests use URLProtocolStub
- Production uses real URLSession
- All implement same contract

### Modern Swift Patterns

- **Actor**: Thread-safe shared state (StubStore)
- **@Sendable closures**: Concurrency-safe callbacks
- **Structured concurrency**: Proper Task lifecycle management
- **Protocol extensions**: `URLSession: URLSessionProtocol`

---

## The Numbers: What We Built

Complete networking infrastructure:

- **2 API adapters**: Binance + CryptoCompare
- **13 tests total**: Unit tests + Integration tests
- **3 test suites**: BinancePriceLoaderTests, CryptoComparePriceLoaderTests, IntegrationTests
- **5 error scenarios per loader**: HTTP errors, JSON errors, validation errors
- **0 dependencies on UI frameworks**: Pure networking layer

**Test execution metrics:**
✔ Test run with 13 tests in 3 suites passed after 0.008 seconds

**Why this matters**: 8ms test suite enables instant feedback during development.

---

## Key Design Decisions We Made

### 1. Why Separate Modules?

**Alternative**: Add networking to BTCPriceCore
**Choice**: Separate BTCPriceNetworking module
**Reason**: Clear architectural boundaries, independent testing

### 2. Why Protocol Abstraction for URLSession?

**Alternative**: Use URLSession directly in loaders
**Choice**: URLSessionProtocol abstraction
**Reason**: Testability without complex mocking frameworks

### 3. Why Actor for URLProtocolStub State?

**Alternative**: @MainActor or Synchronization framework
**Choice**: Custom actor StubStore
**Reason**: Proper isolation without main thread dependency

### 4. Why Domain Error Mapping?

**Alternative**: Let infrastructure errors bubble up
**Choice**: Map all errors to PriceLoadingError
**Reason**: Clean Architecture - domain doesn't know about JSON/HTTP

---

## Production-Ready Results

Our networking layer can now:

- ✅ Load quotes from Binance with string-to-decimal conversion
- ✅ Load quotes from CryptoCompare with precision-safe number handling
- ✅ Handle all HTTP error scenarios (404, 500, timeouts)
- ✅ Parse different JSON formats with proper error mapping
- ✅ Integrate with any URLSession (real or stubbed)
- ✅ Maintain Clean Architecture (domain independence)

**All modular. All tested. All Swift Concurrency compliant.**

---

## What We Learned

### 1. TDD Drives Better API Design

Every public interface was shaped by test-first thinking:

```swift
// Test demanded this simple, focused API
let quote = try await loader.loadLatest()

// Not this complex, configuration-heavy one
let loader = NetworkLoader(config: config, retries: 3, timeout: 30)
loader.setBaseURL(url)
let quote = try await loader.fetchPriceQuote()
```

### 2. Real APIs Are Messier Than Specs

- **Binance**: `"price": "68901.23000000"` (string)
- **CryptoCompare**: `"PRICE": 68910.12` (number)
- **HTTP 200** doesn't guarantee success
- **Floating-point precision** matters in finance

Infrastructure exists to hide this complexity from domain logic.

### 3. Swift Concurrency Requires Discipline

- Use **actor** for shared mutable state
- Prefer **static methods** to avoid capture complexity
- Always think about **Sendable compliance**
- URLProtocol pre-dates async/await - adapt carefully

### 4. Integration Tests Catch Different Bugs

- **Unit tests**: Logic correctness
- **Integration tests**: Protocol compliance, real URLSession behavior
- **Both needed** for confidence

---

## Conclusion

We went from abstract domain contracts → real API integration using pure TDD. The process revealed several insights:

1. **APIs lie about their contracts** - always validate and test with real data
2. **Floating-point precision matters** - financial apps need Decimal precision
3. **Swift Concurrency is powerful** - but requires careful actor design
4. **Clean Architecture pays off** - domain stays pure despite infrastructure complexity

Our BTC/USD app networking layer can now:

- Load quotes from multiple APIs with different formats
- Handle all error scenarios gracefully
- Integrate with any URLSession implementation
- Maintain Clean Architecture boundaries

**All modular. All tested. All production-ready.**

The development wasn't always smooth - we hit floating-point bugs, concurrency challenges, and JSON format surprises. But each challenge taught us something valuable about building robust infrastructure.

---

## What's Next

In the next article we'll tackle the persistence layer:

- **BTCPricePersistence** → comparing UserDefaults vs FileManager vs SwiftData
- **Cache strategies** → when to persist, how to handle corruption
- **Performance analysis** → measuring read/write speeds across approaches
- **Migration patterns** → swapping persistence implementations easily

Only then will we connect everything with ViewModels and build the actual iOS/CLI apps that users see.

The networking foundation is solid. Time to make data stick around 💾.
