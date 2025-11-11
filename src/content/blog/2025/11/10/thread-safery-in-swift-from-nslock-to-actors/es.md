---
title: 'Thread Safety en Swift: De NSLock a Actors'
description: 'Explora tres enfoques para lograr thread safety en Swift: desde locks tradicionales (NSLock) hasta la solución moderna con Actors. Aprende sobre race conditions, deadlocks y cómo Swift Concurrency resuelve estos problemas de forma elegante.'
pubDate: 'Nov 10 2025'
heroImage: './hero.png'
lang: 'es'
translationKey: 'thread-safety-in-swift'
slug: 'thread-safety-en-swift-de-nslock-a-actors'
---

## Introducción

La concurrencia es uno de esos temas que parece simple hasta que te muerde. Cuando múltiples hilos acceden y modifican datos compartidos simultáneamente, pueden ocurrir **race conditions** que producen resultados impredecibles y bugs que aparecen una vez cada mil ejecuciones. 

En este artículo, vamos a explorar tres enfoques diferentes para lograr thread safety en Swift, usando como caso de estudio una clase `BankAccount` que simula operaciones bancarias. Veremos cómo evolucionar desde locks tradicionales hasta la solución moderna con Swift Concurrency.

El código completo está disponible en el [repositorio de GitHub](tu-repo-aqui).

## El Caso de Estudio: BankAccount

Empecemos con una implementación básica de una cuenta bancaria:

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

Esta implementación funciona perfectamente... **en un solo hilo**. Pero cuando múltiples hilos intentan acceder a `balance` simultáneamente, todo se desmorona.

## El Problema: Race Conditions

Imagina este escenario:

```swift
let account = BankAccount(owner: "Juan", accountNumber: "123", balance: 1000)

// Thread 1
DispatchQueue.global().async {
  try? account.deposit(100)
}

// Thread 2
DispatchQueue.global().async {
  try? account.withdraw(50)
}
```

Ambas operaciones leen y modifican `balance` al mismo tiempo. Esto puede causar:

1. **Lecturas inconsistentes**: Un hilo lee `balance` mientras otro lo está modificando
2. **Pérdida de datos**: Dos depósitos simultáneos podrían resultar en que solo uno se registre
3. **Resultados impredecibles**: El balance final puede ser cualquier cosa

Este es un **race condition** clásico. Necesitamos sincronización.

---

## Solución 1: NSLock

La forma más tradicional de proteger datos compartidos es usar un lock (cerrojo). `NSLock` proporciona exclusión mutua: solo un hilo puede adquirir el lock a la vez.

### Cambios Clave

Los cambios principales son:

1. Cambiar `balance` de `public private(set) var` a `private var _balance`
2. Agregar un `NSLock` privado
3. Proteger todas las operaciones con `lock.lock()` y `defer { lock.unlock() }`

