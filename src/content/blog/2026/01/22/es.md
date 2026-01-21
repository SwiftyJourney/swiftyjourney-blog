---
title: 'Swift Refresh 2025 – Día 4 (Parte 2): Observation moderna y UIKit reactivo'
description: 'Un repaso profundo a la segunda parte del Día 4: Observation como AsyncSequence, UIKit verdaderamente reactivo con modelos observables y notificaciones tipadas.'
pubDate: 'Jan 22 2026'
heroImage: './hero.png'
lang: 'es'
translationKey: 'swift-refresh-2025-day4-part2-observation-uikit-reactive'
slug: 'swift-refresh-2025-dia-4-parte-2-observation-uikit-reactivo'
---

## Introducción

En la primera parte del Día 4 vimos cómo Swift 6 te obliga a modelar explícitamente memoria y concurrencia.

Esta segunda parte conecta esos conceptos con algo igual de importante: **la reactividad**.

Observation y UIKit no se presentan como temas aislados.  
Apple los conecta como partes del mismo sistema.

> La reactividad no es automática.  
> Tampoco es un hack.  
> Es un modelo de datos.

---

## 1. Observation en iOS 17: reactivo, pero manual

Con `@Observable` y `withObservationTracking`, Apple introduce reactividad real.

Pero el patrón inicial tenía fricción:

- el observer se dispara una vez
- hay que re-suscribirse manualmente
- closures `Sendable`
- manejo explícito del `MainActor`

Funciona, pero se siente como una transición.

---

## 2. Observation en iOS 26: el estado como stream

En iOS 26 aparece `Observations`.

```swift
let updates = Observations { download.progress }

for await value in updates {
  print(value)
}
```

Ahora:

- `Observation` es un `AsyncSequence`
- no hay callbacks
- no hay re-suscripciones
- los cambios son transaccionales

La reactividad deja de ser un hack.  
Ahora es un modelo de datos.

---

## 3. Diffable Data Sources: identidad antes que animación

`DiffableDataSource` no es una API de animaciones.

Es una API de identidad:

- `Hashable` define qué es el mismo elemento
- el snapshot define el estado actual
- UIKit decide cómo transicionar

Esto prepara el terreno para UIKit reactivo.

---

## 4. UIKit reactivo: configurationUpdateHandler

En iOS 26, UIKit da un paso importante.

Cada celda puede reaccionar a cambios mediante:

```swift
cell.configurationUpdateHandler = { cell, state in
  var content = UIListContentConfiguration.subtitleCell()
  content.text = item.fullName
  content.secondaryText = item.email
  cell.contentConfiguration = content
}
```

Esto permite:

- reconfigurar sin reaplicar snapshots
- reaccionar a cambios de estado
- conectar UIKit con Observation

UIKit deja de ser completamente imperativo.

---

## 5. El problema real: los DTOs no son reactivos

Aquí aparece el choque conceptual:

- `struct Employee` es inmutable
- no emite cambios
- no puede ser observado

En SwiftUI solucionabas esto actualizando el array completo.

En UIKit Diffable, eso no escala bien.

---

## 6. La solución: modelos de celda observables

El patrón correcto termina siendo:

- DTO (`Employee`) → `struct`
- Modelo de celda (`EmployeeCell`) → `@Observable class`

```swift
@Observable @MainActor
final class EmployeeCell {
  var firstName: String
  var lastName: String
}
```

Ahora:

- Diffable usa `EmployeeCell`
- cambiar propiedades dispara actualización
- la celda se refresca sola

Esto es UIKit verdaderamente reactivo.

---

## 7. Notificaciones tipadas: adiós Notification.Name

iOS 26 introduce notificaciones tipadas:

```swift
struct EmployeesDidUpdate: NotificationCenter.MainActorMessage {
  typealias Subject = EmployeeLogic
}
```

Ventajas:

- type-safe
- aislamiento explícito
- sin strings mágicos
- mejor lifecycle

---

## 8. ObservationToken: el detalle que rompe todo

Si no retienes el `ObservationToken`:

- el observer se libera
- la notificación nunca llega
- nada funciona

Swift no avisa.  
La arquitectura falla en silencio.

Guardar el token es obligatorio.

---

## Conclusión

Swift ya no intenta protegerte. Te obliga a decidir.

Esta segunda parte del Día 4 deja algo muy claro:

- La reactividad no es automática
- Los DTOs no son reactivos por sí solos
- UIKit puede ser verdaderamente reactivo si lo diseñas así

Swift te da herramientas.  
Pero ahora te exige intención.

Y aunque eso incomoda, es lo que hace que todo el sistema finalmente sea coherente.

---

*Notas tomadas durante el Swift Developer Workshop 2025 ([Apple Coding Academy](https://acoding.academy/)) y reinterpretadas desde una perspectiva práctica y real-world.*
