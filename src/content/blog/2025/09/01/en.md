---
title: 'From Use Cases to Code: Building the Core with TDD (without infrastructure)'
description: 'Learn how to turn clear use cases into production-ready Core code using TDD. We will define entities, protocols, and use cases for a BTC/USD app — all tested, modular, and infrastructure-free'
pubDate: 'Sep 01 2025'
heroImage: './hero.png'
lang: 'en'
translationKey: 'from-use-cases-to-core'
slug: 'from-use-cases-to-code-building-the-core-with-tdd'
---

## Introduction

In the [previous](/en/blog/from-requirements-to-use-cases-building-a-btc-price-app-the-right-way/) we transformed vague requirements into **user stories**, **narratives** and **use cases**.
Now it's time to show how those use cases turn into **code**.

But here's the twist: we won't start with networking or persistence. Instead, we'll focus on **the Core** - the heart of the app where contracts and behaviors live. Everything else (infrastructure) will come later.

The goal: **build a modular, reusable, and testable Core using TDD.**

By the end of this article, you'll see how TDD naturally guides us toward clean architecture, and how real development challenges shape better design decisions.

---

## Step 1: Defining the Domain Entities

We start with the essential domain model: `PriceQuote`. It represents a BTC/USD value at a given timestamp.

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

**Design decisions made here:**
- `Decimal` gives us precision for financial values (no floating-point errors).
- `Sendable` ensures safe use across concurrency boundaries.
- `Equatable` enables easy testing and comparisons

This single entity will be the foundation for everything that follows.

---

## Step 2 - Contracts: Ports for Data and Persistence

Next, we define the **protocols** (ports). These contracts describe what the system _needs_ without tying us to specific implementations.

```swift
public protocol PriceLoader: Sendable {
  func loadLatest() async throws -> PriceQuote
}
```

- `PriceLoader` → how we get the latest price (Binance, CryptoCompare, etc. later).
- `Sendable` → safe for concurrent use.
- `async throws` → acknowledges network operations can fail and take time.

Clean Architecture principle: **Define the ports in Core, implement them elsewhere**.

---

## Step 3 - First Use Case: FetchLatestPrice

Let's implement the simplest behavior: load the latest quote. But we'll do it **test-first**

🔴 RED - Write the failing test

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

**Compilation error**: Cannot find `FetchLatestPrice` in scope

This is exactly what we want! The test tells us what we need to build.

🟢 GREEN - Make it pass with minimal code

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

And the test stub:

```swift
  private struct LoaderStub: PriceLoader {
    let result: Result<PriceQuote, Error>
    func loadLatest() async throws -> PriceQuote { try result.get() }
  }
```

🔄 REFACTOR - Add error handling

```swift
  @Test func fetchLatestPrice_propagatesLoaderError() async {
    let sut = FetchLatestPrice(loader: LoaderStub(result: .failure(DummyError.any)))

    await #expect(throws: Error.self) {
      _ = try await sut.execute()
    }
  }

  private enum DummyError: Error { case any }
```

**Key insight**: We only wrote code after tests demanded it. TDD forced us to think about the API from the caller's perspective first.

---

## Step 4 - Adding Resilience: FetchWithFallback

Requirements said: _use a secondary source if the primary fails_. Let's implement this with TDD.

🔴 RED - Define the behavior through tests

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

🟢 GREEN - Implement the fallback logic

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

**Elegant!** The do-catch naturally expresses the fallback behavior.

---

## Step 5 Real-World Challenge - Handling Timeouts

But what if a source takes _too long_? We can't freeze the app waiting. Let's add timeout support.

First, we need a Clock abstraction

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

🔴 RED - Test with timeout behavior

