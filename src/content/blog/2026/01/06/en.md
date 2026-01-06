---
title: 'Swift Refresh 2025 – Day 3: Liquid Glass, animations, SwiftData, and Xcode as an agent'
description: 'A recap of Day 3 from Swift Refresh Workshop 2025: state, Liquid Glass, declarative animations, SwiftData, and the new role of Xcode as an agent.'
pubDate: 'Jan 06 2026'
heroImage: './hero.png'
lang: 'en'
translationKey: 'swift-refresh-2025-day3-liquid-glass-animations-swiftdata-xcode-ai'
slug: 'swift-refresh-2025-day-3-liquid-glass-animations-swiftdata-xcode-ai'
---

## Introduction

On Day 3 of the **Swift Refresh Workshop 2025**, Apple stops teaching isolated APIs and starts showing something much more interesting:  
**how all the pieces of the modern stack fit together**.

Declarative animations, Liquid Glass, SwiftData, strict concurrency, and Xcode as an active agent are not separate topics.  
They are different faces of the same idea: **state, identity, and ownership**.

In this article I am not going to list APIs.  
I will explain **what we actually learned** and *why Apple is pushing this model*.

---

## 1. Everything starts with state (not animations)

Before talking about Liquid Glass or SwiftData, the workshop makes one thing very clear:

> SwiftUI does not animate views.  
> SwiftUI animates **state transitions**.

A simple boolean like this:

```swift
@State private var expanded = false
```

does not “turn on” an animation.  
It describes a **new reality**.

When that state changes, SwiftUI:

- recalculates the view tree
- detects what changed
- decides what can be animated

### `if expanded` does not hide views

```swift
if expanded {
  SomeView()
}
```

This **creates and destroys views**.  
It is not the same as changing `.opacity`.

That is why inserting views dynamically can make the layout “jump.”  
It is not a bug: it is SwiftUI being honest.

---

## 2. Layout vs animation: the first reality check

When adding content above a button, we saw the button get pushed down:

```swift
VStack {
  if expanded { icons }
  Button("Options")
}
```

SwiftUI recalculates the container size.  
Result: the button moves.

### The workaround used in the workshop

```swift
.frame(height: 150, alignment: .bottom)
```

This is **not animation**.  
It is layout control.

We freeze the space so the button does not “drop.”

> In production, you would probably use `overlay` or `ZStack`.  
> Here the goal was to understand **why** it happens, not to hide it.

---

## 3. Animations in SwiftUI: the minimum needed

To animate state changes, you only need one of these two forms:

```swift
.animation(.spring, value: expanded)
```

or

```swift
withAnimation(.spring) {
  expanded.toggle()
}
```

SwiftUI will animate **everything that can be animated**:

- layout
- opacity
- scale
- glass effects

### Transitions

```swift
.transition(.scale.combined(with: .opacity))
```

Transitions only work when a view:

- enters
- or exits  
(usually using `if`)

---

## 4. Liquid Glass: not an effect, a system

Liquid Glass **is not just another visual modifier**.  
It is a system that combines:

- material
- identity
- interaction
- animation

### Basic glass

```swift
.glassEffect(.regular)
.glassEffect(.clear)
.glassEffect(.regular.tint(.green))
.glassEffect(.clear.interactive())
```

- `.regular` → visible glass  
- `.clear` → subtle glass  
- `.interactive()` → responds to input  
- `.tint` → colors the surface  

Applying it to an `HStack` creates **one single surface**.  
Applying it to each `Image` creates **individual chips**.

---

## 5. Visual identity: `@Namespace` and `glassEffectID`

```swift
@Namespace var namespace
```

`@Namespace` does not store data.  
It creates a **shared identity space**.

### Mental model

- Namespace = universe  
- ID = identity inside the universe  

```swift
.glassEffectID("icon", in: namespace)
.glassEffectTransition(.identity)
```

This allows glass to **morph** between states instead of disappearing and reappearing.

For it to work:

- same `id`
- same `namespace`
- the view must exist before and after the change

---

## 6. `glassEffectUnion`: one surface, many views

```swift
.glassEffectUnion(id: "g1", namespace: namespace)
```

This tells SwiftUI:

> “These surfaces are **one single piece of glass**.”

Visually:

- separate icons  
- turn into a continuous capsule  

### Important rule

> One `glassEffectUnion` = **one glass surface**

That is why:

- only **one tint** per union  
- if you mix colors, one wins and the others are ignored  

---

## 7. SwiftData: when the ViewModel is no longer mandatory

```swift
@Query private var employees: [Employee]
```

`@Query`:

- performs the fetch
- observes changes
- refreshes the UI automatically

In many CRUD screens, **this already fulfills the ViewModel role**.

### Optimization with `FetchDescriptor`

```swift
var fetch = FetchDescriptor<Employee>()
fetch.fetchLimit = 20
fetch.sortBy = [SortDescriptor(\.lastName), SortDescriptor(\.firstName)]
fetch.relationshipKeyPathsForPrefetching = [\.department, \.gender]
_employees = Query(fetch)
```

- `fetchLimit` → performance  
- `sortBy` → stable ordering  
- `prefetch` → avoids N+1 queries  

---

## 8. Relationships in SwiftData: the most common mistake

After switching to:

```swift
@Query private var departments: [Department]
```

and then using:

```swift
department.employees
```

nothing showed up.

The problem **was not the query**.  
It was the relationship.

### Always define the `inverse`

```swift
@Relationship(deleteRule: .deny, inverse: \Employee.department)
var employees: [Employee]
```

Without `inverse`, SwiftData cannot build the graph correctly.

---

## 9. `@ModelActor`: the real magic trick

SwiftData is **actor-aware**.

The `mainContext` lives on the `MainActor`.  
Using it for heavy operations is a common mistake.

### `@ModelActor`

A `@ModelActor`:

- has its own `ModelContext`
- executes serialized operations
- respects strict concurrency

This is the right place for:

- remote fetch
- upserts
- synchronization
- DTO merges

---

## 10. DTOs, Sendable, and the predicate error

```swift
employee.id == dto.id // ❌
```

SwiftData **does not allow navigating properties** inside a `#Predicate`.

The correct fix:

```swift
let id = dto.id
employee.id == id // ✅
```

### Mental rule

In `#Predicate`:

- the left side is the model  
- the right side must be a **plain value**  

---

## 11. Xcode Coding Intelligence: the IDE as an agent

Xcode 26 introduces a quiet but profound change.

Coding Intelligence:

- does not browse the internet  
- does not use external RAG  
- reasons **only about your project**  
- can apply changes and roll them back  

Claude works better here **by design**, not by hype:

- better reasoning with limited context  
- better reading of incomplete code  

Local models via LM Studio reinforce the idea:
> the IDE stops being a passive editor.

---

## 12. Final architecture of the day

```
SwiftUI View
  ↓ @Query (reactive reads)
SwiftData
  ↑
ViewModel (@Observable, actions)
  ↓
ModelActor (concurrent persistence)
  ↓
Repository (DTOs / Network)
```

Each layer has a clear responsibility.  
Each boundary respects concurrency.

---

## Conclusion

Day 3 is not about learning new APIs.  
It is about **understanding how Apple thinks about the modern stack**.

- State is in charge  
- Identity matters  
- The database is reactive  
- Concurrency is explicit  
- The IDE starts collaborating with you  

And when all of that lines up, SwiftUI stops feeling “magical”  
and starts feeling **coherent**.

---

*Notes taken during the Swift Developer Workshop 2025 (Apple Coding Academy: https://acoding.academy/) and reinterpreted from a practical, real-world perspective.*
