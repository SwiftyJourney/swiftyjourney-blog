---
title: 'Swift Refresh 2025 – Day 4 (Part 2): Modern Observation and Reactive UIKit'
description: 'A deep dive into the second part of Day 4: Observation as AsyncSequence, truly reactive UIKit with observable models, and typed notifications.'
pubDate: 'Jan 22 2026'
heroImage: './hero.png'
lang: 'en'
translationKey: 'swift-refresh-2025-day4-part2-observation-uikit-reactive'
slug: 'swift-refresh-2025-day-4-part-2-observation-uikit-reactive'
---

## Introduction

In the first part of Day 4, we saw how Swift 6 forces you to explicitly model memory and concurrency.

This second part connects those concepts with something equally important: **reactivity**.

Observation and UIKit are not presented as isolated topics.  
Apple connects them as parts of the same system.

> Reactivity is not automatic.  
> It's also not a hack.  
> It's a data model.

---

## 1. Observation in iOS 17: reactive, but manual

With `@Observable` and `withObservationTracking`, Apple introduces real reactivity.

But the initial pattern had friction:

- the observer fires once
- you have to manually re-subscribe
- `Sendable` closures
- explicit `MainActor` handling

It works, but it feels like a transition.

---

## 2. Observation in iOS 26: state as a stream

In iOS 26, `Observations` appears.

```swift
let updates = Observations { download.progress }

for await value in updates {
  print(value)
}
```

Now:

- `Observation` is an `AsyncSequence`
- no callbacks
- no re-subscriptions
- changes are transactional

Reactivity stops being a hack.  
Now it's a data model.

---

## 3. Diffable Data Sources: identity before animation

`DiffableDataSource` is not an animation API.

It's an identity API:

- `Hashable` defines what is the same element
- the snapshot defines the current state
- UIKit decides how to transition

This sets the stage for reactive UIKit.

---

## 4. Reactive UIKit: configurationUpdateHandler

In iOS 26, UIKit takes an important step.

Each cell can react to changes via:

```swift
cell.configurationUpdateHandler = { cell, state in
  var content = UIListContentConfiguration.subtitleCell()
  content.text = item.fullName
  content.secondaryText = item.email
  cell.contentConfiguration = content
}
```

This allows:

- reconfiguring without reapplying snapshots
- reacting to state changes
- connecting UIKit with Observation

UIKit stops being completely imperative.

---

## 5. The real problem: DTOs are not reactive

Here appears the conceptual clash:

- `struct Employee` is immutable
- doesn't emit changes
- cannot be observed

In SwiftUI you solved this by updating the entire array.

In UIKit Diffable, that doesn't scale well.

---

## 6. The solution: observable cell models

The correct pattern ends up being:

- DTO (`Employee`) → `struct`
- Cell model (`EmployeeCell`) → `@Observable class`

```swift
@Observable @MainActor
final class EmployeeCell {
  var firstName: String
  var lastName: String
}
```

Now:

- Diffable uses `EmployeeCell`
- changing properties triggers update
- the cell refreshes itself

This is truly reactive UIKit.

---

## 7. Typed notifications: goodbye Notification.Name

iOS 26 introduces typed notifications:

```swift
struct EmployeesDidUpdate: NotificationCenter.MainActorMessage {
  typealias Subject = EmployeeLogic
}
```

Advantages:

- type-safe
- explicit isolation
- no magic strings
- better lifecycle

---

## 8. ObservationToken: the detail that breaks everything

If you don't retain the `ObservationToken`:

- the observer is released
- the notification never arrives
- nothing works

Swift doesn't warn.  
The architecture fails silently.

Storing the token is mandatory.

---

## Conclusion

Swift no longer tries to protect you. It forces you to decide.

This second part of Day 4 makes something very clear:

- Reactivity is not automatic
- DTOs are not reactive on their own
- UIKit can be truly reactive if you design it that way

Swift gives you tools.  
But now it demands intention.

And although that's uncomfortable, it's what makes the entire system finally coherent.

---

*Notes taken during the Swift Developer Workshop 2025 ([Apple Coding Academy](https://acoding.academy/)) and reinterpreted from a practical, real-world perspective.*