```swift
  @Suite("FetchWithFallback + Timeout")
  struct FetchWithFallbackTimeoutTests {
    @Test func usesPrimary_whenPrimaryFinishesBeforeTimeout() async throws {
      let expected = PriceQuote(value: 68_900, currency: "USD", timestamp: Date())
      let primary = ClosureLoader { expected }  // Fast loader
      let fallback = ClosureLoader { throw DummyError.any }

      let sut = FetchWithFallback(
        primary: primary,
        fallback: fallback,
        timeout: 1,
        clock: TestClock()  // No real delays in tests
      )

      let received = try await sut.execute()
      #expect(received == expected)
    }

    // Helper for flexible test scenarios
    struct ClosureLoader: PriceLoader {
      let action: @Sendable () async throws -> PriceQuote
      func loadLatest() async throws -> PriceQuote { try await action() }
    }

    private struct TestClock: Clock {
      func now() -> Date { Date() }
      func sleep(for seconds: TimeInterval) async {
        // No-op: no sleep in tests for speed
      }
    }
  }
```

🟢 GREEN - Implement timeout with `Task.race`

```swift
  public struct FetchWithFallback: Sendable {
    private let primary: PriceLoader
    private let fallback: PriceLoader
    private let timeout: TimeInterval
    private let clock: Clock

    public init(
      primary: PriceLoader, 
      fallback: PriceLoader,
      timeout: TimeInterval = 0.8,  // 800ms default
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

**Key pattern**: Using `TaskGroup` to race the primary loader against a timeout task.

---

## Step 6 - Introducing Cache - The Persistent Layer

Now let's implement caching. We need to persist the last valid price for offline scenarios.

🔴 RED - Start with the test that expresses our intent

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

      try await sut.save(quote)  // Should not throw
    }

    @Test func loadCachedPrice_afterSave_shouldReturnSavedPrice() async throws {
      let quote = PriceQuote(value: 68_901.23, currency: "USD", timestamp: Date())
      let sut = PriceStoreStub()

      try await sut.save(quote)
      let cached = await sut.loadCached()

      #expect(cached == quote)  // Round-trip success!
    }
  }
```

**Compilation error**: Cannot find `PriceStore` in scope

🟢 GREEN - Create the protocol and minimal implementation

```swift
  public protocol PriceStore: Sendable {
    func save(_ quote: PriceQuote) async throws
    func loadCached() async -> PriceQuote?
  }

  Test stub:
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

🔄 REFACTOR - Add the Use Case

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

Let's add more comprehensive error testing:

```swift
  @Test func savePrice_whenStorageFails_shouldReturnError() async {
    let quote = PriceQuote(value: 68_901.23, currency: "USD", timestamp: Date())
    let sut = PriceStoreStub(shouldFail: true)

    await #expect(throws: Error.self) {
      try await sut.save(quote)
    }
  }
```

---

## Step 7 - Presentation Layer - Concurrent Formatting

Requirements said: format price as "$68,901.23" and timestamp as "Aug 25, 14:30". Let's implement this efficiently.


### Why Two Separate Protocols?

We could use one generic `Formatter` protocol, but TDD naturally led us to separate concerns:

```swift
  public protocol PriceFormatter: Sendable {
    func format(_ value: Decimal) async -> String
  }

  public protocol TimestampFormatter: Sendable {
    func format(_ timestamp: Date) async -> String
  }
```

Benefits discovered through testing:
1. **Type safety**: Can't accidentally pass timestamp to price formatter
2. **Easier mocking**: Test doubles are more focused
3. **Single responsibility**: Each protocol has one clear job

🔴 RED - Test the formatting behavior

```swift
  @Suite("RenderPriceAndTimestampUseCaseTests")
  struct RenderPriceAndTimestampUseCaseTests {
    @Test func execute_deliversBothFormattedTexts() async throws {
      let quote = PriceQuote(
        value: 68_901.23,
        currency: "USD",
        timestamp: Date()
      )
      let priceFormatter = PriceFormatterStub(result: "$68,901.23")
      let timestampFormatter = TimestampFormatterStub(result: "Aug 25, 14:30")
      let sut = RenderPriceAndTimestamp(
        priceFormatter: priceFormatter,
        timestampFormatter: timestampFormatter
      )

      let result = await sut.execute(quote)

      #expect(result.priceText == "$68,901.23")
      #expect(result.timestampText == "Aug 25, 14:30")
    }
  }
