# 📖 SwiftyJourney Blog - Guía de Características y Uso

Esta guía documenta todas las características avanzadas del blog de SwiftyJourney y cómo utilizarlas cuando crees contenido.

## 🎨 Resaltado de Código Avanzado

### Lenguajes Soportados

Nuestro blog utiliza **Shiki** para el resaltado de sintaxis, soportando más de 100 lenguajes de programación:

#### Lenguajes Principales:
- **Swift** (nuestro foco principal)
- **TypeScript** y **JavaScript**
- **HTML**, **CSS**, **SCSS**
- **JSON**, **YAML**, **XML**
- **Bash**, **Zsh**, **PowerShell**
- **Python**, **Go**, **Rust**
- **Markdown**, **MDX**

### Uso Básico de Bloques de Código

```markdown
```swift
import SwiftUI

struct MiVista: View {
    var body: some View {
        Text("¡Hola Mundo!")
    }
}
```
```

### Características Automáticas

1. **Tema Único**: Usa el tema `github-light` (sin modo oscuro ni cambio automático)
2. **Botón de Copia**: Aparece al hacer hover sobre cualquier bloque de código
3. **Números de Línea**: Disponibles para bloques largos
4. **Etiquetas de Lenguaje**: Aparecen automáticamente en la esquina superior derecha

## 🧩 Componentes Especiales

### Callouts/Alertas

Utiliza el componente `Callout` para resaltar información importante:

```markdown
<Callout type="info" title="Información">
Esto es una nota informativa con icono azul.
</Callout>

<Callout type="warning" title="Advertencia">
Esto es una advertencia con icono amarillo.
</Callout>

<Callout type="success" title="Éxito">
Esto indica algo exitoso con icono verde.
</Callout>

<Callout type="error" title="Error">
Esto indica un error con icono rojo.
</Callout>

<Callout type="tip" title="Consejo">
Esto es un consejo útil con icono naranja.
</Callout>
```

### Bloques de Código Interactivos

Para bloques de código con funcionalidad extra, puedes usar el componente `CodeBlock`:

```jsx
<CodeBlock language="swift" title="Ejemplo de SwiftUI">
```swift
struct ContentView: View {
    @State private var counter = 0
    
    var body: some View {
        VStack {
            Text("Contador: \\(counter)")
            Button("Incrementar") {
                counter += 1
            }
        }
    }
}
```
</CodeBlock>
```

## 📝 Escritura de Contenido

### Metadatos del Post

Cada post debe incluir estos metadatos en el frontmatter:

```yaml
---
title: 'Título del Artículo'
description: 'Descripción breve para SEO y preview'
pubDate: '2025-08-16'  # Formato: YYYY-MM-DD
updatedDate: '2025-08-17'  # Opcional, solo si actualizas
heroImage: '../../assets/mi-imagen.jpg'  # Opcional
lang: 'es'  # 'es' o 'en'
translationKey: 'unique-article-key'  # Para vincular traducciones
---
```

### Estructura Recomendada

```markdown
# Título Principal

Párrafo introductorio que engancha al lector...

## Sección Principal

### Subsección

Contenido con ejemplos de código:

```swift
// Tu código aquí
```

<Callout type="tip" title="Consejo Pro">
Siempre incluye ejemplos prácticos.
</Callout>

## Conclusión

Resumen de lo aprendido...
```

## 🌍 Sistema Multiidioma

### Creación de Artículos Traducidos

1. **Crea el archivo en español**: `mi-articulo.md`
2. **Crea la traducción en inglés**: `my-article-en.md`
3. **Usa el mismo `translationKey`** en ambos archivos
4. **Diferencia los `lang`**: `es` y `en`

### Ejemplo:

**Archivo español** (`swift-basico.md`):
```yaml
---
title: 'Swift Básico para Principiantes'
lang: 'es'
translationKey: 'swift-basics'
---
```

**Archivo inglés** (`swift-basics-en.md`):
```yaml
---
title: 'Swift Basics for Beginners'
lang: 'en'
translationKey: 'swift-basics'
---
```

## 🎯 Mejores Prácticas

### Para Código Swift

1. **Usa nombres descriptivos**:
```swift
// ❌ Evitar
func calc(a: Int, b: Int) -> Int { a + b }

// ✅ Mejor
func calculateSum(firstNumber: Int, secondNumber: Int) -> Int {
    return firstNumber + secondNumber
}
```

