---
title: 'Swift Refresh 2025 – Day 1: Concurrency in Swift 6.2 (Without Unnecessary Pain)'
description: 'An honest recap of Swift 6.2 strict concurrency: actors, @MainActor, Sendable, and how to migrate without suffering in real-world projects.'
pubDate: 'Dec 16 2025'
heroImage: './hero.png'
lang: 'en'
translationKey: 'swift-refresh-2025-day1-concurrency'
slug: 'swift-refresh-2025-day-1-concurrency-with-swift-6-2'
---

## Introduction

Swift 6 did not come to make our lives harder.  
It came to tell us the truth.

Day 1 of the **Swift Refresh Workshop 2025** was not a firehose of new APIs or a list of changes to memorize.  
It was something much more important: **a mindset shift**.

Swift 6.2 redefines how we write concurrent code, but more importantly, **how we think about safety, ownership, and design**.

If you felt “this used to work before”, you’re not alone.  
The difference is that it worked… **until it didn’t**.

---

## The problem Swift 6 wants to eliminate

For years, on iOS we lived with an uncomfortable reality:

- Concurrent code that looked “apparently” correct  
- Intermittent bugs  
- Crashes that were impossible to reproduce  
- Silent race conditions

Classic example:

```swift
var counter = 0

DispatchQueue.global().async {
    counter += 1
}
```

This has **always been incorrect**. It’s a textbook data race.  
Swift 5 allowed it without complaining. Swift 6, in strict concurrency mode, **flags it** (and may refuse to compile it depending on your settings).

👉 The novelty is not “more concurrency”.  
**The novelty is the compiler’s honesty.**

---

## Strict Concurrency: what actually changes

Swift 6.2 introduces what Apple calls **Strict Concurrency**.

Translated to human:

> “If I can’t guarantee this access is safe, I’ll tell you.  
> If you enable strict mode, I won’t compile.”

In practice, you get a **progressive migration path**:

- You can start with **warnings** for legacy code.  
- You can tighten things up until certain unsafe patterns become **compile-time errors**.  

Now, every piece of data has to fit (at least) one of these ideas:

- Be **immutable**  
- Be **isolated by an actor**  
- Live in a clear context (`@MainActor` or another global actor)  
- Be explicitly **`Sendable`** if it crosses concurrency boundaries

If not… **error (or at least a very insistent warning).**

It’s not punishment.  
It’s **prevention**.

---

## `@MainActor`: not a thread, a contract

`@MainActor` is one of the most misunderstood (and most important) concepts in Swift 6.

```swift
@MainActor
final class ViewModel {
    var title: String = ""
}
```

This does not just mean “this runs on the main thread”.  
It means something much more useful:

> “This state can only be touched from the main context.”

Swift now:

- **Protects your UI**  
- **Protects your ViewModels**  
- Warns you if you access this state from another context without hopping to the main actor (`await MainActor.run { ... }`)

Before, it trusted you.  
Now, it **protects you from yourself**.

---

## Actors: the safe box for your data

An `actor` is the modern, safe way to manage **shared mutable state**.

Simple mental model:

> An actor is a room where only one person can enter at a time.

```swift
actor Counter {
    private var value = 0

    func increment() {
        value += 1
    }

    func getValue() -> Int {
        value
    }
}
```

No locks.  
No manual queues.  
No black magic.

👉 If some data is **mutable and shared**, it probably belongs in an **actor**.

---

## Global actors: architecture, not just concurrency

Sometimes you need something like `@MainActor`, but scoped to your **domain**:

- Persistence  
- Networking  
- SwiftData  
- Caching  

That’s where **global actors** come in.

Typical definition:

```swift
@globalActor
struct DatabaseActor {
    static let shared = DatabaseActorImpl()
}

actor DatabaseActorImpl {
    // Database state and operations
}
```

And then:

```swift
@DatabaseActor
func saveUser() {
    // Safe implementation around DatabaseActorImpl
}
```

This doesn’t just give you concurrency safety.  
It gives you **structure**:

- Forces you to decide **where** logic lives.  
- Makes it obvious **from where** critical resources are accessed.

---

## Approachable Concurrency: the human side of Swift 6

Swift 6 is strict, and Apple knows it.

The idea of **Approachable Concurrency** doesn’t change the rules, but it does change the experience:

- Better compiler messages  
- A **progressive** migration path from Swift 5.x  
- Less frustration in large codebases  
- A model that is **teachable** (and explainable to your team)

It’s Swift saying:

> “I won’t let you get away with mistakes…  
> but I’ll explain **why**.”

---

## The recurring villain: `Sendable`

Many Day 1 errors share the same message:

> `Type X does not conform to Sendable`

Real translation:

> “I can’t guarantee this data will be safe when it crosses concurrency boundaries.”

Important details in 2025:

- Simple **value types** (structs, enums without tricks) are often `Sendable` automatically.  
- The pain shows up with:
  - Classes holding shared mutable state  
  - Closures capturing `self`  
  - Older APIs without concurrency annotations

And no, slapping `Sendable` on something “to silence the error” is not the solution.

Swift 6 doesn’t want you to lie to it.  
It wants you to **design your data model better**.

---

## Legacy APIs: when the past catches up

Typical example:

```swift
NotificationCenter.default.addObserver(
    forName: .someEvent,
    object: nil,
    queue: nil
) { [weak self] _ in
    self?.value += 1
}
```

Why does this start to hurt now?

- There is **no thread guarantee** in that legacy API  
- The closure captures `self`  
- `self` may not be concurrency-safe

Before: “trust me, it’s fine”.  
Now: “**prove it**”.

Swift forces you to decide:

- Should this state live inside an `actor`?  
- Should part of this logic move to `@MainActor`?  
- Should I redesign this notification API to make it safe?

---

## Migrating to Swift 6 without suffering

The lesson from Day 1 is clear:

- Swift 6 doesn’t “break” your code for sport  
- It **exposes incorrect assumptions** that were already there  
- It pushes you to clean up **concurrency technical debt**

The right mental order:

1. **Who owns this piece of data?**  
2. **From where is it accessed?**  
3. **Does it need to live inside an `actor`?**  
4. **Should it be protected by `@MainActor` or another global actor?**  
5. **Will it cross concurrency boundaries? (threads, tasks, queues)**  

Answering these questions honestly avoids **90% of migration errors**.

---

## Clean Architecture + Swift 6 = perfect match

Swift 6 naturally favors:

- Clear layers (UI, domain, data)  
- Explicit dependencies  
- ViewModels protected with `@MainActor`  
- Use cases and repositories isolated (often with dedicated actors)  
- A domain that **does not depend** on infrastructure details

In 2025, with SwiftData, macros, and more mature tooling, this is no longer just an academic “best practice”.

It’s literally **the path of least resistance** enforced by the compiler.

---

## Conclusion: the real message from Day 1

Day 1 of Swift Refresh 2025 was not about learning “new concurrency”.  
It was about accepting an uncomfortable truth:

> Swift 6 is not making your life harder.  
> It is forcing you to write the code you **should have written all along**.

It costs a bit more effort up front.  
But you get:

- Fewer concurrency bugs  
- Fewer impossible-to-reproduce crashes  
- Fewer late nights chasing race conditions  
- Much more confidence in your production code

And for real-world projects in 2025…  
that is worth far more than saving **two lines of code**.


