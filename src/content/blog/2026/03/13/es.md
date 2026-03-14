---
title: 'De AI assistant a AI engineering teams'
description: 'Cómo los equipos de agentes en paralelo están cambiando el AI development, y cómo aplicarlo en iOS usando Agent Teams de Claude Code.'
pubDate: 'Mar 13 2026'
heroImage: './hero.png'
lang: 'es'
translationKey: 'ai-agent-teams'
slug: 'de-ai-assistant-a-ai-engineering-teams'
tags: ['ai', 'claude', 'ios', 'claude-code']
---

Estamos pasando de "AI assistant" a "AI engineering teams"

Y resulta que ya puedes probarlo hoy.

Durante mucho tiempo usamos AI así:

Un solo agente.
Un solo contexto.
Una sola perspectiva.

Útil, sí. Pero limitado.

Porque así no funciona un equipo real de ingeniería.

Lo que empieza a aparecer ahora es algo diferente:

equipos de agentes trabajando en paralelo.

No uno.
Varios.
Cada uno con una especialización distinta.

Y la diferencia… es enorme.

---

## De dónde viene esto

Hace poco leí una guía de [Tom Crawshaw](https://www.linkedin.com/in/tomcrawshaw/) (The AI Operator's Playbook) sobre algo que Anthropic acaba de lanzar en Claude Code:

Agent Teams.

Lo interesante es que algo muy parecido ya lo estaba explorando la comunidad de OpenClaw usando workarounds y skills personalizados.

Ahora Anthropic lo integró directamente en Claude Code.

Sin plugins.
Sin hacks.
Built-in.

La idea es simple:

En lugar de un solo agente haciendo todo secuencialmente, un lead agent divide el trabajo, crea varios teammates, y todos trabajan en paralelo coordinándose entre ellos.

Cuando lo leí pensé inmediatamente en mobile development.

---

## Desde la perspectiva de iOS development

Soy iOS engineer, y llevo un tiempo experimentando con skills especializados para guiar mejor a los modelos en distintos dominios.

Por ejemplo:

🏛️ iOS Architecture
https://github.com/SwiftyJourney/ios-architecture-expert-skill

🎨 SwiftUI
https://github.com/SwiftyJourney/swiftui-expert-skill

📋 Requirements Engineering
https://github.com/SwiftyJourney/requirements-engineering-skill

La idea detrás de estos skills es sencilla:

En lugar de pedirle todo a un modelo generalista, guiarlo para que razone más profundamente sobre un dominio específico.

Pero cuando lees sobre Agent Teams, aparece una pregunta interesante:

¿qué pasa si varios de estos roles trabajan al mismo tiempo?

Ahí es donde se pone realmente interesante.

---

## Un "AI team" para tu próximo feature

Imagina que estás desarrollando una nueva feature en tu app.

Por ejemplo, un onboarding flow de tres pasos.

En lugar de un solo agente haciendo todo…

tienes algo como esto:

<div class="img-medium">

![Cuatro agentes especializados trabajando en paralelo con un AI Core coordinador](./02.png)

</div>

### Agent 1 — Requirements

Lee el PRD o ticket.
Identifica edge cases.
Define acceptance criteria.

"¿Qué pasa si el usuario cierra la app en el paso 2?"

### Agent 2 — Architecture

Diseña el módulo.
Propone capas.
Define responsabilidades.

"Este flujo encaja mejor con un coordinator y un view model separado."

### Agent 3 — SwiftUI

Propone la UI.
Modela el estado.
Sugiere buenas prácticas.

"Aquí conviene usar @StateObject en lugar de @ObservedObject."

### Agent 4 — Testing

Identifica escenarios de fallo.
Propone casos de prueba.

"Falta el caso donde el usuario pierde conexión en el paso 3."

<div class="img-medium">

![Cuatro agentes trabajando en paralelo sobre la misma feature](./03.png)

</div>

---

Todos al mismo tiempo.
Cada uno con su propio contexto.

Eso se parece mucho más a cómo trabaja un equipo real de ingeniería.

---

## ¿Lo quieres probar?

Anthropic ya permite experimentar con esto en Claude Code.

Primero activas la feature en tu settings.json:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Después puedes describir lo que quieres en lenguaje natural:

```text
I'm building a new onboarding flow for an iOS app.

Create an agent team with different roles:

- one agent focused on requirements
- one agent focused on iOS architecture
- one agent focused on SwiftUI implementation
- one agent focused on testing

Each agent should work on its part in parallel.
```

El lead agent coordina el trabajo y distribuye las tareas.

Incluso puedes hablar directamente con cada agente si quieres redirigir su trabajo.

Documentación oficial:
https://code.claude.com/docs/en/agent-teams

---

## Cómo lo conecto con mis propios skills

Algo que me interesa explorar es combinar Agent Teams con skills especializados.

Por ejemplo:

- un agente guiado por Requirements Engineering
- otro guiado por iOS Architecture
- otro guiado por SwiftUI expertise
- otro enfocado en Testing strategy

<div class="img-medium">

![Combinando Agent Teams con skills especializados de iOS](./04.png)

</div>

Algo como:

Agent 1 → Requirements engineering
Agent 2 → iOS architecture
Agent 3 → SwiftUI implementation
Agent 4 → Testing strategy

Todavía estoy experimentando con esto, pero el potencial es bastante interesante.

---

## Lo que todavía no es perfecto

Tom Crawshaw lo menciona claramente en su guía: esto todavía está en research preview.

Hay algunas limitaciones.

**Costo**

Cada agente es una sesión independiente.
Más agentes → más tokens.

---

**Coordinación**

Si las tareas no están bien separadas, los agentes pueden pisarse el trabajo.

Especialmente si modifican el mismo archivo.

---

**Limitaciones actuales**

Por ejemplo:
- session resume todavía no funciona bien
- solo puedes tener un team por sesión
- algunos modos de visualización requieren herramientas como tmux

Nada grave, pero claramente esto sigue evolucionando.

---

## Si quieres profundizar

Algunos recursos interesantes:

[Tom Crawshaw — "Anthropic just shipped Agent Teams into Claude Code"](https://www.linkedin.com/posts/tomcrawshaw_anthropic-just-shipped-agent-teams-into-claude-activity-7425524814859169792-2xeb)

Anthropic docs
https://docs.anthropic.com

Claude Code Agent Teams
https://code.claude.com/docs/en/agent-teams

CrewAI
LangGraph

Todos están explorando la misma idea:
equipos de agentes con roles definidos.

---

## Mi conclusión

Durante años pensamos en AI como un asistente.

Lo que empieza a emerger ahora es algo diferente:

AI como un equipo completo de ingeniería.

Uno que puede:
- explorar soluciones en paralelo
- revisar problemas desde distintos ángulos
- dividir un problema complejo en especialidades

Para desarrollo mobile esto podría significar:
- mejores decisiones de arquitectura
- debugging más rápido
- code reviews más profundos

Algo que me llamó la atención del artículo de Tom es esto:

La comunidad lo construyó primero con workarounds.
Anthropic lo hizo nativo después.

Eso dice mucho sobre hacia dónde va todo esto.

Y lo interesante es que ya lo puedes probar hoy.

---

💭 Curioso saber qué opinan otros iOS / mobile developers.

Si pudieras armar un AI engineering team para tu próximo feature…

¿Qué roles tendría?

Performance
Accessibility
Security
Architecture

Cuéntame 👇
