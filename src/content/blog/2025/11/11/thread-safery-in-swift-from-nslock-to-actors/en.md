---
title: 'Thread Safety in Swift: From NSLock to Actors'
description: 'Explore three approaches to achieve thread safety in Swift: from traditional locks (NSLock) to the modern solution with Actors. Learn about race conditions, deadlocks, and how Swift Concurrency elegantly solves these problems.'
pubDate: 'Nov 11 2025'
heroImage: './hero.png'
lang: 'en'
translationKey: 'thread-safety-in-swift'
slug: 'thread-safety-in-swift-from-nslock-to-actors'
---

## Introduction

Concurrency is one of those topics that seems simple until it bites you. When multiple threads access and modify shared data simultaneously, **race conditions** can occur, producing unpredictable results and bugs that appear once every thousand executions.

In this article, we'll explore three approaches to achieve thread safety in Swift, using a `BankAccount` class that simulates banking operations as our case study. We'll see how to evolve from traditional locks to the modern solution with Swift Concurrency.

The complete code is available in the [GitHub repository](https://github.com/SwiftyJourney/bank-account-case-study).

---

## The Case Study: BankAccount

Let's start with a basic implementation:

```swift
public final class BankAccount {
  public let owner: String
  public let accountNumber: String
  public private(set) var balance: Double

  public enum Error: Swift.Error {
    case insufficientFunds
    case invalidAmount
    case sameAccountTransfer
    case fraudAlert
  }

  public init(owner: String, accountNumber: String, balance: Double) {
    self.owner = owner
    self.accountNumber = accountNumber
    self.balance = balance
  }

  public func deposit(_ amount: Double) throws {
    guard amount > 0 else { throw Error.invalidAmount }
    balance += amount
  }

  public func withdraw(_ amount: Double) throws {
    guard amount > 0 else { throw Error.invalidAmount }
    guard amount <= balance else { throw Error.insufficientFunds }
    guard amount < 5000 else { throw Error.fraudAlert }
    balance -= amount
  }

  public func transfer(to receiver: BankAccount, amount: Double) throws {
    guard accountNumber != receiver.accountNumber else {
      throw Error.sameAccountTransfer
    }
    try self.withdraw(amount)
    try receiver.deposit(amount)
  }
}
```

This implementation works perfectly… on a single thread. But when multiple threads try to access `balance` simultaneously, everything falls apart.

---

## The Problem: Race Conditions

```swift
let account = BankAccount(owner: "John", accountNumber: "123", balance: 1000)

DispatchQueue.global().async {
  try? account.deposit(100)
}

DispatchQueue.global().async {
  try? account.withdraw(50)
}
```

Both operations read and modify `balance` at the same time. This can cause:

1. **Inconsistent reads**: One thread reads `balance` while another modifies it.
2. **Data loss**: Two simultaneous deposits can overwrite each other.
3. **Unpredictable results**: The final balance can be anything.

We need synchronization.

---

## Solution 1: NSLock

The classic approach uses `NSLock` for mutual exclusion. Only one thread can acquire the lock at a time.

### Key Changes

1. Replace `balance` with a private variable `_balance`
2. Add an `NSLock`
3. Protect operations with `lock.lock()` and `defer { lock.unlock() }`

```swift
public final class BankAccount {
  private var _balance: Double
  private let lock = NSLock()

  public var balance: Double {
    lock.lock()
    defer { lock.unlock() }
    return _balance
  }

  public func deposit(_ amount: Double) throws {
    lock.lock()
    defer { lock.unlock() }
    guard amount > 0 else { throw Error.invalidAmount }
    _balance += amount
  }

  // withdraw similar...
}
```

The `defer` ensures the lock is released even if there's an early `throw` or `return`.

---

### The Deadlock Problem in Transfers

```swift
// ❌ Can cause deadlock
public func transfer(to receiver: BankAccount, amount: Double) throws {
  lock.lock()
  receiver.lock.lock() // another thread can do the opposite
  // ...
}
```

If `accountA.transfer(to: accountB)` happens at the same time as `accountB.transfer(to: accountA)`, both threads get blocked.

### Solution: Lock Ordering

```swift
public func transfer(to receiver: BankAccount, amount: Double) throws {
  guard accountNumber != receiver.accountNumber else {
    throw Error.sameAccountTransfer
  }

  let shouldLockSelfFirst = accountNumber < receiver.accountNumber
  let firstLock = shouldLockSelfFirst ? lock : receiver.lock
  let secondLock = shouldLockSelfFirst ? receiver.lock : lock

  firstLock.lock()
  secondLock.lock()
  defer {
    secondLock.unlock()
    firstLock.unlock()
  }

  guard amount > 0 else { throw Error.invalidAmount }
  guard amount <= _balance else { throw Error.insufficientFunds }
  guard amount < 5000 else { throw Error.fraudAlert }

  _balance -= amount
  receiver._balance += amount
}
```

Ordering locks guarantees that all threads acquire them in the same order, eliminating the risk of circular deadlock.

---

### Advantages and Disadvantages of NSLock

✅ **Advantages:**

- Simple and fast.
- Full control over exclusion.

❌ **Disadvantages:**

- Easy to forget `unlock()`.
- Deadlocks possible with multiple locks.
- Code prone to human error.

---

## Solution 2: DispatchQueue

A serial queue executes tasks one by one, achieving exclusion without explicit locks.

```swift
public final class BankAccount {
  private var _balance: Double
  private let queue: DispatchQueue

  public init(owner: String, accountNumber: String, balance: Double) {
    self.owner = owner
    self.accountNumber = accountNumber
    self._balance = balance
    self.queue = DispatchQueue(
      label: "com.banksystem.account.\(accountNumber)",
      qos: .userInitiated
    )
  }

  public var balance: Double {
    queue.sync { _balance }
  }

  public func deposit(_ amount: Double) throws {
    try queue.sync {
      guard amount > 0 else { throw Error.invalidAmount }
      _balance += amount
    }
  }
}
```

### Quality of Service (QoS)

Using `.userInitiated` prioritizes tasks the user expects to see soon.

Other options: `.userInteractive`, `.utility`, `.background`.

💡 **Tip**: If you add work with a higher QoS than the queue's, the system can elevate the queue's QoS.

❌ **Never use `sync` on the main thread.**

### Transfers with Queues

```swift
public func transfer(to receiver: BankAccount, amount: Double) throws {
  guard accountNumber != receiver.accountNumber else {
    throw Error.sameAccountTransfer
  }

  let shouldLockSelfFirst = accountNumber < receiver.accountNumber
  let firstQueue = shouldLockSelfFirst ? queue : receiver.queue
  let secondQueue = shouldLockSelfFirst ? receiver.queue : queue

  try firstQueue.sync {
    try secondQueue.sync {
      guard amount > 0 else { throw Error.invalidAmount }
      guard amount <= _balance else { throw Error.insufficientFunds }
      guard amount < 5000 else { throw Error.fraudAlert }

      _balance -= amount
      receiver._balance += amount
    }
  }
}
```

💡 **Note**: Avoid `sync` on the same queue and maintain a consistent order when accessing multiple resources.

---

### Advantages and Disadvantages of DispatchQueue

✅ **Advantages:**

- More expressive than raw locks.
- QoS and labels for debugging.
- Avoids forgetting to unlock.

❌ **Disadvantages:**

- Can block if `sync` is used incorrectly.
- Deadlocks if there's no consistent order.
- Doesn't leverage Swift Concurrency.

🧩 **In scenarios with many reads and few writes, consider a concurrent queue with `.barrier` for better performance.**

---

## Solution 3: Actor (The Modern Solution)

Swift 5.5 introduced **Actors**, which automatically protect their mutable state.

```swift
public actor BankAccount {
  public let owner: String
  public let accountNumber: String
  private var _balance: Double

  public var balance: Double { _balance }

  public func deposit(_ amount: Double) throws {
    guard amount > 0 else { throw Error.invalidAmount }
    _balance += amount
  }

  public func withdraw(_ amount: Double) throws {
    guard amount > 0 else { throw Error.invalidAmount }
    guard amount <= _balance else { throw Error.insufficientFunds }
    guard amount < 5000 else { throw Error.fraudAlert }
    _balance -= amount
  }

  public func transfer(to receiver: BankAccount, amount: Double) async throws {
    guard accountNumber != receiver.accountNumber else {
      throw Error.sameAccountTransfer
    }

    guard amount > 0 else { throw Error.invalidAmount }
    guard amount <= _balance else { throw Error.insufficientFunds }
    guard amount < 5000 else { throw Error.fraudAlert }

    _balance -= amount
    try await receiver.deposit(amount)
  }
}
```

---

### What Does the Actor Do?

1. **Automatic isolation**: Only the actor accesses its mutable state.
2. **No explicit locks**: The runtime coordinates exclusion.
3. **Data races impossible**: The compiler prevents simultaneous access.
4. **Drastically reduced deadlocks**: No manual locks or queues.

⚠️ **Actors reduce the risk of classic deadlocks, but you still need to consider reentrancy**: if the actor does `await`, it can process other messages before resuming.

---

### Crossing Actor Boundaries

```swift
// From outside
try await account.deposit(100)
let currentBalance = await account.balance

// Inside the actor
func internalMethod() {
  print(_balance) // No await needed
}
```

Interactions with the actor from outside are asynchronous.

---

### Note on Reentrancy

Actors process one message at a time, but when suspending with `await`, they can handle other messages and then resume.

That's why you should revalidate any assumptions made before the `await`.

Typical example: multiple tasks calling the same method can duplicate operations if not cached.

```swift
public actor ImageLoader {
  private var cache: [UUID: Data] = [:]
  private var inFlight: [UUID: Task<Data, Error>] = [:]

  public func load(id: UUID) async throws -> Data {
    if let data = cache[id] { return data }
    if let task = inFlight[id] { return try await task.value }

    let task = Task {
      let (data, _) = try await URLSession.shared.data(from: buildURL(using: id))
      return data
    }
    inFlight[id] = task

    do {
      let data = try await task.value
      cache[id] = data
      return data
    } finally {
      inFlight[id] = nil
    }
  }
}
```

This pattern avoids concurrent duplicates.

---

### Tests with Actors

```swift
@Test func testDepositSuccess() async throws {
  let sut = makeSUT()
  try await sut.deposit(100)
  await #expect(sut.balance == 1100)
}

@Test func testConcurrentDeposits() async throws {
  let account = BankAccount(owner: "Test", accountNumber: "123", balance: 0)
  let iterations = 1000
  await withTaskGroup(of: Void.self) { group in
    for _ in 0..<iterations {
      group.addTask {
        try? await account.deposit(1)
      }
    }
  }
  await #expect(account.balance == 1000)
}
```

---

### Advantages and Disadvantages of Actors

✅ **Advantages:**

- Compiler-guaranteed safety.
- No manual locks or queues.
- Drastic reduction in concurrency errors.
- Cleaner and more maintainable code.
- Native integration with Swift Concurrency.

❌ **Disadvantages:**

- Requires `async/await` and modern OS versions.
- Small overhead.
- You need to understand reentrancy.

---

## Comparison of Approaches

| Aspect | NSLock | DispatchQueue | Actor |
|---------|--------|---------------|-------|
| **Safety** | Manual | Manual | Compiler |
| **Deadlock Risk** | High | High | Very low (no locks; watch for reentrancy) |
| **Complexity** | Medium | Medium | Low |
| **Performance** | Excellent | Very good | Very good |
| **Debugging** | Difficult | Medium | Easy |
| **Async Required** | No | No | Yes |
| **Swift-native** | No | Yes | Yes |
| **Future-proof** | No | Medium | Yes |

---

## Conclusions

The evolution of thread safety in Swift reflects the evolution of the language itself:

1. **NSLock**: The manual era of Objective-C.
2. **DispatchQueue**: The transition to GCD with fewer errors.
3. **Actor**: The modern era, safe by design.

### My Recommendation

- **New code** → use Actors.
- **Legacy apps** → use DispatchQueue serial.
- **Performance critical** → use NSLock or `os_unfair_lock` (with prior profiling).

### Key Learnings

1. **Thread safety is not optional**.
2. **Lock ordering prevents deadlocks**.
3. **The compiler is your best defense**.
4. **Async/await is not just for networking**.
5. **Concurrency tests are essential**.

---

## Resources

- [Swift Concurrency Documentation](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html)
- [WWDC21: Protect mutable state with Swift actors](https://developer.apple.com/videos/play/wwdc2021/10133/)
- [Swift Evolution: SE-0306 Actors](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.md)
- [Concurrency by Tutorials (Kodeco)](https://www.kodeco.com/books/concurrency-by-tutorials)
- [Practical Swift Concurrency – Donny Wals](https://www.donnywals.com/books/practical-swift-concurrency)
- [Complete code on GitHub](https://github.com/SwiftyJourney/bank-account-case-study)

---

If this article was helpful, share it! And don't forget to check out the complete code in the repository.
