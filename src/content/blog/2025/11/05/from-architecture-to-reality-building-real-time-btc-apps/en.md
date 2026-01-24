---
title: 'From Architecture to Reality: Building Real-Time BTC Price Apps'
description: 'Connecting all layers with Composition Root, ViewModels, and real apps. How macOS App Sandbox almost
killed our network calls, and why CLI apps get special privileges.'
pubDate: 'Nov 5 2025'
heroImage: './hero.png'
lang: 'en'
translationKey: 'architecture-to-reality'
slug: 'from-architecture-to-reality-building-real-time-btc-apps'
---

## Introduction

In the [previous article](../persistence-decisions-userdefaults-filemanager-swiftdata) we built a persistence layer with UserDefaults, benchmarked three solutions, and discovered SwiftData's Decimal precision bug.

Now we have:

- [x] Networking layer (Binance + CryptoCompare fallback)
- [x] Persistence layer (UserDefaults)
- [x] Domain use cases (fetch, persist, render)
- [x] All tested, all modular

But they're disconnected. We need to wire everything together and build actual apps.

The challenge: **Turn isolated modules into a real-time BTC price monitor.**

This article covers the final mile:

1. **Composition Root** - Wiring dependencies without coupling
2. **ViewModel** - Connecting use cases to SwiftUI with @Observable
3. **SwiftUI App** - Real-time UI with automatic updates
4. **CLI Tool** - Terminal app for developers
5. **The Sandbox Crisis** - How macOS security almost broke everything

The surprise: **Building the apps took 50 lines of code. Debugging the sandbox took 2 hours.**

By the end, you'll see why Composition Root matters, how @Observable simplifies state management, and why macOS apps need explicit network permissions while CLI tools don't.

---

## Step 1: The Composition Root - Dependency Injection Done Right

**Problem**: Our modules are isolated. How do we connect them without creating tight coupling?

**Wrong approach**:

```swift
// ❌ Don't do this - ViewModels shouldn't know infrastructure
class BTCPriceViewModel {
  let loader = BinancePriceLoader(session: .shared)  // Tight coupling
  let store = UserDefaultsPriceStore()               // Can't test
}
```

Clean Architecture principle: High-level modules shouldn't depend on low-level modules.

**Solution**: Composition Root pattern.

### What is Composition Root?

A single place where we:

1. Create all concrete implementations
2. Wire dependencies together
3. Inject them into use cases

Key insight: Composition happens once at app startup, not scattered throughout code.

### Creating BTCPriceComposer Module

```bash
btc-price/
├── BTCPriceCore/          # Domain (protocols, use cases)
├── BTCPriceNetworking/    # Infrastructure
├── BTCPricePersistence/   # Infrastructure
└── BTCPriceComposer/      # Composition Root (new)
```

### Why separate module?

- ✅ Centralizes dependency creation
- ✅ Apps import only composer, not individual infrastructure
- ✅ Makes dependency graph explicit
- ✅ Easy to swap implementations (tests, previews)

### Implementation: AppDependencies

```swift
// BTCPriceComposer/Sources/BTCPriceComposer/AppDependencies.swift
import BTCPriceCore
import BTCPriceNetworking
import BTCPricePersistence
import Foundation

public final class AppDependencies: Sendable {
  // Store
  public let priceStore: PriceStore

  // Loaders
  public let primaryLoader: PriceLoader
  public let fallbackLoader: PriceLoader

  // Use Cases
  public let fetchWithFallback: FetchWithFallback
  public let persistPrice: PersistLastValidPrice
  public let renderPrice: RenderPriceAndTimestamp

  public init(
    userDefaults: UserDefaults = .standard,
    urlSession: URLSession = .shared
  ) {
    // 1. Create infrastructure
    self.priceStore = UserDefaultsPriceStore(
      userDefaults: userDefaults,
      key: "btc_price_cache"
    )

    self.primaryLoader = BinancePriceLoader(session: urlSession)
    self.fallbackLoader = CryptoComparePriceLoader(session: urlSession)

    // 2. Wire use cases
    self.fetchWithFallback = FetchWithFallback(
      primary: primaryLoader,
      fallback: fallbackLoader
    )

    self.persistPrice = PersistLastValidPrice(store: priceStore)
    self.renderPrice = RenderPriceAndTimestamp(
      priceFormatter: USDPriceFormatter(),
      timestampFormatter: ISO8601TimestampFormatter()
    )
  }
}
```