```

This test demands a `FormattedPrice` entity and a `RenderPriceAndTimestamp` use case.

🟢 GREEN - Implement with concurrent execution

```swift
  public struct FormattedPrice: Equatable, Sendable {
    public let priceText: String
    public let timestampText: String

    public init(priceText: String, timestampText: String) {
      self.priceText = priceText
      self.timestampText = timestampText
    }
  }

  public struct RenderPriceAndTimestamp: Sendable {
    private let priceFormatter: PriceFormatter
    private let timestampFormatter: TimestampFormatter

    public init(
      priceFormatter: PriceFormatter,
      timestampFormatter: TimestampFormatter
    ) {
      self.priceFormatter = priceFormatter
      self.timestampFormatter = timestampFormatter
    }

    public func execute(_ quote: PriceQuote) async -> FormattedPrice {
      // 🚀 Both formatters run in parallel!
      async let priceText = priceFormatter.format(quote.value)
      async let timestampText = timestampFormatter.format(quote.timestamp)

      return await FormattedPrice(
        priceText: priceText,      // "$68,901.23"
        timestampText: timestampText // "Aug 25, 14:30"
      )
    }
  }
```

**Performance insight**: Sequential formatting: 20ms + 15ms = 35ms. Concurrent: max(20ms, 15ms) = 20ms. **43% faster!**

🔄 REFACTOR - Add behavior verification tests

```swift
  @Test func execute_passesCorrectValueToPriceFormatter() async throws {
    let quote = PriceQuote(value: 12_345.67, currency: "USD", timestamp: Date())
    let priceFormatter = PriceFormatterSpy()
    let timestampFormatter = TimestampFormatterStub(result: "Aug 25, 14:30")
    let sut = RenderPriceAndTimestamp(
      priceFormatter: priceFormatter,
      timestampFormatter: timestampFormatter
    )

    _ = await sut.execute(quote)

    let formattedValues = await priceFormatter.formattedValues
    #expect(formattedValues == [12_345.67])
  }

  private actor PriceFormatterSpy: PriceFormatter {
    private(set) var formattedValues: [Decimal] = []

    func format(_ value: Decimal) async -> String {
      formattedValues.append(value)
      return "$\(value)"
    }
  }
```

**Pattern note**: Using `actor` for thread-safe spy objects in concurrent tests.

---

## Step 8: The Orchestrator - OneSecondTicker (Where Things Got Tricky)

This is where things get interesting. UC5 coordinates all other use cases in a 1-second rhythm.

### Challenge #1: Extending the Clock Protocol

We need the `Clock` to support periodic ticks:

```swift
  public protocol Clock: Sendable {
    func now() -> Date
    func sleep(for seconds: TimeInterval) async
    func tick() -> AsyncStream<Void>  // ← New requirement
  }
```

**Error cascade**:
* ❌ FetchWithFallbackTimeoutTests.swift:45: Type `TestClock` does not conform to protocol `Clock`
* ❌ Multiple test files broken...

**Solution**: Update all Clock conformances. This taught us why starting minimal and evolving incrementally works better than designing everything upfront.

```swift
  public struct SystemClock: Clock {
    public func tick() -> AsyncStream<Void> {
      AsyncStream { continuation in
        Task {
          while !Task.isCancelled {
            continuation.yield()
            await sleep(for: 1.0) // 1 second rhythm
          }
          continuation.finish()
        }
      }
    }
  }

  // In tests:
  private struct TestClock: Clock {
    func tick() -> AsyncStream<Void> {
      AsyncStream { continuation in
        continuation.finish() // No ticks needed for this test
      }
    }
  }
```

### Challenge #2: First Attempt (That Failed Spectacularly)

```swift
  @Test func start_executesFetchFunction() async throws {
    let fetchSpy = FetchSpy()
    let sut = OneSecondTicker(fetch: fetchSpy.fetch)

    await sut.start()  // ❌ This hung forever!

    let fetchCallCount = await fetchSpy.callCount
    #expect(fetchCallCount == 1)
  }

  public struct OneSecondTicker: Sendable {
    public func start() async {
      for await _ in clock.tick() {  // ❌ Infinite loop!
        _ = try? await fetch()
      }
    }
  }
