---
title: 'Swift Refresh 2025 – Día 3: Liquid Glass, animaciones, SwiftData y Xcode como agente'
description: 'Un repaso al Día 3 del Swift Refresh Workshop 2025: estado, Liquid Glass, animaciones declarativas, SwiftData y el nuevo rol de Xcode como agente.'
pubDate: 'Jan 06 2026'
heroImage: './hero.png'
lang: 'es'
translationKey: 'swift-refresh-2025-day3-liquid-glass-animations-swiftdata-xcode-ai'
slug: 'swift-refresh-2025-dia-3-liquid-glass-animaciones-swiftdata-xcode-ai'
---

## Introducción

En el Día 3 del **Swift Refresh Workshop 2025**, Apple deja de enseñar APIs aisladas y empieza a mostrar algo mucho más interesante:  
**cómo todas las piezas del stack moderno encajan entre sí**.

Animaciones declarativas, Liquid Glass, SwiftData, concurrencia estricta y Xcode como agente activo no son temas separados.  
Son distintas caras del mismo concepto: **estado, identidad y ownership**.

En este artículo no voy a listar APIs.  
Voy a explicar **qué aprendimos realmente** y *por qué Apple está empujando este modelo*.

---

## 1. Todo empieza con el estado (y no con las animaciones)

Antes de hablar de Liquid Glass o SwiftData, el workshop deja algo muy claro:

> SwiftUI no anima vistas.  
> SwiftUI anima **transiciones de estado**.

Un simple booleano como este:

```swift
@State private var expanded = false
```

no “enciende” una animación.  
Describe una **nueva realidad**.

Cuando ese estado cambia, SwiftUI:

- recalcula el árbol de vistas
- detecta qué cambió
- decide qué puede animarse

### `if expanded` no oculta vistas

```swift
if expanded {
  SomeView()
}
```

Esto **crea y destruye vistas**.  
No es lo mismo que cambiar `.opacity`.

Por eso, cuando insertamos vistas dinámicamente, el layout puede “saltar”.  
No es un bug: es SwiftUI siendo honesto.

---

## 2. Layout vs animación: el primer choque con la realidad

Al agregar contenido encima de un botón, vimos que el botón se empujaba hacia abajo:

```swift
VStack {
  if expanded { icons }
  Button("Options")
}
```

SwiftUI recalcula el tamaño del contenedor.  
Resultado: el botón se mueve.

### El workaround usado en el workshop

```swift
.frame(height: 150, alignment: .bottom)
```

Esto **no es animación**.  
Es control de layout.

Congelamos el espacio para evitar que el botón “caiga”.

> En producción, probablemente usarías `overlay` o `ZStack`.  
> Aquí el objetivo era entender **por qué** pasa, no esconderlo.

---

## 3. Animaciones en SwiftUI: lo mínimo necesario

Para animar cambios de estado, basta con una de estas dos formas:

```swift
.animation(.spring, value: expanded)
```

o

```swift
withAnimation(.spring) {
  expanded.toggle()
}
```

SwiftUI animará **todo lo animable**:

- layout
- opacity
- scale
- glass effects

### Transiciones

```swift
.transition(.scale.combined(with: .opacity))
```

Las transiciones solo funcionan cuando una vista:

- entra
- o sale  
(normalmente usando `if`)

---

## 4. Liquid Glass: no es un efecto, es un sistema

Liquid Glass **no es un modifier visual más**.  
Es un sistema que combina:

- material
- identidad
- interacción
- animación

### Glass básico

```swift
.glassEffect(.regular)
.glassEffect(.clear)
.glassEffect(.regular.tint(.green))
.glassEffect(.clear.interactive())
```

- `.regular` → vidrio visible  
- `.clear` → vidrio sutil  
- `.interactive()` → responde al input  
- `.tint` → colorea la superficie  

Aplicarlo a un `HStack` crea **una sola superficie**.  
Aplicarlo a cada `Image` crea **chips individuales**.

---

## 5. Identidad visual: `@Namespace` y `glassEffectID`

```swift
@Namespace var namespace
```

`@Namespace` no guarda datos.  
Crea un **espacio de identidad compartido**.

### Regla mental

- Namespace = universo  
- ID = identidad dentro del universo  

```swift
.glassEffectID("icon", in: namespace)
.glassEffectTransition(.identity)
```

