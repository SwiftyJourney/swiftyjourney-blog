---
title: 'Swift Refresh 2025 – Día 4 (Parte 1): Memoria, concurrencia real y sincronización'
description: 'Un repaso profundo a la primera parte del Día 4: arrays inline, Span, concurrencia real con actores, mutex y atomics. Swift ya no protege, exige intención.'
pubDate: 'Jan 21 2026'
heroImage: './hero.png'
lang: 'es'
translationKey: 'swift-refresh-2025-day4-part1-memory-concurrency-synchronization'
slug: 'swift-refresh-2025-dia-4-parte-1-memoria-concurrencia-sincronizacion'
---

## Introducción

El Día 4 del **Swift Refresh Workshop 2025** marca un punto de inflexión claro.

Hasta ahora, Swift nos había ayudado a:

- escribir código más seguro
- evitar crashes
- manejar concurrencia "sin pensar demasiado"

Este día cambia la narrativa por completo.

> Ya no se trata de *evitar errores*,  
> sino de **modelar explícitamente quién puede acceder a qué, cuándo y bajo qué reglas**.

Esta primera parte se enfoca en **memoria y concurrencia real**: desde arrays inline hasta las herramientas de sincronización que Swift 6 pone a tu disposición.

No va de APIs nuevas.  
Va de **ownership**, **límites** y **tiempo**.

---

## 1. Arrays, memoria y por qué el heap ya no siempre es suficiente

El workshop comienza con algo aparentemente básico: **arrays**.

Un `Array` en Swift:

- es un `struct`
- pero su almacenamiento vive en el **heap**
- es dinámico
- no garantiza contigüidad en memoria

Esto implica flexibilidad, pero también costos:

- acceso menos predecible
- inserciones y borrados más caros
- peor locality de caché

### Inline Arrays (Swift 6)

```swift
var inline: [20 of Int]
```

Con Swift 6 aparece un nuevo tipo: **Inline Arrays**.

Características:

- tamaño fijo conocido en compile-time
- viven en el stack
- memoria contigua
- acceso extremadamente rápido

No reemplazan a `Array`.  
Son una herramienta cuando el layout de memoria importa más que la flexibilidad.

---

## 2. Span: performance sin ownership

Los Inline Arrays no conforman a `Sequence`.  
Esto es intencional.

Para iterarlos, Swift introduce `Span`:

```swift
let values = inline.span
```

Un `Span`:

- no copia
- no reserva memoria
- presta acceso directo a la región contigua

Pero introduce una regla clave:

> Un `Span` no puede escapar su scope.

Es Swift modelando explícitamente el lifetime de la memoria, algo que antes solo veías en C++ o Rust.

---

## 3. Concurrencia legacy: el problema real no es GCD

Regresamos al ejemplo clásico del `BankAccount`.

Dos hilos:

- transfieren dinero en direcciones opuestas
- usan la misma lógica
- producen resultados distintos cada ejecución

El problema no es `DispatchQueue`.  
El problema es **estado mutable compartido sin protección**.

Swift 6 ahora te muestra warnings claros.  
Antes, esto solo explotaba en producción.

---

## 4. Actores: seguridad sin locks (pero no transacciones)

Reescribimos el ejemplo usando `actor`.

Resultado:

- no hay data races
- acceso serializado
- seguridad garantizada

Pero aparece una verdad incómoda:

> Un actor no bloquea operaciones completas,  
> bloquea accesos individuales.

Cada `await`:

- libera el actor
- permite reentrancia

Esto significa que los actores:

- garantizan exclusión mutua por acceso
- **no garantizan atomicidad de operaciones compuestas**

---

## 5. Mutex: cuando sí necesitas atomicidad real (iOS 18+)

Aquí entra `Synchronization.Mutex`.

A diferencia de un actor:

- un mutex bloquea una sección crítica completa
- permite modelar operaciones compuestas de forma segura
- habilita `Sendable` sin `@unchecked`

Este patrón vuelve a ser relevante, pero ahora:

- explícito
- seguro
- integrado al modelo moderno de Swift

---

## 6. Atomics: la herramienta correcta para contadores

No todo necesita locks.

Para casos como:

- contadores
- métricas
- estadísticas

Apple introduce `Atomic<T>`:

```swift
value.add(1, ordering: .relaxed)
value.load(ordering: .relaxed)
```

Aquí lo importante no es la API, sino la decisión:

No todos los problemas de concurrencia se resuelven igual.

Elegir entre:

- `actor`
- `mutex`
- `atomic`

es parte del diseño, no un detalle técnico.

---

## Conclusión

Swift ya no intenta protegerte. Te obliga a decidir.

Esta primera parte del Día 4 deja algo muy claro:

- La concurrencia no se "arregla"
- La memoria no se "optimiza al final"
- Cada herramienta tiene su lugar

Swift te da herramientas.  
Pero ahora te exige intención.

Y aunque eso incomoda, es lo que hace que todo el sistema finalmente sea coherente.

---

*Notas tomadas durante el Swift Developer Workshop 2025 ([Apple Coding Academy](https://acoding.academy/)) y reinterpretadas desde una perspectiva práctica y real-world.*