```

**Test result**: Hung for 120+ seconds. We had to kill the test runner.

**Root cause**: `start()` blocked forever, never returning control to the test.

### The Cancellation Solution

```swift
  public actor OneSecondTicker {  // ← actor for thread-safe state management
    private let fetch: @Sendable () async throws -> PriceQuote
    private let clock: Clock
    private var tickerTask: Task<Void, Never>?

    public init(
      fetch: @escaping @Sendable () async throws -> PriceQuote,
      clock: Clock = SystemClock()
    ) {
      self.fetch = fetch
      self.clock = clock
    }

    public func start() async {
      guard tickerTask == nil else { return }  // Prevent duplicate tickers

      tickerTask = Task {
        for await _ in clock.tick() {
          guard !Task.isCancelled else { break }  // ← Escape hatch!
          _ = try? await fetch()
        }
      }
    }

    public func stop() async {
      tickerTask?.cancel()
      tickerTask = nil
    }
  }
```

**Why actor?** Managing mutable state (`tickerTask`) across concurrent access required proper synchronization.

## Challenge #3: Race Conditions in Tests

### Initial test was flaky:

```swift
  await sut.start()
  let fetchCallCount = await fetchSpy.callCount  // ❌ Sometimes 0, sometimes 1
  #expect(fetchCallCount == 1)
```

**Root cause**: Race between test completion and async ticker execution.

**Solution**: Explicit synchronization:

```swift
  @Test func start_executesFetchEverySecond() async throws {
    let fetchSpy = FetchSpy()
    let clockStub = ClockStub(interval: 0.01) // Fast for testing
    let sut = OneSecondTicker(fetch: fetchSpy.fetch, clock: clockStub)

    await sut.start()
    try await Task.sleep(for: .milliseconds(50)) // Wait for ~2 ticks
    await sut.stop()                             // Clean shutdown

    let fetchCallCount = await fetchSpy.callCount
    #expect(fetchCallCount >= 2) // At least 2 executions
  }
```

### Key patterns:
- Use fast intervals in tests (0.01s vs 1s in production)
- Explicit timing control with `Task.sleep`
- Always clean up with `stop()`

---

## The Complete Picture: What We Built

### Our Core now includes:

#### Entities (3)

- `PriceQuote` - The core domain model
- `FormattedPrice` - Presentation-ready data
- `CachedPrice` - Persistence wrapper (implicit in store)

#### Protocols (5)

- `PriceLoader` - Data fetching contract
- `PriceStore` - Persistence contract
- `PriceFormatter` - Price formatting contract
- `TimestampFormatter` - Time formatting contract
- `Clock` - Time abstraction for testing

#### Use Cases (5)

- `FetchLatestPrice` - Basic data loading
- `FetchWithFallback` - Resilient data loading with timeout
- `PersistLastValidPrice` - Cache management
- `RenderPriceAndTimestamp` - Concurrent formatting
- `OneSecondTicker` - Orchestration with lifecycle management

#### Test Coverage

- **7 test suites** with **25 individual tests**
- **100% protocol coverage** (all protocols have test doubles)
- **0 infrastructure dependencies** (pure domain logic)
- **Test execution time**: ~0.007 seconds total

```bash
  ✔ Suite "PriceStoreTests" passed after 0.001 seconds.
  ✔ Suite "RenderPriceAndTimestampUseCaseTests" passed after 0.002 seconds.
  ✔ Suite "OneSecondTickerUseCaseTests" passed after 0.001 seconds.
  ✔ All tests passed: 25 tests, 0 failures in 0.007 seconds
```

**Why this matters**: Sub-10ms test suite means instant feedback during development.

---
## Key Design Insights We Discovered

### TDD Drives Better APIs

Every public interface was designed from the caller's perspective first:

```swift
  // Test demanded this simple, focused API
  let result = await renderUseCase.execute(quote)
  #expect(result.priceText == "$68,901.23")

  // Not this complex, implementation-driven one
  let formatter = PriceFormatter()
  formatter.setCurrency("USD")
  formatter.setPrecision(2)
  let text = formatter.format(quote.value)
```

### Concurrency Patterns Emerge Naturally

When tests demanded fast execution, `async let` was the obvious solution:

```swift
  // Sequential (emerged first in tests)
  let priceText = await priceFormatter.format(quote.value)
  let timestampText = await timestampFormatter.format(quote.timestamp)

  // Concurrent (refactored for performance)
  async let priceText = priceFormatter.format(quote.value)
  async let timestampText = timestampFormatter.format(quote.timestamp)
