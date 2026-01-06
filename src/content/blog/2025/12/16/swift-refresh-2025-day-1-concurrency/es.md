---
title: 'Swift Refresh 2025 – Día 1: Concurrencia en Swift 6.2 (sin dolor innecesario)'
description: 'Un repaso honesto a la concurrencia estricta de Swift 6.2: actores, @MainActor, Sendable y cómo migrar sin sufrir en proyectos reales.'
pubDate: 'Dec 16 2025'
heroImage: './hero.png'
lang: 'es'
translationKey: 'swift-refresh-2025-day1-concurrency'
slug: 'swift-refresh-2025-dia-1-concurrencia-con-swift-6-2'
---

## Introducción

Swift 6 no vino a complicarnos la vida.  
Vino a decirnos la verdad.

El Día 1 del **Swift Refresh Workshop 2025** no fue una lluvia de nuevas APIs ni una lista de cambios para memorizar.  
Fue algo mucho más importante: **un cambio de mentalidad**.

Swift 6.2 redefine cómo escribimos código concurrente, pero sobre todo **cómo pensamos la seguridad, el ownership y el diseño**.

Si tuviste la sensación de “esto antes funcionaba”, no estás solo.  
La diferencia es que antes funcionaba… **hasta que dejaba de hacerlo**.

---

## 1. El problema que Swift 6 quiere eliminar

Durante años, en iOS convivimos con una realidad incómoda:

- Código concurrente “aparentemente” correcto  
- Bugs intermitentes  
- Crashes imposibles de reproducir  
- Race conditions silenciosas

Ejemplo clásico:

```swift
var counter = 0

DispatchQueue.global().async {
    counter += 1
}
```

Esto **siempre fue incorrecto**. Es una data race de manual.  
Swift 5 lo permitía sin quejarse. Swift 6, en modo de concurrencia estricta, **te lo marca** (y puede negarse a compilarlo según tu configuración).

👉 La novedad no es “más concurrencia”.  
**La novedad es la honestidad del compilador.**

---

## 2. Concurrencia estricta: qué cambia realmente

Swift 6.2 introduce lo que Apple llama **Strict Concurrency**.

Traducción a humano:

> “Si no puedo garantizar que este acceso es seguro, te aviso.  
> Si activas el modo estricto, no compilo.”

En la práctica, tienes una **migración progresiva**:

- Puedes empezar con **warnings** para código legacy.  
- Puedes endurecer hasta que ciertos patrones inseguros se conviertan en **errores de compilación**.  

Ahora, cada dato tiene que encajar en (al menos) una de estas ideas:

- Ser **inmutable**  
- Estar **aislado por un actor**  
- Vivir en un contexto claro (`@MainActor` u otro global actor)  
- Ser explícitamente **`Sendable`** si cruza límites de concurrencia

Si no… **error (o como mínimo, una advertencia muy insistente).**

No es castigo.  
Es **prevención**.

---

## 3. @MainActor: no es un hilo, es un contrato

`@MainActor` es uno de los conceptos más malentendidos (y más importantes) de todo Swift 6.

```swift
@MainActor
final class ViewModel {
    var title: String = ""
}
```

Esto no significa solo “esto corre en el main thread”.  
Significa algo mucho más útil:

> “Este estado solo puede tocarse desde el contexto principal.”

Swift ahora:

- **Protege la UI**  
- **Protege los ViewModels**  
- Te avisa si accedes a este estado desde otro contexto sin saltar al actor principal (`await MainActor.run { ... }`)

Antes confiaba en ti.  
Ahora **te cuida de ti mismo**.

---

## 4. Actores: la caja fuerte de tus datos

Un `actor` es la forma moderna y segura de manejar **estado mutable compartido**.

Modelo mental sencillo:

> Un actor es una habitación donde solo entra una persona a la vez.

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

No hay `locks`.  
No hay colas manuales.  
No hay magia negra.

👉 Si un dato es **mutable y compartido**, probablemente debería vivir en un **actor**.

---

## 5. Global actors: arquitectura, no solo concurrencia

A veces necesitas algo parecido a `@MainActor`, pero aplicado a tu **dominio**:

- Persistencia  
- Networking  
- SwiftData  
- Cache  

Ahí entran los **global actors**.

Definición típica:

