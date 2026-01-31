---
title: 'Thread Safety en Swift: De NSLock a Actors'
description: 'Explora tres enfoques para lograr thread safety en Swift: desde locks tradicionales (NSLock) hasta la solución moderna con Actors. Aprende sobre race conditions, deadlocks y cómo Swift Concurrency resuelve estos problemas de forma elegante.'
pubDate: 'Nov 11 2025'
heroImage: './hero.png'
lang: 'es'
translationKey: 'thread-safety-in-swift'
slug: 'thread-safety-en-swift-de-nslock-a-actors'
---

## Introducción

La concurrencia es uno de esos temas que parece simple hasta que te muerde. Cuando múltiples hilos acceden y modifican datos compartidos simultáneamente, pueden ocurrir **race conditions** que producen resultados impredecibles y bugs que aparecen una vez cada mil ejecuciones.

En este artículo, exploraremos tres enfoques para lograr thread safety en Swift, usando como caso de estudio una clase `BankAccount` que simula operaciones bancarias. Veremos cómo evolucionar desde locks tradicionales hasta la solución moderna con Swift Concurrency.

El código completo está disponible en el [repositorio de GitHub](https://github.com/SwiftyJourney/bank-account-case-study).

---

## El Caso de Estudio: BankAccount

Empecemos con una implementación básica:

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

Esta implementación funciona perfectamente… en un solo hilo. Pero cuando múltiples hilos intentan acceder a `balance` simultáneamente, todo se desmorona.

---

## El Problema: Race Conditions

```swift
let account = BankAccount(owner: "Juan", accountNumber: "123", balance: 1000)

DispatchQueue.global().async {
  try? account.deposit(100)
}

DispatchQueue.global().async {
  try? account.withdraw(50)
}
```

Ambas operaciones leen y modifican `balance` al mismo tiempo. Esto puede causar:

1. **Lecturas inconsistentes**: Un hilo lee `balance` mientras otro lo modifica.
2. **Pérdida de datos**: Dos depósitos simultáneos pueden sobrescribirse.
3. **Resultados impredecibles**: El balance final puede ser cualquier cosa.

Necesitamos sincronización.

---

## Solución 1: NSLock

El enfoque clásico usa `NSLock` para exclusión mutua. Solo un hilo puede adquirir el lock a la vez.

### Cambios Clave

1. Reemplazar `balance` por una variable privada `_balance`
2. Añadir un `NSLock`
3. Proteger las operaciones con `lock.lock()` y `defer { lock.unlock() }`

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

El `defer` asegura que el lock se libere aunque haya un `throw` o `return` temprano.

---

### El Problema del Deadlock en Transfers

```swift
// ❌ Puede causar deadlock
public func transfer(to receiver: BankAccount, amount: Double) throws {
  lock.lock()
  receiver.lock.lock() // otro hilo puede hacer lo opuesto
  // ...
}
```

Si `accountA.transfer(to: accountB)` ocurre al mismo tiempo que `accountB.transfer(to: accountA)`, ambos hilos se quedan bloqueados.

### Solución: Lock Ordering

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

Ordenar los locks garantiza que todos los hilos los adquieran en el mismo orden, eliminando el riesgo de deadlock circular.

---

### Ventajas y Desventajas de NSLock

✅ **Ventajas:**

- Sencillo y rápido.
- Control total sobre exclusión.

❌ **Desventajas:**

- Fácil olvidar `unlock()`.
- Deadlocks posibles con múltiples locks.
- Código propenso a errores humanos.

---

## Solución 2: DispatchQueue

Una serial queue ejecuta las tareas una por una, logrando exclusión sin locks explícitos.

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

Usar `.userInitiated` prioriza tareas que el usuario espera ver pronto.

Otras opciones: `.userInteractive`, `.utility`, `.background`.

💡 **Tip**: Si agregas trabajo con un QoS mayor que el de la cola, el sistema puede elevar el QoS de la cola.

❌ **Nunca uses `sync` en el main thread.**

### Transfers con Queues

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

💡 **Nota**: Evita `sync` en la misma cola y conserva un orden consistente al acceder múltiples recursos.

---

### Ventajas y Desventajas de DispatchQueue

✅ **Ventajas:**

- Más expresiva que locks crudos.
- QoS y labels para debugging.
- Evita olvidos de unlock.

❌ **Desventajas:**

- Puede bloquear si se usa `sync` incorrectamente.
- Deadlocks si no hay orden consistente.
- No aprovecha Swift Concurrency.

🧩 **En escenarios con muchas lecturas y pocas escrituras, considera una concurrent queue con `.barrier` para mayor rendimiento.**

---

## Solución 3: Actor (La Solución Moderna)

Swift 5.5 introdujo **Actors**, que protegen su estado mutable automáticamente.

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

### ¿Qué hace el Actor?

1. **Aislamiento automático**: Solo el actor accede a su estado mutable.
2. **Sin locks explícitos**: El runtime coordina la exclusión.
3. **Data races imposibles**: El compilador evita accesos simultáneos.
4. **Deadlocks drásticamente reducidos**: No hay locks ni colas manuales.

⚠️ **Los actors reducen el riesgo de deadlocks clásicos, pero aún debes considerar reentrancia**: si el actor hace `await`, puede procesar otros mensajes antes de reanudar.

---

### Crossing Actor Boundaries

```swift
// Desde fuera
try await account.deposit(100)
let currentBalance = await account.balance

// Dentro del actor
func internalMethod() {
  print(_balance) // No await necesario
}
```

Las interacciones con el actor desde fuera son asíncronas.

---

### Nota sobre Reentrancia

Los actors procesan un mensaje a la vez, pero al suspender con `await`, pueden atender otros mensajes y luego reanudar.

Por eso, revalida cualquier suposición hecha antes del `await`.

Ejemplo típico: múltiples tareas llamando al mismo método pueden duplicar operaciones si no se cachean.

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

Este patrón evita duplicados concurrentes.

---

### Tests con Actors

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

### Ventajas y Desventajas de Actors

✅ **Ventajas:**

- Seguridad garantizada por el compilador.
- Sin locks ni colas manuales.
- Reducción drástica de errores de concurrencia.
- Código más limpio y mantenible.
- Integración nativa con Swift Concurrency.

❌ **Desventajas:**

- Requiere `async/await` y versiones modernas de OS.
- Pequeña sobrecarga.
- Necesitas entender reentrancia.

---

## Comparación de Enfoques

| Aspecto | NSLock | DispatchQueue | Actor |
|---------|--------|---------------|-------|
| **Seguridad** | Manual | Manual | Compilador |
| **Deadlock Risk** | Alto | Alto | Muy bajo (sin locks; cuida reentrancia) |
| **Complejidad** | Media | Media | Baja |
| **Performance** | Excelente | Muy bueno | Muy bueno |
| **Debugging** | Difícil | Medio | Fácil |
| **Async Required** | No | No | Sí |
| **Swift-native** | No | Sí | Sí |
| **Futuro-proof** | No | Medio | Sí |

---

## Conclusiones

La evolución de thread safety en Swift refleja la evolución del lenguaje:

1. **NSLock**: La era manual de Objective-C.
2. **DispatchQueue**: La transición a GCD con menos errores.
3. **Actor**: La era moderna, segura por diseño.

### Mi Recomendación

- **Código nuevo** → usa Actors.
- **Legacy apps** → usa DispatchQueue serial.
- **Performance crítico** → usa NSLock o `os_unfair_lock` (con perfilado previo).

### Aprendizajes Clave

1. **Thread safety no es opcional**.
2. **Lock ordering evita deadlocks**.
3. **El compilador es tu mejor defensa**.
4. **Async/await no es solo para networking**.
5. **Los tests de concurrencia son esenciales**.

---

## Recursos

- [Swift Concurrency Documentation](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html)
- [WWDC21: Protect mutable state with Swift actors](https://developer.apple.com/videos/play/wwdc2021/10133/)
- [Swift Evolution: SE-0306 Actors](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.md)
- [Concurrency by Tutorials (Kodeco)](https://www.kodeco.com/books/concurrency-by-tutorials)
- [Practical Swift Concurrency – Donny Wals](https://www.donnywals.com/books/practical-swift-concurrency)
- [Código completo en GitHub](https://github.com/SwiftyJourney/bank-account-case-study)

---

Si este artículo te fue útil, ¡compártelo! Y no olvides revisar el código completo en el repositorio.