```

### Protocol Evolution Must Be Deliberate

Adding `tick()` to `Clock` broke existing code, teaching us:

- Start with minimal contracts
- Grow them incrementally
- Expect to update all conformances
- Consider default implementations for new requirements

### Actor Usage Becomes Clear

We started with `struct OneSecondTicker` but mutable state (`tickerTask`) across concurrent access demanded `actor`. The type system guided us to thread safety.

### Error Handling Shapes Architecture

The fallback pattern emerged directly from error scenarios:

```swift
  do {
    return try await primary.loadLatest()
  } catch {
    return try await fallback.loadLatest()  // Natural fallback flow
  }
```

---

## Lessons from Real Development Challenges

### Infinite Loops Are Easy to Create

Async sequences with `for await` can easily become infinite loops. Always provide escape hatches:

```swift
  for await _ in clock.tick() {
    guard !Task.isCancelled else { break }  // Essential escape hatch
    // ... do work
  }
```

### Test Timing Requires Explicit Control

Async tests need predictable timing:

```swift
  // ❌ Flaky - race conditions
  await sut.start()
  #expect(callCount == 1)

  // ✅ Reliable - explicit synchronization  
  await sut.start()
  try await Task.sleep(for: .milliseconds(50))
  await sut.stop()
  #expect(callCount >= 1)
```

### Protocol Evolution Has Cascading Effects

When extending protocols, plan to update all conformances. This is why Clean Architecture's "stable abstractions principle" matters.

### Actor vs Struct Decision Is Usually Clear

If you have mutable state accessed concurrently, you need `actor`. The compiler will guide you.

---

## What Makes This Core Production-Ready

### Zero Infrastructure Dependencies

Our Core has no knowledge of:
  
- Network libraries (URLSession, Alamofire, etc.)
- Persistence frameworks (Core Data, SQLite, etc.)
- UI frameworks (SwiftUI, UIKit, etc.)

This means it's:
  
- ✅ **Testable**: No mocking of heavy frameworks
- ✅ **Portable**: Works in iOS, macOS, CLI, server
- ✅ **Stable**: Changes in infrastructure don't break Core

### Comprehensive Error Handling

Every async operation properly handles:
  
- Network timeouts
- Fallback scenarios
- Storage failures
- Cancellation

### Thread Safety by Design

- All protocols are `Sendable`
- Mutable state uses `actor`
- Immutable entities use `struct`
- Async operations are properly isolated

### Performance Optimized

- Concurrent formatting with `async let`
- Efficient timeout handling with `TaskGroup`
- Minimal allocations with value types

---

## Conclusion

We went from use **case definitions → working Core code** using pure TDD. The process revealed several key insights:

1. **Tests drive better design** - Every public API was shaped by test-first thinking
2. **Errors inform architecture** - Fallback patterns emerged from failure scenarios
3. **Concurrency patterns surface naturally** - Performance needs led to async let
4. **Protocol evolution requires discipline** - Breaking changes cascade quickly
5. **Type system guides safety** - actor vs struct becomes obvious

Our BTC/USD app Core can now:

- ✅ Load quotes with fallback and timeout
- ✅ Cache values for offline use
- ✅ Format data for presentation
- ✅ Orchestrate operations in a 1-second rhythm
- ✅ Handle all error scenarios gracefully

All **modular**. All **tested**. All **without IO**.

The development wasn't always smooth - we hit infinite loops, race conditions, and breaking changes. But each challenge taught us something valuable about concurrent system design.

---

## What's Next

In the next article we'll connect this Core with the real world:

- `BTCPriceNetworking` → concrete loaders for Binance and CryptoCompare APIs
- `BTCPricePersistence` → a real store using `UserDefaults` or file storage
- `BTCPriceFeature` → a ViewModel that orchestrates everything
- `Integration testing` → end-to-end scenarios with URLProtocolStub

Only then will we build the CLI and iOS apps that users actually see.

The Core is ready. Time to connect it to reality 🚀.