2. **Incluye comentarios explicativos**:
```swift
// Configuramos el estado inicial de la vista
@State private var isLoading = false

// Esta función maneja la lógica de login
private func handleLogin() {
    // Implementación...
}
```

3. **Muestra el contexto completo**:
```swift
import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    
    var body: some View {
        // Tu UI aquí
    }
}
```

### Para Tutoriales

1. **Comienza con un ejemplo simple**
2. **Agrega complejidad gradualmente**
3. **Incluye el resultado esperado**
4. **Menciona errores comunes**

## 📱 Optimización para Móviles

### Bloques de Código

- **Mantén líneas cortas** (máximo 80 caracteres)
- **Usa saltos de línea** para mejorar legibilidad
- **Evita scroll horizontal** excesivo

### Imágenes

- **Usa imágenes optimizadas** (WebP cuando sea posible)
- **Incluye alt text descriptivo**
- **Considera el modo oscuro** en screenshots

## 🚀 Performance

### Optimizaciones Automáticas

1. **Lazy loading** de imágenes
2. **Minificación** de CSS y JavaScript
3. **Compresión** de assets
4. **Static generation** con Astro

### Recomendaciones

- **Evita GIFs pesados** (usa videos con autoplay)
- **Optimiza imágenes** antes de subirlas
- **Usa componentes React** solo cuando necesites interactividad

## 🎨 Personalización de Estilos

### Variables CSS Disponibles

```css
/* Escala coral (acento de marca) */
--color-coral-500: #EC695B;
--color-coral-600: #DC5648;

/* Alias de acento (úsalos en los componentes) */
--color-accent:       var(--color-coral-500);  /* #EC695B */
--color-accent-hover: var(--color-coral-600);  /* #DC5648 */

/* Neutros cálidos */
--color-bg:            #F5F3EF;  /* fondo crema cálido */
--color-surface:       #FFFFFF;
--color-surface-alt:   #EBE8E2;
--color-text:          #0B0B0C;  /* casi negro */
--color-text-muted:    #5B5B60;
--color-text-subtle:   #8A8A90;
--color-border:        #E2DED7;
--color-border-strong: #CFC9BF;
```

> **Nota:** el tema es **light-only** — no existen variables `*-dark` ni modo oscuro. No introduzcas naranjas (`#f97316`) ni tokens de dark mode.

### Clases Utility Disponibles

```css
.prose          /* Estilo base para contenido */
.prose-sm       /* Texto más pequeño */
.prose-lg       /* Texto más grande */
.code-block     /* Estilo para bloques de código */
.callout        /* Estilo para componentes de alerta */
```

## 📊 Analytics y Métricas

### Tiempo de Lectura

Se calcula automáticamente basado en:
- **Velocidad promedio**: 200 palabras por minuto
- **Imágenes**: +12 segundos por imagen
- **Bloques de código**: +15 segundos por bloque

### Metadatos Automáticos

- **Reading time** en inglés/español
- **Fecha de publicación** formateada por idioma
- **Fecha de actualización** (si aplica)
- **Iconos** apropiados para cada tipo de metadata

## 🔧 Desarrollo y Testing

### Comandos Útiles

```bash
# Iniciar servidor de desarrollo
npm run dev

# Generar build de producción
npm run build

# Preview del build
npm run preview

# Verificar tipos
npm run typecheck
```

### Estructura de Archivos

```
src/
├── content/
│   └── blog/
│       ├── mi-post.md
│       └── my-post-en.md
├── components/
│   ├── Callout.astro
│   ├── CodeBlock.tsx
│   └── ArticleInfo.astro
├── layouts/
│   ├── BaseLayout.astro
│   └── BlogPost.astro
└── styles/
    └── global.css
```

## 📚 Recursos Adicionales

### Documentación

- [Astro Docs](https://docs.astro.build)
- [Shiki Themes](https://github.com/shikijs/shiki/blob/main/docs/themes.md)
- [MDX Guide](https://mdxjs.com/docs/)

### Herramientas Recomendadas

- **VS Code** con extensión Astro
- **Prettier** para formateo automático
- **ESLint** para linting
- **ImageOptim** para optimización de imágenes

---

Esta guía se actualiza regularmente. Si tienes sugerencias o encuentras errores, por favor crea un issue en el repositorio.