Esto permite que el vidrio **morfée** entre estados en lugar de desaparecer y reaparecer.

Para que funcione:

- mismo `id`
- mismo `namespace`
- la vista debe existir antes y después del cambio

---

## 6. `glassEffectUnion`: una sola superficie, muchas vistas

```swift
.glassEffectUnion(id: "g1", namespace: namespace)
```

Esto le dice a SwiftUI:

> “Estas superficies son **una sola pieza de vidrio**”.

Visualmente:

- iconos separados  
- se convierten en una cápsula continua  

### Regla importante

> Un `glassEffectUnion` = **una sola superficie de vidrio**

Por eso:

- solo **un tint** por union  
- si mezclas colores, uno gana y los demás se ignoran  

---

## 7. SwiftData: cuando el ViewModel deja de ser obligatorio

```swift
@Query private var employees: [Employee]
```

`@Query`:

- ejecuta el fetch  
- observa cambios  
- refresca la UI automáticamente  

En muchas pantallas CRUD, **esto ya cumple el rol del ViewModel**.

### Optimización con `FetchDescriptor`

```swift
var fetch = FetchDescriptor<Employee>()
fetch.fetchLimit = 20
fetch.sortBy = [SortDescriptor(\.lastName), SortDescriptor(\.firstName)]
fetch.relationshipKeyPathsForPrefetching = [\.department, \.gender]
_employees = Query(fetch)
```

- `fetchLimit` → performance  
- `sortBy` → orden estable  
- `prefetch` → evita N+1 queries  

---

## 8. Relaciones en SwiftData: el error más común

Al cambiar a:

```swift
@Query private var departments: [Department]
```

y luego usar:

```swift
department.employees
```

no aparecía nada.

El problema **no era el query**.  
Era la relación.

### Siempre definir el `inverse`

```swift
@Relationship(deleteRule: .deny, inverse: \Employee.department)
var employees: [Employee]
```

Sin `inverse`, SwiftData no puede construir el grafo correctamente.

---

## 9. `@ModelActor`: el verdadero truco de magia

SwiftData es **actor-aware**.

El `mainContext` vive en el `MainActor`.  
Usarlo para operaciones pesadas es un error común.

### `@ModelActor`

Un `@ModelActor`:

- tiene su propio `ModelContext`
- ejecuta operaciones serializadas
- respeta strict concurrency

Este es el lugar correcto para:

- fetch remoto
- upserts
- sincronización
- merges de DTOs

---

## 10. DTOs, Sendable y el error del predicate

```swift
employee.id == dto.id // ❌
```

SwiftData **no permite navegar propiedades** dentro de un `#Predicate`.

El fix correcto:

```swift
let id = dto.id
employee.id == id // ✅
```

### Regla mental

En `#Predicate`:

- el lado izquierdo es el modelo  
- el lado derecho debe ser un **valor plano**  

---

## 11. Xcode Coding Intelligence: el IDE como agente

Xcode 26 introduce un cambio silencioso pero profundo.

Coding Intelligence:

- no navega internet  
- no hace RAG externo  
- razona **solo sobre tu proyecto**  
- puede aplicar cambios y revertirlos  

Claude funciona mejor aquí **por diseño**, no por hype:

- mejor reasoning con contexto limitado  
- mejor lectura de código incompleto  

Modelos locales vía LM Studio refuerzan esta idea:
> el IDE deja de ser un editor pasivo.

---

## 12. Arquitectura final del día

```
SwiftUI View
  ↓ @Query (lectura reactiva)
SwiftData
  ↑
ViewModel (@Observable, acciones)
  ↓
ModelActor (persistencia concurrente)
  ↓
Repository (DTOs / Network)
```

Cada capa tiene una responsabilidad clara.  
Cada frontera respeta concurrencia.

---

## Conclusión

El Día 3 no va de aprender nuevas APIs.  
Va de **entender cómo Apple piensa el stack moderno**.

- El estado manda  
- La identidad importa  
- La base de datos es reactiva  
- La concurrencia es explícita  
- El IDE empieza a colaborar contigo  

Y cuando todo eso se alinea, SwiftUI deja de sentirse “mágico”  
y empieza a sentirse **coherente**.

---

*Notas tomadas durante el Swift Developer Workshop y reinterpretadas desde una perspectiva práctica y real‑world.*