```swift
public final class BankAccount {
  // ... propiedades inmutables iguales ...
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

**Patrón clave**: `defer { lock.unlock() }` garantiza que el lock se libere incluso si hay un `throw` o `return` temprano.

### El Problema del Deadlock en Transfers

El método `transfer` es particularmente peligroso porque necesita adquirir **dos locks** (del remitente y del receptor):

```swift
// ❌ PELIGRO: Puede causar deadlock
public func transfer(to receiver: BankAccount, amount: Double) throws {
  lock.lock()
  receiver.lock.lock()  // Si otro thread hace lo opuesto, deadlock
  // ...
}
```

Si el Thread 1 hace `accountA.transfer(to: accountB)` y el Thread 2 hace `accountB.transfer(to: accountA)` simultáneamente:

- Thread 1 adquiere lock de A, espera lock de B
- Thread 2 adquiere lock de B, espera lock de A
- **Deadlock**: ambos hilos se quedan esperando indefinidamente

### Solución: Lock Ordering

Para prevenir deadlocks, siempre adquirimos los locks en el mismo orden:

```swift
public func transfer(to receiver: BankAccount, amount: Double) throws {
  guard accountNumber != receiver.accountNumber else {
    throw Error.sameAccountTransfer
  }

  // Prevenir deadlock ordenando los locks consistentemente
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

**Insight**: Ordenar por `accountNumber` garantiza que todos los threads adquieran locks en el mismo orden, eliminando la posibilidad de deadlock circular.

### Ventajas y Desventajas de NSLock

✅ **Ventajas:**

- API simple y directa
- Sincrónico - no requiere `async/await`
- Familiar para desarrolladores con experiencia en threading
- Buen rendimiento

❌ **Desventajas:**

- Fácil cometer errores (olvidar unlock, deadlocks)
- Requiere disciplina manual para lock ordering
- Acceso a `lock` privado en transfers requiere diseño cuidadoso
- No aprovecha las capacidades modernas de Swift

---

## Solución 2: DispatchQueue

Otra forma de lograr serialización es usando una **serial queue** de GCD. Una serial queue garantiza que las tareas se ejecuten una a la vez, en orden.

### Implementación con DispatchQueue

En lugar de un `NSLock`, usamos una `DispatchQueue` serial:

```swift
public final class BankAccount {
  // ... propiedades inmutables iguales ...
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

  // withdraw similar...
}
```

### Quality of Service (QoS)

Al crear la queue, especificamos `.userInitiated` como QoS. Esto le dice al sistema que estas operaciones son importantes y el usuario está esperando el resultado.

Otras opciones de QoS:

- `.userInteractive`: Para UI y animaciones (máxima prioridad)
- `.userInitiated`: Para tareas iniciadas por el usuario que esperan respuesta
- `.utility`: Para tareas largas con progreso visible (descargas, importaciones)
- `.background`: Para mantenimiento y tareas que el usuario no ve

### Labels para Debugging

El label `"com.banksystem.account.\(accountNumber)"` es crucial para debugging. Cuando investigas problemas de concurrencia en Instruments o en crash logs, estos labels te ayudan a identificar qué queue está involucrada.

### Transfers con Queues

Similar a NSLock, necesitamos prevenir deadlocks con el mismo patrón de ordenamiento:

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

**Mismo problema, misma solución**: El ordenamiento de queues sigue siendo necesario para evitar deadlocks.

### Ventajas y Desventajas de DispatchQueue

✅ **Ventajas:**

- Más expresiva que locks crudos
- QoS integrado para priorización
- Labels para debugging
- Integración con el ecosistema de GCD
- Sincrónico

❌ **Desventajas:**

- Peligro de deadlock con `sync` anidado
- Mismo problema de lock ordering
- Puede causar thread explosion si no se usa correctamente
- No aprovecha Swift Concurrency

---

## Solución 3: Actor (La Solución Moderna)

Swift 5.5 introdujo **Actors** como parte de Swift Concurrency. Un actor es un tipo de referencia que protege automáticamente su estado mutable del acceso concurrente.

### Implementación con Actor

El cambio más importante es cambiar `class` por `actor`:

```swift
public actor BankAccount {
  public let owner: String
  public let accountNumber: String
  private var _balance: Double

  public var balance: Double {
    _balance
  }

  // init igual...

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

**Observa**: No hay locks, no hay queues, no hay ordenamiento manual. El compilador y el runtime de Swift manejan todo.

### ¿Qué hace el Actor?

1. **Aislamiento automático**: El compilador garantiza que el estado mutable solo se acceda desde dentro del actor
2. **Sin locks explícitos**: No más `lock.lock()` o `queue.sync`
3. **Sin deadlocks**: El runtime de Swift maneja la sincronización
4. **Data races imposibles**: El compilador previene acceso concurrente

### Crossing Actor Boundaries

Cuando llamas a un método de un actor desde fuera, cruzas un **actor boundary**:

```swift
// Desde fuera del actor, necesitas await
let balance = await account.balance
try await account.deposit(100)

// Dentro del actor, no necesitas await
public func internalMethod() {
  let currentBalance = _balance  // No await necesario
  print(currentBalance)
}
```

### El Transfer es Limpio

Observa que `transfer` no necesita lock ordering:

```swift
public func transfer(to receiver: BankAccount, amount: Double) async throws {
  // Validaciones en nuestro actor
  guard amount > 0 else { throw Error.invalidAmount }
  guard amount <= _balance else { throw Error.insufficientFunds }

  // Modificamos nuestro estado
  _balance -= amount

  // Cruzamos al actor del receiver (await automático)
  try await receiver.deposit(amount)
}
```

Swift maneja la coordinación entre actors. El método es `async` porque cruza un actor boundary, pero **no hay riesgo de deadlock**. El runtime de Swift previene deadlocks automáticamente.

### Actualizando los Tests

Los tests necesitan actualizarse porque los actors requieren `await`:

**Antes (con NSLock o Queue):**

```swift
@Test func testDepositSuccess() throws {
  let sut = makeSUT()
  try sut.deposit(100)
  #expect(sut.balance == 1100)
}
```

**Después (con Actor):**

```swift
@Test func testDepositSuccess() async throws {
  let sut = makeSUT()
  try await sut.deposit(100)
  await #expect(sut.balance == 1100)
}
```

Todos los métodos de test se vuelven `async`, y todos los accesos al actor requieren `await`.

### Ventajas y Desventajas de Actors

✅ **Ventajas:**

- **Seguridad garantizada por el compilador**: Data races imposibles
- **Sin deadlocks**: El runtime maneja la coordinación
- **Código más limpio**: Sin locks explícitos
- **Mejor mantenibilidad**: Difícil cometer errores
- **El futuro de Swift**: Integración nativa con el lenguaje
- **Reentrancy**: Los actors pueden suspenderse y reanudar trabajo de forma segura

❌ **Desventajas:**

- **Todo es async**: Requiere refactorizar código existente
- **Curva de aprendizaje**: Necesitas entender async/await y actors
- **iOS 13+ / macOS 10.15+**: Requiere versiones modernas del OS
- **Performance overhead**: Ligera sobrecarga vs locks crudos (raramente significativo)

---

## Comparación de Enfoques

| Aspecto | NSLock | DispatchQueue | Actor |
|---------|--------|---------------|-------|
| **Seguridad** | Manual | Manual | Compilador |
| **Deadlock Risk** | Alto | Alto | Ninguno |
| **Complejidad** | Media | Media | Baja |
| **Performance** | Excelente | Muy bueno | Muy bueno |
| **Debugging** | Difícil | Medio | Fácil |
| **Async Required** | No | No | Sí |
| **Swift-native** | No | Sí | Sí |
| **Futuro-proof** | No | Medio | Sí |

---

## Testing de Concurrencia

Para verificar que nuestras implementaciones son thread-safe, necesitamos tests que generen contención real:

```swift
@Test func testConcurrentDeposits() async throws {
  let account = BankAccount(owner: "Test", accountNumber: "123", balance: 0)
  let iterations = 1000
  let depositAmount = 1.0

  await withTaskGroup(of: Void.self) { group in
    for _ in 0..<iterations {
      group.addTask {
        try? await account.deposit(depositAmount)
      }
    }
  }

  let expectedBalance = Double(iterations) * depositAmount
  await #expect(account.balance == expectedBalance)
}
```

Este test crea 1000 tareas concurrentes depositando $1 cada una. Si hay race conditions, el balance final será incorrecto.

### Test de Deadlock

Para verificar que no hay deadlocks en transfers:

```swift
@Test func testConcurrentTransfersBetweenTwoAccounts() async throws {
  let account1 = BankAccount(owner: "A", accountNumber: "111", balance: 10000)
  let account2 = BankAccount(owner: "B", accountNumber: "222", balance: 10000)
  let iterations = 50
  let transferAmount = 10.0

  await withTaskGroup(of: Void.self) { group in
    // Thread 1: A -> B
    group.addTask {
      for _ in 0..<iterations {
        try? await account1.transfer(to: account2, amount: transferAmount)
      }
    }

    // Thread 2: B -> A
    group.addTask {
      for _ in 0..<iterations {
        try? await account2.transfer(to: account1, amount: transferAmount)
      }
    }
  }

  // El dinero total debe conservarse
  let totalBalance = await account1.balance + account2.balance
  #expect(totalBalance == 20000)
}
```

Este test crea el escenario perfecto para deadlock: transfers circulares. Con actors, funciona perfectamente. Con NSLock o queues mal implementadas, se congelaría.

---

## Conclusiones

La evolución de thread safety en Swift refleja la evolución del lenguaje mismo:

1. **NSLock**: La solución Objective-C. Funciona, pero requiere disciplina extrema.
2. **DispatchQueue**: La solución Swift pre-Concurrency. Mejor que locks crudos, pero aún manual.
3. **Actor**: La solución moderna de Swift. Segura por diseño, natural con el lenguaje.

### Mi Recomendación

- **Para código nuevo**: Usa **Actors**. Son el futuro de Swift y eliminan clases enteras de bugs.
- **Para código legacy con restricciones de OS**: Usa **DispatchQueue** con serial queues. Más mantenible que locks.
- **Para máxima performance en casos específicos**: Usa **NSLock** u `os_unfair_lock`, pero solo si el profiling demuestra que es necesario.

### Aprendizajes Clave

1. **Thread safety no es opcional**: Si múltiples hilos acceden a datos compartidos, necesitas sincronización.

2. **Los deadlocks son reales**: Lock ordering es crítico cuando adquieres múltiples locks.

3. **El compilador es tu amigo**: Los actors convierten errores de runtime en errores de compilación.

4. **Async/await no es solo para networking**: Es la base de la concurrencia segura en Swift moderno.

5. **Testing es crucial**: Los bugs de concurrencia son difíciles de reproducir. Tests automatizados son esenciales.

---

## Recursos

- [Swift Concurrency Documentation](https://docs.swift.org/swift-book/LanguageGuide/Concurrency.html)
- [Código completo en GitHub](tu-repo-aqui)
- [WWDC21: Protect mutable state with Swift actors](https://developer.apple.com/videos/play/wwdc2021/10133/)
- [Swift Evolution: SE-0306 Actors](https://github.com/apple/swift-evolution/blob/main/proposals/0306-actors.md)

---

Si este artículo te fue útil, ¡compártelo! Y no olvides revisar el código completo en el repositorio.