### Design Decisions

**Why Sendable?**

- Swift 6 concurrency requirement
- Can be safely shared across tasks/actors

**Why inject UserDefaults and URLSession?**

- Testing: Can inject custom suite and mocked session
- Flexibility: Different configurations for production/debug

**Why expose both infrastructure and use cases?**

- Use cases: For app logic (ViewModel uses these)
- Infrastructure: For direct access if needed (rare)

**Why final class?**

- Not meant to be subclassed
- Composition over inheritance

### Dependency Graph

```plaintext
AppDependencies
├── priceStore: UserDefaultsPriceStore
│   └── UserDefaults
├── primaryLoader: BinancePriceLoader
│   └── URLSession
├── fallbackLoader: CryptoComparePriceLoader
│   └── URLSession
├── fetchWithFallback: FetchWithFallback
│   ├── primary: BinancePriceLoader
│   └── fallback: CryptoComparePriceLoader
├── persistPrice: PersistLastValidPrice
│   └── store: UserDefaultsPriceStore
└── renderPrice: RenderPriceAndTimestamp
    ├── priceFormatter: USDPriceFormatter
    └── timestampFormatter: ISO8601TimestampFormatter
```

Clean Architecture win: All dependencies point inward to domain.

---

## Step 2: The CLI Tool - Simplicity First

Before building the complex SwiftUI app, let's validate with a simple CLI tool.

Goal: Fetch BTC price every second, print to terminal.

### Implementation: main.swift

```swift
// BTCPrice-CLI/main.swift
import BTCPriceCore
import BTCPriceComposer
import Foundation

let deps = AppDependencies()

print("🚀 Starting BTC/USD Price Monitor")
print("📊 Updates every second. Press CTRL+C to stop.")
print("==========================================")
print("")

var updateCount = 0

while true {
  updateCount += 1

  do {
    // 1. Fetch price
    let quote = try await deps.fetchWithFallback.execute()

    // 2. Persist for offline support
    try await deps.persistPrice.execute(quote)

    // 3. Render formatted output
    let formatted = await deps.renderPrice.execute(quote)

    print("[\(updateCount)] 💰 \(formatted.priceText) | 🕓 \(formatted.timestampText)")

  } catch {
    // 4. Fallback to cache if network fails
    if let cached = await deps.persistPrice.loadCached() {
      let formatted = await deps.renderPrice.execute(cached)
      print("[\(updateCount)] 📦 [CACHED] \(formatted.priceText) | 🕓 \(formatted.timestampText)")
    } else {
      print("[\(updateCount)] ❌ Error: \(error)")
    }
  }

  // 5. Wait 1 second before next update
  try? await Task.sleep(for: .seconds(1))
}
```

### Key Features

1. Real dependencies: Uses AppDependencies() - no mocks
2. Error resilience: Falls back to cache when network fails
3. Continuous updates: Infinite loop with 1-second delay
4. Progress tracking: Shows update count
5. Graceful degradation: Shows cached data instead of crashing

### Running the CLI

```bash
$ swift run BTCPrice-CLI

🚀 Starting BTC/USD Price Monitor
📊 Updates every second. Press CTRL+C to stop.
==========================================

[1] 💰 $114,459.80 | 🕓 Oct 27, 2025 at 7:56:39 PM
[2] 💰 $114,461.23 | 🕓 Oct 27, 2025 at 7:56:40 PM
[3] 💰 $114,458.91 | 🕓 Oct 27, 2025 at 7:56:41 PM
...
```

It just works. No configuration, no entitlements, no sandbox issues.