```swift
@globalActor
struct DatabaseActor {
    static let shared = DatabaseActorImpl()
}

actor DatabaseActorImpl {
    // Estado y operaciones de base de datos
}
```

Y luego:

```swift
@DatabaseActor
func saveUser() {
    // Implementación segura en torno a DatabaseActorImpl
}
```

Esto no solo da seguridad en concurrencia.  
Da **estructura**:

- Te obliga a decidir **dónde vive** la lógica.  
- Hace más obvio **desde dónde** se accede a un recurso crítico.

---

## 6. Approachable Concurrency: el lado humano de Swift 6

Swift 6 es estricto, y Apple lo sabe.

La idea de **Approachable Concurrency** no cambia las reglas del juego, pero sí la experiencia:

- Mejora los mensajes del compilador  
- Facilita una migración **progresiva** desde Swift 5.x  
- Reduce frustración en proyectos grandes  
- Hace el modelo **enseñable** (y explicable al equipo)

Es Swift diciendo:

> “No te voy a perdonar errores…  
> pero te voy a explicar **por qué**.”

---

## 7. El villano recurrente: Sendable

Muchos errores del Día 1 comparten el mismo mensaje:

> `Type X does not conform to Sendable`

Traducción real:

> “No puedo garantizar que este dato sea seguro cuando cruza concurrencia.”

Detalles importantes en 2025:

- **Value types** sencillos (structs, enums sin rarezas) suelen ser `Sendable` automáticamente.  
- El dolor aparece con:
  - Clases con estado mutable compartido  
  - Closures capturando `self`  
  - APIs antiguas sin anotaciones de concurrencia

Y no, marcar algo como `Sendable` “para callar el error” no es la solución.

Swift 6 no quiere que le mientas.  
Quiere que **diseñes mejor tu modelo de datos**.

---

## 8. APIs legacy: cuando el pasado te alcanza

Ejemplo típico:

```swift
NotificationCenter.default.addObserver(
    forName: .someEvent,
    object: nil,
    queue: nil
) { [weak self] _ in
    self?.value += 1
}
```

¿Por qué ahora te empieza a doler?

- No hay **garantía de hilo** en esa API legacy  
- El closure captura `self`  
- `self` puede no ser seguro para concurrencia

Antes: “confía, no pasa nada”.  
Ahora: “**demuéstralo**”.

Swift te obliga a decidir:

- ¿Debo aislar este estado en un `actor`?  
- ¿Debo mover parte de esta lógica a un `@MainActor`?  
- ¿Debo rediseñar la API de notificaciones para hacerla segura?

---

## 9. Migrar a Swift 6 sin sufrir

La lección del Día 1 es clara:

- Swift 6 no “rompe” tu código por deporte  
- **Expone suposiciones incorrectas** que ya estaban ahí  
- Te obliga a limpiar **deuda técnica de concurrencia**

El orden mental correcto:

1. **¿Quién es dueño de este dato?**  
2. **¿Desde dónde se accede?**  
3. **¿Necesita vivir en un `actor`?**  
4. **¿Debe estar protegido por `@MainActor` u otro global actor?**  
5. **¿Puede cruzar límites de concurrencia? (threads, tasks, colas)**  

Responder con honestidad a esas preguntas evita el **90% de los errores** de migración.

---

## 10. Clean Architecture + Swift 6 = match perfecto

Swift 6 favorece de forma natural:

- Capas claras (UI, dominio, datos)  
- Dependencias explícitas  
- ViewModels protegidos con `@MainActor`  
- UseCases y Repositories aislados (a menudo con actores dedicados)  
- Un dominio que **no depende** de detalles de infraestructura

En 2025, con SwiftData, macros y tooling más maduro, esto ya no es solo “buena práctica” académica.

Es, literalmente, **el camino de menor resistencia** que te marca el compilador.

---

## Conclusión

Swift 6 no complica la vida. Te obliga a escribir el código que siempre debiste escribir.

Cuesta un poco más al inicio, pero evita bugs de concurrencia, crashes imposibles de reproducir y race conditions silenciosas.

Para proyectos reales en 2025, eso vale mucho más que escribir dos líneas menos.

---

*Notas tomadas durante el Swift Developer Workshop 2025 (Apple Coding Academy: https://acoding.academy/) y reinterpretadas desde una perspectiva práctica y real‑world.*
