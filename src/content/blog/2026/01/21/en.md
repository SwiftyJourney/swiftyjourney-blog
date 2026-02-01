---
title: 'Swift Refresh 2025 – Day 4 (Part 1): Memory, Real Concurrency, and Synchronization'
description: 'A deep dive into the first part of Day 4: inline arrays, Span, real concurrency with actors, mutex, and atomics. Swift no longer protects, it demands intention.'
pubDate: 'Jan 21 2026'
heroImage: './hero.png'
lang: 'en'
translationKey: 'swift-refresh-2025-day4-part1-memory-concurrency-synchronization'
slug: 'swift-refresh-2025-day-4-part-1-memory-concurrency-synchronization'
tags: ['swift', 'concurrency']
---

## Introduction

Day 4 of the **Swift Refresh Workshop 2025** marks a clear turning point.

Until now, Swift had helped us to:

- write safer code
- avoid crashes
- handle concurrency "without thinking too much"

This day changes the narrative completely.

> It's no longer about *avoiding errors*,  
> but about **explicitly modeling who can access what, when, and under what rules**.

This first part focuses on **memory and real concurrency**: from inline arrays to the synchronization tools that Swift 6 puts at your disposal.

It's not about new APIs.  
It's about **ownership**, **boundaries**, and **time**.

---

## 1. Arrays, memory, and why the heap is no longer always enough

The workshop begins with something seemingly basic: **arrays**.

An `Array` in Swift:

- is a `struct`
- but its storage lives on the **heap**
- is dynamic
- does not guarantee memory contiguity

This implies flexibility, but also costs:

- less predictable access
- more expensive insertions and deletions
- worse cache locality

### Inline Arrays (Swift 6)

```swift
var inline: [20 of Int]
```

With Swift 6, a new type appears: **Inline Arrays**.

Characteristics:

- fixed size known at compile-time
- live on the stack
- contiguous memory
- extremely fast access

They don't replace `Array`.  
They're a tool when memory layout matters more than flexibility.

---

## 2. Span: performance without ownership

Inline Arrays don't conform to `Sequence`.  
This is intentional.

To iterate them, Swift introduces `Span`:

```swift
let values = inline.span
```

A `Span`:

- doesn't copy
- doesn't allocate memory
- provides direct access to the contiguous region

But it introduces a key rule:

> A `Span` cannot escape its scope.

This is Swift explicitly modeling memory lifetime, something you only saw before in C++ or Rust.

---

## 3. Legacy concurrency: the real problem is not GCD

We return to the classic `BankAccount` example.

Two threads:

- transfer money in opposite directions
- use the same logic
- produce different results on each run

The problem is not `DispatchQueue`.  
The problem is **shared mutable state without protection**.

Swift 6 now shows you clear warnings.  
Before, this only exploded in production.

---

## 4. Actors: safety without locks (but not transactions)

We rewrite the example using `actor`.

Result:

- no data races
- serialized access
- guaranteed safety

But an uncomfortable truth appears:

> An actor doesn't lock complete operations,  
> it locks individual accesses.

Each `await`:

- releases the actor
- allows reentrancy

This means that actors:

- guarantee mutual exclusion per access
- **do not guarantee atomicity of compound operations**

---

## 5. Mutex: when you really need atomicity (iOS 18+)

Here comes `Synchronization.Mutex`.

Unlike an actor:

- a mutex locks a complete critical section
- allows modeling compound operations safely
- enables `Sendable` without `@unchecked`

This pattern becomes relevant again, but now:

- explicit
- safe
- integrated into Swift's modern model

---

## 6. Atomics: the right tool for counters

Not everything needs locks.

For cases like:

- counters
- metrics
- statistics

Apple introduces `Atomic<T>`:

```swift
value.add(1, ordering: .relaxed)
value.load(ordering: .relaxed)
```

What matters here is not the API, but the decision:

Not all concurrency problems are solved the same way.

Choosing between:

- `actor`
- `mutex`
- `atomic`

is part of design, not a technical detail.

---

## Conclusion

Swift no longer tries to protect you. It forces you to decide.

This first part of Day 4 makes something very clear:

- Concurrency is not "fixed"
- Memory is not "optimized at the end"
- Each tool has its place

Swift gives you tools.  
But now it demands intention.

And although that's uncomfortable, it's what makes the entire system finally coherent.

---

*Notes taken during the Swift Developer Workshop 2025 ([Apple Coding Academy](https://acoding.academy/)) and reinterpreted from a practical, real-world perspective.*