(We'll discover why later - CLI tools have special privileges.)

---

## Step 3: The ViewModel - Connecting Use Cases to SwiftUI

Now the interesting part: building a reactive ViewModel for SwiftUI.

Requirements:

1. Fetch price every second automatically
2. Update UI when new data arrives
3. Show cached data when offline
4. Display loading/error states
5. Clean up resources when view disappears

### Challenge: State Management in Swift 6

**Old approach (pre-Swift 6):**

```swift
class BTCPriceViewModel: ObservableObject {
  @Published var priceText: String = "--"  // Manual @Published wrappers
  @Published var isLoading: Bool = false
}
```

**New approach (Swift 6):**

```swift
@Observable
final class BTCPriceViewModel {
  var priceText: String = "--"  // Automatic observation
  var isLoading: Bool = false
}
```

**@Observable benefits:**

- ✅ No @Published boilerplate
- ✅ Automatic observation of ALL properties
- ✅ Better performance (fine-grained updates)
- ✅ Cleaner syntax

### Implementation: BTCPriceViewModel

```swift
// BTCPriceApp/BTCPriceViewModel.swift
import BTCPriceCore
import BTCPriceComposer
import Foundation

@Observable
final class BTCPriceViewModel {
  // MARK: - Observable State
  var priceText: String = "--"
  var timestampText: String = "--"
  var isLoading: Bool = false
  var errorMessage: String?
  var isUsingCache: Bool = false

  // MARK: - Dependencies
  private let dependencies: AppDependencies
  private var updateTask: Task<Void, Never>?

  init(dependencies: AppDependencies = AppDependencies()) {
    self.dependencies = dependencies
  }

  // MARK: - Public API

  func startMonitoring() {
    guard updateTask == nil else { return }  // Prevent multiple tasks

    updateTask = Task {
      while !Task.isCancelled {
        await fetchPrice()
        try? await Task.sleep(for: .seconds(1))
      }
    }
  }

  func stopMonitoring() {
    updateTask?.cancel()
    updateTask = nil
  }

  func refresh() async {
    await fetchPrice()
  }

  // MARK: - Private Helpers

  private func fetchPrice() async {
    isLoading = true
    errorMessage = nil
    isUsingCache = false

    do {
      // 1. Fetch fresh price
      let quote = try await dependencies.fetchWithFallback.execute()

      // 2. Save to cache
      try await dependencies.persistPrice.execute(quote)

      // 3. Render formatted text
      let formatted = await dependencies.renderPrice.execute(quote)

      // 4. Update UI
      priceText = formatted.priceText
      timestampText = formatted.timestampText
      isLoading = false

    } catch {
      // 5. Fallback to cache
      if let cached = await dependencies.persistPrice.loadCached() {
        let formatted = await dependencies.renderPrice.execute(cached)
        priceText = formatted.priceText
        timestampText = formatted.timestampText
        isUsingCache = true
      } else {
        errorMessage = "Unable to load price"
      }

      isLoading = false
    }
  }
}
```

### Design Decisions

**Why Task instead of Timer?**

- Modern concurrency with async/await
- Easy cancellation (Task.cancel())
- Better resource management
- Works with actors naturally

**Why guard updateTask == nil?**

- Prevents duplicate tasks if startMonitoring() called twice
- Resource leak protection

**Why separate fetchPrice() method?**

- Single responsibility: one method = one fetch
- Reusable for manual refresh
- Easier to test (can call directly)

**Why isUsingCache flag?**

- UI can show "offline mode" indicator
- User knows data might be stale

**Why @Observable instead of @ObservableObject?**

- Less boilerplate (no @Published)
- Better performance (fine-grained observation)
- Modern Swift pattern (iOS 17+)

### Error Handling Strategy

```swift
// If network fails:
catch {
  // 1. Try cache first
  if let cached = await dependencies.persistPrice.loadCached() {
    // Show cached data with indicator
    isUsingCache = true
  } else {
    // 2. Only show error if no cache exists
    errorMessage = "Unable to load price"
  }
}
```

Graceful degradation: Always prefer showing stale data over error message.

---

## Step 4: The SwiftUI App - Minimal View Code

With ViewModel handling all logic, the view is trivial:

```swift
// BTCPriceApp/ContentView.swift
import SwiftUI

struct ContentView: View {
  @State private var viewModel = BTCPriceViewModel()

  var body: some View {
    Text(viewModel.priceText)
      .onAppear {
        viewModel.startMonitoring()
      }
      .onDisappear {
        viewModel.stopMonitoring()
      }
  }
}
```

That's it. 14 lines for a real-time updating app.

### Why So Simple?

- @State: Creates observable instance
- .onAppear: Starts monitoring when view appears
- .onDisappear: Stops monitoring when view disappears (resource cleanup)
- viewModel.priceText: Automatic UI updates when property changes

### The App Entry Point

```swift
// BTCPriceAppApp.swift
import SwiftUI

@main
struct BTCPriceAppApp: App {
  var body: some Scene {
    WindowGroup {
      ContentView()
    }
  }
}
```

Standard SwiftUI app structure. Nothing special needed.

---

## Step 5: The Sandbox Crisis - When Everything Breaks

Expected: Run app, see price updates.

Reality: App shows -- forever.

### The Console Output 🚨

```plaintext
networkd_settings_read_from_file Sandbox is preventing this process
from reading networkd settings file at
"/Library/Preferences/com.apple.networkd.plist", please add an exception.

nw_resolver_create_dns_service_locked [C1.1] 
DNSServiceCreateDelegateConnection failed: ServiceNotRunning(-65563)

Connection 1: failed to connect 10:-72000, reason -1

Task <...> HTTP load failed, 0/0 bytes (error code: -1003 [10:-72000])

Error Domain=NSURLErrorDomain Code=-1003 
"A server with the specified hostname could not be found."
```

Translation: macOS App Sandbox is blocking all network access.

### The Mystery: Why Does CLI Work But App Doesn't?

CLI tool: Works perfectly, fetches prices every second.
macOS app: Can't even resolve DNS.

**Investigation:**

```bash
# CLI runs without sandbox
$ swift run BTCPrice-CLI
✅ Works - fetches from api.binance.com

# macOS app runs WITH sandbox
$ open BTCPriceApp.app
❌ Fails - sandbox blocks network
```

### Understanding macOS App Sandbox

What is it?

- Security feature that restricts app capabilities
- Enabled by default for macOS apps distributed on App Store
- Prevents unauthorized access to:
  - Network
  - File system outside container
  - User data
  - System resources

Why doesn't CLI have sandbox?

- Command-line tools are not sandboxed by default
- They run with user's full permissions
- Not distributed through App Store

Key insight: Security vs convenience trade-off.

### The Solution: Network Entitlements

Entitlements = explicit permission declarations for sandboxed apps.

To fix network access:

1. Open Xcode
2. Select BTCPriceApp target (NOT CLI)
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability"
5. Add "App Sandbox" (if not already present)
6. Enable: ✅ Outgoing Connections (Client)

This creates an entitlements file:

```xml
<!-- BTCPriceApp.entitlements -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
"http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
</dict>
</plist>
```

### What This Does

- `com.apple.security.app-sandbox`: Enables sandbox
- `com.apple.security.network.client`: Allows outgoing network connections

Security note: Still restricted from:

- ❌ Incoming connections (server mode)
- ❌ Arbitrary file access
- ❌ Reading other apps' data

After adding entitlement:

```bash
# Rebuild and run
✅ App now fetches prices successfully
✅ DNS resolution works
✅ HTTPS connections succeed
```

### Debugging Tips We Learned

1. Check Console.app: macOS logs sandbox violations
2. Look for "Sandbox is preventing": Keyword for sandbox issues
3. Compare targets: If one works and another doesn't, check entitlements
4. Read error codes: -1003 = "Could not find server" often means DNS blocked

---

## Step 6: The Final UI - Beyond Plain Text

After fixing sandbox, we enhanced the UI:

```swift
struct ContentView: View {
  @State private var viewModel = BTCPriceViewModel()

  var body: some View {
    VStack(spacing: 24) {
      // Bitcoin Icon
      Image(systemName: "bitcoinsign.circle.fill")
        .font(.system(size: 60))
        .foregroundStyle(.orange)

      // Price
      VStack(spacing: 8) {
        Text(viewModel.priceText)
          .font(.system(size: 48, weight: .bold))
          .monospacedDigit()

        HStack {
          Image(systemName: "clock")
          Text(viewModel.timestampText)
        }
        .font(.subheadline)
        .foregroundStyle(.secondary)
      }

      // Live Updates Info
      GroupBox("Live Updates") {
        VStack(alignment: .leading, spacing: 12) {
          InfoRow(
            icon: "arrow.triangle.2.circlepath",
            label: "Update Frequency",
            value: "Every second"
          )

          InfoRow(
            icon: "network",
            label: "Data Source",
            value: "Binance API"
          )

          InfoRow(
            icon: "exclamationmark.triangle",
            label: "Fallback",
            value: "CryptoCompare"
          )

          InfoRow(
            icon: "archivebox",
            label: "Offline Support",
            value: "Cached locally"
          )
        }
      }
    }
    .padding()
    .frame(width: 400, height: 500)
    .onAppear { viewModel.startMonitoring() }
    .onDisappear { viewModel.stopMonitoring() }
  }
}

struct InfoRow: View {
  let icon: String
  let label: String
  let value: String

  var body: some View {
    HStack {
      Image(systemName: icon)
        .foregroundStyle(.blue)
        .frame(width: 20)

      VStack(alignment: .leading, spacing: 2) {
        Text(label)
          .font(.caption)
          .foregroundStyle(.secondary)
        Text(value)
          .font(.subheadline.weight(.medium))
      }

      Spacer()
    }
  }
}
```

Result: Professional-looking app with:

- Bitcoin icon
- Large price display with monospaced digits
- Timestamp
- Feature list (update frequency, data source, fallback, offline support)

---

## Real Development Challenges We Solved

### Challenge 1: "App Shows -- Forever, No Error Messages"

Problem: App launches but never updates price.

Symptoms:

- No obvious errors in Xcode console
- CLI works fine
- SwiftUI view appears normal

Investigation:

- Checked Console.app (macOS system logs)
- Found: "Sandbox is preventing network access"

Root cause: macOS App Sandbox blocks network by default.

Solution: Add com.apple.security.network.client entitlement.

Lesson: Check Console.app for sandbox violations. Xcode doesn't always show them.

### Challenge 2: "CLI and App Behave Differently"

Problem: Same code works in CLI, fails in app.

Why:

- CLI tools: Not sandboxed, full user permissions
- macOS apps: Sandboxed by default, restricted capabilities

Solution: Understand platform differences, configure appropriately.

Lesson: Don't assume all Swift executables have same capabilities.

### Challenge 3: "When to Use @Observable vs @ObservableObject"

Problem: SwiftUI has two observation patterns, which to use?

Decision:

- @Observable (iOS 17+): Modern, less boilerplate, better performance
- @ObservableObject (iOS 13+): Legacy, more compatible, requires @Published

Our choice: @Observable (targeting iOS 17+)

Lesson: Modern patterns are simpler, but check platform requirements.

### Challenge 4: "How to Stop Background Tasks on View Disappear"

Problem: ViewModel keeps fetching prices even when view is gone.

Symptoms:

- Memory leaks
- Unnecessary network calls
- Battery drain

Solution:

```swift
.onDisappear {
  viewModel.stopMonitoring()  // Cancel the Task
}
```

Lesson: Always clean up resources in .onDisappear.

---

## Architecture Insights

### Clean Architecture Payoff - Final Validation

Look at how dependencies flow:

```plaintext
BTCPriceApp (Presentation)
  ↓ imports
BTCPriceComposer (Composition Root)
  ↓ imports
BTCPriceCore (Domain + Use Cases)
  ↑ implemented by
BTCPriceNetworking (Infrastructure)
BTCPricePersistence (Infrastructure)
```

Key win: ViewModel only knows about:

- AppDependencies (composition root)
- Domain types (PriceQuote)
- Use case protocols

ViewModel does NOT know:

- ❌ Binance/CryptoCompare APIs
- ❌ UserDefaults
- ❌ JSON encoding/decoding
- ❌ URLSession

Result: We can swap implementations without touching ViewModel.

**Example: Switching to CoreData**

```swift
// In AppDependencies only
public init(...) {
  // self.priceStore = UserDefaultsPriceStore(...)  // Old
  self.priceStore = CoreDataPriceStore(...)         // New

  // Everything else unchanged
  // ViewModel doesn't need to know
}
```

Clean Architecture promise delivered: Infrastructure changes don't propagate to business logic.

### Composition Root Pattern - Why It Matters

**Before Composition Root:**

```swift
// ViewModel would need to know:
let session = URLSession.shared
let binance = BinancePriceLoader(session: session)
let crypto = CryptoComparePriceLoader(session: session)
let fetchUseCase = FetchWithFallback(primary: binance, fallback: crypto)
// ... repeat in every file
```

**With Composition Root:**

```swift
// ViewModel only needs:
let deps = AppDependencies()
```

Benefits:

1. Single source of truth for dependencies
2. Easy testing - inject test dependencies
3. Reusable across CLI, app, previews
4. Changes in one place - update AppDependencies, all consumers updated

**Example - SwiftUI Preview:**

```swift
#Preview {
  let testDeps = AppDependencies(
    userDefaults: .init(suiteName: "preview")!,
    urlSession: .mocked  // Hypothetical mock
  )
  let viewModel = BTCPriceViewModel(dependencies: testDeps)
  return ContentView(viewModel: viewModel)
}
```

### Modern Swift Patterns Applied

1. @Observable (Swift 6 / iOS 17+)
  - Replaces @Published boilerplate
  - Automatic observation of all properties
  - Better performance

2. Structured Concurrency
  - Task { } instead of DispatchQueue
  - Automatic cancellation with .cancel()
  - async/await throughout

3. Sendable Conformance
  - AppDependencies: Sendable
  - Safe sharing across concurrency domains
  - Compiler-enforced thread safety

4. Actor Isolation (in stores)
  - actor UserDefaultsPriceStore
  - Automatic thread safety
  - No manual locks needed

---

## Key Design Decisions We Made

### 1. Why Separate Composer Module?

Alternative: Put AppDependencies in app target.

Choice: Dedicated module for composition root.

Reasons:

- Reusable across CLI and App targets
- Makes dependency graph explicit
- Clear separation of concerns
- Easy to test in isolation

Trade-off: Extra module complexity vs code organization.

### 2. Why @Observable Instead of @ObservableObject?

Alternative: Use legacy @ObservableObject + @Published.

Choice: Modern @Observable macro.

Reasons:

- Less boilerplate (no @Published on every property)
- Better performance (fine-grained observation)
- Future-proof (SwiftUI direction)

Trade-off: iOS 17+ requirement vs better DX.

### 3. Why Task Instead of Timer?

Alternative: Timer.scheduledTimer(...) (old pattern).

Choice: Task with while loop + sleep.

Reasons:

- Works naturally with async/await
- Easy cancellation
- No retain cycles
- Cleaner code

Comparison:

```swift
// Old way
var timer: Timer?
timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
  Task { await fetchPrice() }  // Bridging async in sync
}

// New way
updateTask = Task {
  while !Task.isCancelled {
    await fetchPrice()         // Already async
    try? await Task.sleep(for: .seconds(1))
  }
}
```

### 4. Why Graceful Degradation Instead of Error Display?

Alternative: Show error message when network fails.

Choice: Fallback to cached data silently (with indicator).

Reasons:

- User experience: stale data > no data
- Offline scenarios common (airplane mode, tunnels)
- Reduce user anxiety

Implementation:

```swift
catch {
  if let cached = await dependencies.persistPrice.loadCached() {
    // Show cached with "offline" indicator
    isUsingCache = true
  } else {
    // Only show error if truly no data
    errorMessage = "Unable to load price"
  }
}
```

---

## Production-Ready Results

We now have two fully functional apps:

### CLI Tool

- ✅ Runs in terminal
- ✅ Updates every second
- ✅ Shows update count
- ✅ Formatted price + timestamp
- ✅ Offline fallback
- ✅ No configuration needed

### macOS App

- ✅ Real-time SwiftUI UI
- ✅ Automatic updates
- ✅ Bitcoin icon + formatted price
- ✅ Feature information display
- ✅ Offline support with indicator
- ✅ Proper resource cleanup

Both apps:

- Use same composition root
- Share all business logic
- Require zero duplication
- Tested infrastructure underneath

### Code Metrics

**Application Code:**

| Component | Lines of Code |
|-----------|---------------|
| AppDependencies | 49 LOC |
| BTCPriceViewModel | 76 LOC |
| ContentView (with styling) | ~60 LOC |
| CLI main.swift | 39 LOC |
| **Total app code** | **~224 LOC** |

**Infrastructure (already written):**

| Layer | Lines of Code |
|-------|---------------|
| Networking | ~150 LOC |
| Persistence | ~41 LOC |
| Use cases | ~120 LOC |
| Tests | ~500 LOC |
| **Total infrastructure** | **~811 LOC** |

**Result:** 224 lines of app code leveraging 800+ lines of tested foundation.

---

## What We Learned

1. Composition Root Centralizes Complexity

  Problem: Dependency creation scattered across codebase.

  Solution: Single AppDependencies class.

  Benefit: Change infrastructure in one place, all apps updated.

  Lesson: Complexity in one place > complexity everywhere.

2. Platform Differences Matter

  Discovery: CLI works, macOS app doesn't (same code).

  Reason: Sandbox restrictions differ.

  Solution: Understand platform security models.

  Lesson: Don't assume executables have same capabilities.

3. Sandbox Violations Aren't Always Obvious

  Problem: App fails silently, no errors in Xcode console.

  Discovery: Had to check Console.app (system logs).

  Lesson: Know your debugging tools. Xcode != complete picture.

4. Modern Swift Simplifies State Management

  Old: @ObservableObject + @Published + manual change tracking.

  New: @Observable + automatic observation.

  Result: 30% less code, same functionality.

  Lesson: Stay current with Swift evolution.

5. Graceful Degradation Beats Error Messages

  Choice: Show cached data instead of "Network Error".

  User impact: App feels reliable, not broken.

  Lesson: Offline-first thinking improves UX.

6. Clean Architecture Scales Effortlessly

  Reality check: Built CLI in 20 minutes, macOS app in 1 hour (ignoring sandbox debugging).

  Why so fast: Infrastructure already existed, just wired it up.

  Lesson: Upfront architecture cost pays off in implementation speed.

---
Conclusion

We started with isolated modules: networking, persistence, use cases.

Now we have two production apps:

- CLI tool for terminal users
- macOS app with real-time UI

The journey revealed:

1. Composition Root centralizes dependency creation, making everything testable and reusable
2. @Observable is simpler than @ObservableObject, but requires iOS 17+
3. macOS App Sandbox blocks network by default - needs explicit entitlement
4. CLI tools don't have sandbox restrictions (security trade-off)
5. Graceful degradation (show cache) beats error messages for UX

The architecture paid off:

- Same AppDependencies for CLI and App
- Zero business logic duplication
- 224 LOC for both apps combined
- All backed by 500+ lines of tests

Most surprising lesson: The sandbox issue took longer to debug than building the actual apps.

Security restrictions are invisible until you hit them. Always check Console.app, not just Xcode.

---

What's Next

The apps work, but we're not done:

1. iOS Support - Make it work on iPhone/iPad
2. SwiftUI Enhancements - Charts, historical data, price alerts
3. Testing the UI - ViewModel tests, snapshot tests
4. CI/CD - Automated builds and releases

The foundation is solid. Networking works. Persistence works. Apps work.

Time to polish and ship 🚀.

---

Appendix: Sandbox Entitlements Reference

Common entitlements for macOS apps:

| Entitlement                                       | Permission                              |
|---------------------------------------------------|-----------------------------------------|
| com.apple.security.network.client                 | Outgoing network connections            |
| com.apple.security.network.server                 | Incoming network connections            |
| com.apple.security.files.user-selected.read-only  | Read files user chose                   |
| com.apple.security.files.user-selected.read-write | Read/write files user chose             |
| com.apple.security.files.downloads.read-only      | Read Downloads folder                   |
| com.apple.security.app-sandbox                    | Enable sandbox (required for App Store) |

Our app only needs: network.client for fetching BTC prices.

Security principle: Request minimum necessary permissions.

---

## Resources

### Essential Developer Academy

The architecture patterns, testing methodologies, and clean code principles demonstrated in this article series are inspired by the teachings of **Caio Zullo** and **Mike Apostolakis** from Essential Developer.

If you want to dive deeper into iOS architecture, TDD, Clean Architecture, and become a complete senior iOS developer, check out their **iOS Lead Essentials** program:

👉 [iOS Lead Essentials Program](https://iosacademy.essentialdeveloper.com/p/ios-lead-essentials/)

The program covers:

- Clean Architecture and SOLID principles
- Test-Driven Development (TDD)
- Modular design and dependency injection
- Modern Swift patterns and best practices
- Real-world project development
- Code reviews and mentoring from senior developers

Thousands of developers worldwide have transformed their careers through this program, landing positions at top companies and significantly increasing their salaries.

### macOS App Sandbox Documentation

For more information about macOS App Sandbox and entitlements:

- [App Sandbox Design Guide](https://developer.apple.com/documentation/security/app_sandbox) - Official Apple documentation on App Sandbox
- [Entitlements Documentation](https://developer.apple.com/documentation/bundleresources/entitlements) - Complete list of available entitlements
- [App Sandbox In Depth](https://developer.apple.com/documentation/security/app_sandbox/app_sandbox_in_depth) - Deep dive into sandbox security model
- [Hardening Runtime](https://developer.apple.com/documentation/security/hardened_runtime) - Additional security features for macOS apps

### Related Articles in This Series

1. [From Requirements to Use Cases: Building a BTC Price App the Right Way](../from-requirements-to-use-cases-building-a-btc-price-app-the-right-way) - Converting requirements into clear use cases
2. [From Use Cases to Code: Building the Core with TDD](../from-use-cases-to-code-building-the-core-with-tdd) - Domain layer and use cases with TDD
3. [From Core to Reality: Infrastructure, URLSession, and Real-World API Challenges](../from-core-to-reality-infrastructure-urlsession-real-world-api-challenges) - Networking layer implementation
4. [Persistence Decisions: UserDefaults vs FileManager vs SwiftData](../persistence-decisions-userdefaults-filemanager-swiftdata) - Persistence layer comparison and implementation

---

## Final Thoughts

Building this BTC price app from scratch taught us more than just how to fetch prices and display them. We learned:

- How Clean Architecture makes code testable, maintainable, and scalable
- Why TDD isn't just about tests—it's about design
- How Composition Root simplifies dependency management
- Why platform differences (like sandbox restrictions) matter
- That debugging system-level issues requires the right tools (Console.app)

The journey from vague requirements to production-ready apps wasn't always smooth. We hit bugs, discovered platform quirks, and spent hours debugging sandbox issues. But each challenge reinforced the value of solid architecture and thorough testing.

If you're serious about becoming a complete senior iOS developer and want to learn these patterns from industry experts, I highly recommend checking out the **iOS Lead Essentials** program by Caio Zullo and Mike Apostolakis at Essential Developer. Their methodology and teaching approach have helped thousands of developers worldwide advance their careers.

The foundation we built—networking, persistence, use cases, and composition—is now ready to scale. Whether you're adding new features, supporting new platforms, or handling more complex requirements, the architecture will support you.

Keep building, keep learning, and remember: **good architecture pays off when you need it most** 🚀

---

*This article is part of a series on building production-ready iOS apps using Clean Architecture and TDD. The methodologies and patterns demonstrated are inspired by the teachings of Essential Developer Academy.*
