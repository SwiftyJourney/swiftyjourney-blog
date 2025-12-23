---
title: 'Swift Refresh 2025 – Dia 2: Concurrencia en practica + Liquid Glass (sin ruido visual)'
description: 'Un repaso honesto al Dia 2: concurrencia estricta con Swift 6 y el lenguaje visual de Liquid Glass en iOS 26, sin perder claridad.'
pubDate: 'Dec 23 2025'
heroImage: './hero.png'
lang: 'es'
translationKey: 'swift-refresh-2025-day2-concurrency-liquid-glass'
slug: 'swift-refresh-2025-dia-2-concurrencia-liquid-glass'
---

## Introduccion

El Dia 2 del **Swift Refresh Workshop 2025** fue una combinacion poderosa:

- **Swift 6** nos obliga a ser explicitos con la concurrencia.
- **iOS 26** define un lenguaje visual con Liquid Glass.

Dos cambios distintos, misma direccion: menos hacks, mas intencion.

---

## Parte I — Swift 6 y concurrencia estricta (en una app real)

### Contexto real del workshop

Trabajamos una app que consume un servicio REST con esta configuracion:

```bash
SWIFT_VERSION = 6.0
SWIFT_STRICT_CONCURRENCY = complete
SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor
```

`SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor` cambia el juego: tipos y miembros no anotados quedan aislados al MainActor. Resultado:

- Hay que ser explicitos.
- Las capas importan.
- Piensas en dominios de ejecucion, no solo en hilos.

---

### Sendable: no es performance, es integridad

```swift
protocol HTTPClientProtocol: Sendable {
  func fetch<T>(from url: URL) async throws -> T
    where T: Decodable & Sendable
}
```

`Sendable` significa:

- El tipo puede cruzar dominios de concurrencia.
- No comparte estado mutable.
- Es seguro moverlo entre actores.

No es un tema de performance. Es de correctness.

---

### Por que Sendable es obligatorio en networking

```swift
let (data, _) = try await URLSession.shared.data(from: url)
let result = try decoder.decode(T.self, from: data)
return result
```

- `URLSession` trabaja en background.
- La decodificacion tambien puede ocurrir fuera del MainActor.
- El resultado debe volver al actor que llamo.

Ese cruce exige `Sendable`.

---

### El problema del MainActor por defecto

Un struct inocente:

```swift
struct Employee: Decodable {
  let id: Int
  let name: String
}
```

Con la config del proyecto, en realidad es:

```swift
@MainActor struct Employee { ... }
```

Un tipo aislado a un actor no puede ser `Sendable`.

---

### nonisolated: liberar el tipo

```swift
nonisolated struct Employee: Decodable, Identifiable, Hashable {
  let id: Int
  let firstName: String
  let lastName: String
}
```

Esto hace que:

- No este ligado a ningún actor.
- Pueda conformar a `Sendable`.
- Viaje entre capas.

Nota importante: `nonisolated` no hace al tipo `Sendable` por si solo, solo quita el aislamiento.

---

### Global Actor para la capa de datos

Creamos un actor propio:

```swift
@globalActor
actor DataLayer {
  static let shared = DataLayer()
}
```

Objetivo:

- Aislar la capa de red.
- Evitar el MainActor.
- Forzar background para IO y decode.

---

### Repository aislado al DataLayer

```swift
@DataLayer
final class EmployeeRepository: EmployeeRepositoryProtocol {
  private let client: HTTPClientProtocol

  nonisolated init(
    client: HTTPClientProtocol = HTTPClient()
  ) {
    self.client = client
  }

  func fetchEmployees() async throws -> [Employee] {
    let dto: [Employee.DTO] = try await client.fetch(from: .getEmployees)
    return dto.map { $0.toDomain() }
  }
}
```

Detalles importantes:

- `init` debe ser `nonisolated`.
- El `HTTPClient` tambien.
- El ViewModel vive en MainActor y necesita cruzar el puente.

---

### 8) Protocolos tambien se aislan

Error comun:

"Por que el metodo aparece como @MainActor si el tipo no lo es?"

Respuesta:

- Los protocolos heredan aislamiento.
- Si no se especifica, quedan en MainActor.

Solucion:

```
@DataLayer
protocol EmployeeRepositoryProtocol {
  func fetchEmployees() async throws -> [Employee]
}
```

---

### 9) Flujo real de ejecucion

```text
MainActor
 └─ ViewModel.load()
     └─ await repository.fetchEmployees()
           └─ DataLayer
                ├─ URLSession (background)
                ├─ decode (background)
                └─ return [Employee]
     └─ assign to @MainActor state
```

