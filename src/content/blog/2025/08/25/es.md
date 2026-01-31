---
title: 'Desde Requerimientos hasta Casos de Uso: Construyendo una aplicación para precio de BTC de la forma correcta'
description: 'Aprende a transformar requisitos vagos de un reto en historias de usuario, narrativas y casos de uso claros. Evita suposiciones, cubre todos los huecos y construye software predecible, testeable y profesional.'
pubDate: 'Aug 25 2025'
heroImage: './hero.png'
lang: 'es'
translationKey: 'from-requirements-to-use-cases'
slug: 'desde-requerimientos-hasta-casos-de-uso-construyendo-una-aplicacion-para-precio-de-btc-de-la-forma-correcta'
---

## Introducción

Cuando tenemos un reto de código, _<inserte aquí la fuente de su preferencia>_, nuestro primer instinto es usualmente: "_Hay que comenzar a echar código_", pero los retos - tal cual sería con requerimientos de clientes reales - son raramente completos, inclusive hasta confusos.

Si nos vamos directo al código, nos arriesgamos:

- A tener suposiciones ocultas 🤔
- Omitir casos extremos 💥
- Escribir código frágil que rompe cuando evolucionan los requerimientos ⚡

En este artículo, los llevaré a través de cómo **convertí el reto del precio BTC/USD** de la academia de Essential Developer en **historias de usuario**, **narrativas**, **especificaciones BDD** y **casos de uso**.

La meta no es solo construir una aplicación. La meta es **aprender cómo pensar como un ingeniero profesional**:

- Clarificar los requerimientos.
- Exponer cualquier posible hueco temprano.
- Definir comportamientos antes de implementación.
- Construir software que sea fácil de probar, predecible y mantenible.

## Paso 1 - Leer entre líneas

El reto dice:

> Crea una aplicación multiplataforma (CLI + iOS) para mostrar la conversión de precio entre BTC/USD cada segundo. Usa Binance como la fuente de datos primaria y CryptoCompare como respaldo. Maneja errores mostrando el último valor capturado y su timestamp, y oculta el error cuando la siguiente actualización es exitosa.

¿Parece claro? En realidad, mucho no es dicho:

- ¿Cómo debería verse el error al usuario exactamente?
- ¿Qué pasa si ambas fuentes fallan al mismo tiempo?
- ¿Qué si la petición toma más de 1 segundo?
- ¿Qué si no hay nada de caché?
- ¿La app de iOS debe seguir haciendo peticiones si se encuentra en background?

👉 **Los requerimientos nunca están completos**. Nuestro trabajo es _hacerlos explícitos_.

## Paso 2 - Convertir los requerimientos crudos en Historias de Usuario

Las historias de usuario nos dan el cuadro general del problema desde la **perspectiva del usuario**.

Estas historias nos responden: _¿Quién quiere qué y por qué?_.

Ejemplo:

```plain
Como un usuario de iOS
Quiero ver el precio más reciente BTC/USD en pantalla
Así sé el valor actual y cuándo fue la última actualización.
```

Escribiendo múltiples historias (para CLI, el respaldo, estados de error, el caché...), ya reducimos ambigüedad.

Las historias también nos ayudan a validar con stakeholders: "_¿Es esto lo que esperas?_".

## Paso 3 - Escribir narrativas y criterios de aceptación (BDD)

Las historias aún son demasiado amplias.

Los escenarios con estilo de narrativas + BDD (Behavior Driven Development / Desarrollo Conducido por Comportamiento) nos ayudan a **cubrir todas las ramas**.

Ejemplo de narrativa:

```plain
Como un usuario
Quiero que la aplicación muestre el último valor capturado cuando la red falla
Así aún puedo ver información útil en vez de una pantalla en negro.
```

Criterio de aceptación (BDD):

```gherkin
Dado que ambas fuentes de datos fallan para el tick actual
Y un valor atrapado existe
Cuando el sistema renderiza el resultado
Entonces muestra el valor atrapado con su timestamp
Y muestra un mensaje de error visible
```

¿Por qué esto es de valor? Porque:

- Nos obliga a pensar en **rutas buenas/felices** y **rutas malas/tristes**
- Esto ya está incluso configurando nuestras **pruebas desde antes de la primera línea de código**.
- Previene las clásicas discusiones "pero pensé que debería...".

## Paso 4 - Casos de uso: Definiendo responsabilidades del sistema

Ahora nos movemos desde "lo que quiere el usuario" → hacia "lo que el sistema debe hacer".

Los casos de uso describen las responsabilidades de nuestros módulos.

Ejemplo: **Carga el último precio con respaldo**

- **La ruta feliz/buena**
  1. Intenta la fuente primaria (con timeout).
  2. Si es exitosa → regresa el resultado.
  3. Si falla → Intenta el respaldo.
  4. Si el respaldo es exitoso → regresa el resultado.

- **La ruta triste/mala**
  1. Si ambos fallan → mandan un error, renderizan el valor atrapado, muestran el mensaje.

Ya notas cómo estamos **separando preocupaciones**:

- A los casos de uso no les importa sobre UIKit/SwiftUI/CLI.
- Define **reglas de negocio**.
- Que más adelante, las capas de presentación solo las consumen.

## Por qué cubrir TODOS los huecos importa

Imagina irnos directo al código sin especificaciones.

¿Qué si durante el día del demo, alguien pregunta: "_¿Qué pasa si la actualización toma más de un segundo?_" Si no lo pensamos, nuestra aplicación puede congelarse o fallar de forma silenciosa.

Con escribir historias, narrativas y casos de uso:

- Nos obligamos a abordar casos extremos desde el principio.
- No hacer suposiciones.
- Definir contratos que las pruebas pueden validar.
- Habilitar una arquitectura modular y reutilizable (iOS + CLI comparten el mismo núcleo).

Este proceso no es burocracia. Es cómo nos aseguramos que nuestro sistema sea predecible y robusto.

## Paso 5 - Enseñar a través de especificaciones

Lo que me gusta de este proceso es que las propias especificaciones **enseñan**:

- Los nuevos desarrolladores pueden leer las historias y comprender el sistema en minutos.
- Las pruebas se mapean 1:1 con los criterios de aceptación.
- Las especificaciones se convierten en documentación viva.

No se trata solo de completar un desafío, sino de mostrar cómo los profesionales construyen sistemas reales.

## Conclusión

Los retos no son solo sobre "sólo código". Son sobre **pensar como un ingeniero**.

Al transformar los requisitos básicos en historias → narrativas → especificaciones de BDD → casos de uso, logramos:

- Reducir la ambigüedad.
- Eliminar suposiciones.
- Definir el comportamiento con claridad.
- Construir una base sólida para TDD y el diseño modular.

A continuación, mostraré cómo mapeé estos casos de uso en una estructura modular de paquetes Swift (núcleo, redes, persistencia, funcionalidad) y comencé a implementarlos con TDD.
