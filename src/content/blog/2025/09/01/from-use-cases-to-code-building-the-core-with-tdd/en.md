---
title: 'From Use Cases to Code: Building the Core with TDD (without infrastructure)'
description: 'Learn how to turn clear use cases into production-ready Core code using TDD. We’ll define entities, protocols, and use cases for a BTC/USD app — all tested, modular, and infrastructure-free.'
pubDate: 'Sep 01 2025'
heroImage: './hero.png'
lang: 'en'
translationKey: 'from-use-cases-to-core'
slug: 'from-use-cases-to-code-building-the-core-with-tdd'
---

## Introduction

In the [previous](../from-requirements-to-use-cases-building-a-btc-price-app-the-right-way) we transformed vague requirements into **user stories**, **narratives** and **use cases**.
Now it's time to show how those use cases turn into **code**.

But here's the twist: we won't start with networking or persistence. Instead, we'll focus on **the Core** - the heart of the app where contracts and behaviors live. Everything else (infrastructure) will come later.

The goal: **build a modular, reusable, and testable Core using TDD.**

---

## Step 1: Defining the Domain Entities

We start with the essential domain model: `PriceQuote`.
It represents a BTC/USD value at a given timestamp.

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

- `Decimal` gives us precision for financial values.
- `Sendable` ensures safe use across concurrency boundaries.

---

## Step 2 - Contracts: Ports for Data and Persistence

Next, we define the **protocols** (ports).
These contracts describe what the system _needs_ without tying us to specific implementations.

```swift
public protocol PriceLoader: Sendable {
  func loadLatest() async throws -> PriceQuote
}

public protocol PriceStore: Sendable {
  func save(_ quote: PriceQuote) async throws
  func load() async throws -> PriceQuote?
}
```

- `PriceLoader` → how we get the latest price (Binance, CryptoCompare, etc. later).
- `PriceStore` → how we cache the last known value.

Clean Architecture principle: **Define the ports in Core, implement them elsewhere**.

---

## Step 3 - First Use Case: FetchLatestPrice

The simplest behavior: load the latest quote

### Test First

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

We start with a happy path and an error path.
These tests **force us** to define the `FetchLatestPrice` use case and a `LoaderStub`.

### Implementation

The use case is trivial: just delegate to the loader.
But the key is: **we only wrote it after the test asked for it**.

---

## Step 4 - Adding Resilience: FetchWithFallback

Requirements said: _use a secondary source if the primary fails_.
So we write tests first:

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

From these tests we implement `FetchWithFallback`.
Again: tests define behavior → code follows.

---

## Step 5 - Handling Timeouts

But what if a source takes _too long_?
We can't freeze the app waiting. So we add a timeout

### Test with a Fake Clock

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

The test uses a `TestClock` that never actually sleeps.
This way we simulate "timeouts" instantly, keeping tests fast.

The implementation runs a race between the primary loader and a timeout task.
If the timeout wins, we fall back to the secondary loader.

---

## Step 6 - Introducing Cache: PriceStore Use Cases

Finally, we define caching behavior.
The `PriceStore` protocol already exists, so we add two simple use cases: `SavePriceToStore` and `LoadPriceFromStore`.

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

The tests use an **InMemoryPriceStore fake**:

```swift
private struct InMemoryPriceStore: PriceStore {
  private var box = Box()
  func save(_ quote: PriceQuote) async throws { box.value = quote }
  func load() async throws -> PriceQuote? { box.value }
  private final class Box: @unchecked Sendable { var value: PriceQuote? }
}
```

This fake store validates the contract without touching disk or databases.

---

## Step 7 - Green Core: All Tests Passing

At this point all our Core tests are ✅ green.
We now have:

- **Entities**: `PriceQuote`
- **Protocols**: `PriceLoader`, `PriceStore`
- **Use Cases**
  - `FetchLatestPrice`
  - `FetchWithFallback` (+ timeout)
  - `SavePriceToStore`/`LoadPriceFromStore`

All behaviors are defined and tested.
And yet: we haven't written a single line of network or persistence code.

That's the power of **driving code from use cases**.

---

## Conclusion

In this article we went from **use case definitions → working Core code**.
We practiced TDD: write a test, watch it fail, implement the minimum, watch it pass.  
And we applied Clean Architecture: the Core defines the contracts, and infrastructure will plug in later.

So far, our BTC/USD app can:

- Load a quote from a loader.
- Fall back to a secondary loader.
- Enforce a timeout
- Save and load cached values.

All modular. All tested. All without IO.

---

## What's Next

In the next article we'll connect the Core with the real world:

- **BTCPriceNetworking** → loaders for Binance and CryptoCompare.
- **BTCPricePersistence** → a concrete store using `UserDefaults` or file storage (we'll see later).
- **BTCPriceFeature** → a ViewModel with a 1-second ticket that saves to cache on success and loads from cache on failure.

Only then will we build the CLI and iOS apps that display the data.
Stay tuned 🚀.