El `await` no solo espera. Cambia de dominio.

---

### 10) Preview y el detalle del aislamiento

Preview data:

```
extension [Employee] {
  static let preview: [Employee] = [...]
}
```

Error:

"Main actor-isolated static property cannot be used..."

Solucion:

```
return await .preview
```

`await` cruza dominio. No convierte el valor, pero permite el acceso seguro.

---

### 11) Regla mental final (concurrencia)

`await` no es solo espera. Es un puente.

---

## Parte II — Liquid Glass en iOS 26

### 12) Liquid Glass ya es el default

En iOS 26:

- No se activa.
- No se configura.
- Ya esta ahi.

Si usas SwiftUI moderno, ya lo estas usando.

---

### 13) Donde vive Liquid Glass

Vive en capas superiores:

- Toolbars
- Menus
- Sheets
- Bottom bars
- Overlays

No vive en:

- Layouts
- Filas de contenido
- Botones dentro de listas

---

### 14) Toolbars y Labels

Apple empuja:

```
Label("Sort", systemImage: "square.3.layers.3d")
```

Porque mejora:

- Accesibilidad
- Semantica
- Consistencia con Liquid Glass

![Toolbar con blur al hacer scroll](./toolbar_blur.png)

---

### 15) ToolbarItemGroup y fusion automatica

```
ToolbarItemGroup(placement: .bottomBar) {
  Button { } label: { Label("Add", systemImage: "plus") }
  Button { } label: { Label("Remove", systemImage: "minus") }
}
```

El sistema agrupa y aplica Liquid Glass sin stacks manuales.

---

### 16) ToolbarSpacer (iOS 26+)

```
ToolbarSpacer(placement: .bottomBar)
```

- Separacion visual limpia.
- Coherencia con el sistema.
- Solo iOS 26+.

---

### 17) Menus = Liquid Glass automatico

```
Menu {
  Button { } label: {
    Label("Ascending", systemImage: "arrowshape.up")
  }
} label: {
  Label("Sort", systemImage: "square.stack.3d.up")
}
```

Menus ya vienen con blur y animacion.

![Menu con blur y animacion](./menu_blur_animated.gif)

---

### 18) Sheets y detents

- `.medium` -> translucido
- `.large` -> mas opaco

```
.presentationBackgroundInteraction(
  .enabled(upThrough: .medium)
)
```

El sistema comunica jerarquia visual por ti.

![Sheet pasando de medium a large](./sheet_medium_large.gif)

---

### 19) UIDesignRequiresCompatibility

```
UIDesignRequiresCompatibility = YES
```

- Desactiva Liquid Glass.
- Mantiene el look iOS 18.
- Es temporal (desaparece en Xcode 27).

No es un opt-out permanente.

---

### 20) Nuevos ButtonStyles (iOS 26)

- `.glass`
- `.glassProminent`

```
.buttonStyle(.glass)
```

`.glass` es translucido y `.glassProminent` mas solido.

![Glass vs GlassProminent en botones](./glass-glassprominent-buttons.png)

---

### 21) Abstraccion de botones (recomendado)

```
struct AppButton<Content: View>: View {
  ...
  if #available(iOS 26, *) {
    .buttonStyle(.glass)
  } else {
    .buttonStyle(.bordered)
  }
}
```

El estilo se adapta sin duplicar vistas.

---

### 22) glassEffect (con moderacion)

```
.glassEffect(.clear, in: .rect(cornerRadius: 11))
```

Es costoso si lo usas en listas largas o grids con scroll intenso.

---

### 23) GlassEffectContainer (performance)

```
GlassEffectContainer {
  HStack {
    Image(systemName: "heart")
    Image(systemName: "star")
    Image(systemName: "bell")
  }
}
```

- Un solo render pass.
- Mejor performance.
- Movimiento coherente.

![GlassEffectContainer con varios iconos](./glasseffect_container.gif)

---

### 24) Roles de botones

```
Button(role: .confirm) { }
Button(role: .close) { }
```

Roles = apariencia correcta + accesibilidad + consistencia.

---

### 25) Regla mental final (Liquid Glass)

Liquid Glass no es decoracion. Es el lenguaje visual del sistema.

---

## Conclusion: dos cambios, una sola idea

Swift 6 te obliga a ser explicito con la concurrencia. iOS 26 te obliga a confiar en el sistema visual.

Ambos cambios apuntan a lo mismo: menos hacks, mas intencion.

---

Si quieres, te preparo prompts para el hero image o para generar los assets.
