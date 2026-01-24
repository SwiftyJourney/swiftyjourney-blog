---
title: 'Swift Refresh 2025 – Día 5: IA moderna, Foundation Models y desarrollo con inteligencia artificial'
description: 'Un repaso profundo al Día 5 del Swift Refresh Workshop 2025: redes neuronales, Transformers, modelos on-device de Apple, FoundationModels y metodología práctica para integrar IA en apps.'
pubDate: 'Jan 23 2026'
heroImage: './hero.png'
lang: 'es'
translationKey: 'swift-refresh-2025-day5-ai-foundation-models-intelligence'
slug: 'swift-refresh-2025-dia-5-ia-moderna-foundation-models-inteligencia-artificial'
---

## De redes neuronales a Vibe Coding (sin humo, con criterio)

> **Objetivo de esta serie**
>
> Explicar qué hay *realmente* detrás de la IA moderna —desde las redes neuronales hasta el Vibe Coding— de forma **técnica pero entendible**, con **ejemplos amigables**, sin hype y con **criterio profesional**.

---

## 1. Redes neuronales: la base de todo

Una **red neuronal** es una estructura matemática inspirada (muy libremente) en el cerebro humano. No piensa, no razona, no entiende. **Calcula**.

Esta distinción es fundamental: cuando usas ChatGPT, Claude o cualquier modelo moderno, no estás hablando con una entidad que "comprende". Estás usando una máquina que ha aprendido patrones estadísticos a partir de millones de ejemplos.

### 1.1 ¿Qué es una neurona artificial?

Una neurona artificial es la unidad básica de procesamiento:

* recibe números de entrada (pueden ser píxeles, palabras codificadas, cualquier dato numérico)
* los multiplica por **pesos** (números que determinan la importancia de cada entrada)
* suma un **sesgo (bias)** (un valor constante que ajusta el umbral de activación)
* aplica una **función de activación** (como ReLU, sigmoid, que introduce no-linealidad)
* produce una salida (otro número)

La función matemática es fija. **Lo que cambia son los pesos**.

> **Idea clave**: aprender = ajustar pesos.

Durante el entrenamiento, un algoritmo (como backpropagation) ajusta estos pesos miles o millones de veces, comparando la salida esperada con la real, y corrigiendo gradualmente. Es un proceso de optimización matemática, no de comprensión.

### 1.2 Entrenamiento vs inferencia

Estos son dos fases completamente distintas:

* **Entrenamiento**: se ajustan pesos (costoso en tiempo, energía y hardware)
  * Requiere datasets masivos
  * Puede tomar semanas o meses
  * Consume enormes cantidades de recursos computacionales
  * Solo se hace una vez (o pocas veces) antes de desplegar el modelo

* **Inferencia**: los pesos están fijos, solo se usa el modelo
  * Es lo que haces cuando usas ChatGPT o cualquier modelo
  * Los pesos ya están entrenados
  * El modelo solo "calcula" con esos pesos fijos
  * Mucho más rápido y eficiente que el entrenamiento

Esto es crucial: **los modelos no aprenden mientras los usas**. Cuando le haces una pregunta a un LLM, no está "aprendiendo" de tu pregunta. Está usando conocimiento que ya fue entrenado previamente. El modelo es estático en tiempo de ejecución.

---

## 2. Capas y complejidad

Las redes se organizan en capas:

* entrada
* capas ocultas
* salida

Cada capa aprende patrones más complejos:

* bordes → texturas → formas → conceptos

Por eso una red profunda puede reconocer “un perro” y no solo píxeles.

---

### 2.1 Por qué importan las capas

Cada capa aprende a reconocer patrones en diferentes niveles de abstracción:

* **Primera capa**: detecta bordes, líneas básicas, cambios de color
* **Capas intermedias**: reconocen texturas, formas simples, combinaciones de bordes
* **Capas profundas**: identifican objetos completos, relaciones complejas, conceptos abstractos

**Ejemplo visual**: En una red que reconoce imágenes de perros:

* Capa 1: "hay un borde aquí, otro allá"
* Capa 3: "estos bordes forman una forma circular (ojos)"
* Capa 5: "estas formas sugieren la cara de un perro"
* Capa final: "esto es un perro"

Por eso una red profunda puede reconocer "un perro" y no solo píxeles. La profundidad permite que la red construya representaciones cada vez más abstractas y complejas.

### 2.2 El costo de la profundidad

Más capas = más capacidad de aprendizaje, pero también:

* Más parámetros (más memoria)
* Más tiempo de entrenamiento
* Mayor riesgo de sobreajuste
* Más difícil de interpretar

No siempre "más profundo es mejor". El diseño de arquitectura es un balance entre capacidad y eficiencia.

## 3. Transformers: el salto moderno

El gran cambio llega en 2017 con el paper de Google:

> **"Attention is All You Need"**

Aquí nace la arquitectura **Transformer**, que revoluciona completamente el procesamiento de lenguaje natural y se convierte en la base de todos los modelos modernos (GPT, Claude, Gemini, etc.).

### 3.1 La idea central: atención

Antes de los Transformers, las redes procesaban secuencias de forma estrictamente lineal (como las RNNs o LSTMs): palabra por palabra, de izquierda a derecha. Esto limitaba la capacidad de entender relaciones a larga distancia.

Un Transformer rompe esta limitación:

* mira **todos los tokens a la vez** (procesamiento paralelo)
* decide **a cuáles prestar atención** según el contexto
* puede relacionar cualquier token con cualquier otro, sin importar la distancia

Esto se llama **self-attention** (auto-atención): cada token "mira" a todos los demás y decide cuáles son relevantes para su interpretación.

**Por qué esto importa**: En la frase "El banco donde guardo mi dinero está cerrado", la palabra "banco" necesita relacionarse con "dinero" para entenderse correctamente, no con "río". La atención permite estas conexiones contextuales.

### 3.2 Tokens: cómo ve el mundo un modelo

Un modelo de lenguaje no ve palabras completas como los humanos. Ve **tokens**, que son unidades más pequeñas:

* **Palabras completas**: para palabras comunes ("el", "la", "y")
* **Sub-palabras**: lo más común, especialmente para palabras largas o raras
* **Símbolos**: caracteres individuales para casos especiales

Ejemplo de tokenización:

```plaintext
"perseguía" → ["per", "segu", "ía"]
"desarrollador" → ["des", "arroll", "ador"]
```

**Por qué esto importa**:

* Permite generalizar: si el modelo ve "perseguía" y "perseguir", reconoce el patrón común "persegu"
* Maneja vocabulario infinito: palabras nuevas se pueden descomponer en tokens conocidos
* Eficiencia: no necesita un vocabulario predefinido de millones de palabras

El tamaño del vocabulario de tokens típicamente está entre 30,000 y 100,000 tokens, pero puede representar millones de palabras diferentes mediante combinaciones.

### 3.3 Ejemplo friendly de atención

Imagina esta frase:

> "El perro que perseguía al gato comió pienso"

Cuando el modelo procesa "comió", la atención funciona así:

* **Alta atención a**: "perro", "comió", "pienso" (sujeto, verbo, objeto directo - la relación semántica principal)
* **Media atención a**: "gato", "perseguía" (contexto relevante pero secundario)
* **Baja atención a**: "el", "que", "al" (palabras funcionales, menos semánticas)

El modelo aprende estas relaciones **por estadística**, analizando millones de ejemplos similares. No hay reglas explícitas de gramática programadas.

> **Frase clave**: los Transformers entienden *probabilidad del significado*, no significado.

Esto significa que el modelo no "sabe" qué es un perro. Sabe que en contextos similares, "perro" aparece cerca de "comió" y "pienso" con alta probabilidad, y genera respuestas coherentes basándose en esos patrones estadísticos.

---

## 4. Modelos: parámetros, cuantización y contexto

Hoy evaluamos modelos por tres ejes fundamentales que determinan su capacidad, eficiencia y costo:

### 4.1 Parámetros

Los parámetros son los **pesos entrenados** de la red neuronal. Cada conexión entre neuronas tiene un peso, y estos pesos almacenan el "conocimiento" del modelo.

**Escala típica**:

* Modelos pequeños: 7B parámetros (7 billones)
* Modelos medianos: 70B parámetros
* Modelos grandes: 175B+ parámetros (GPT-4 se estima en ~1.7T)

**Por qué importa**:

* Más parámetros = más capacidad de almacenar patrones complejos
* Pero también = más memoria, más tiempo de inferencia, más costo

> Más parámetros = más capacidad (no siempre mejor).

La ley de rendimientos decrecientes aplica: duplicar parámetros no duplica la calidad. Modelos más pequeños y eficientes (como los de Apple on-device) pueden ser suficientes para muchos casos de uso.

### 4.2 Cuantización

La cuantización es cómo se representan esos pesos en memoria:

* **FP32** (32 bits, punto flotante): máxima precisión, mucho espacio
* **FP16** (16 bits): mitad de memoria, mínima pérdida de precisión
* **INT8** (8 bits): 4x menos memoria, pérdida de precisión aceptable
* **INT4** (4 bits): 8x menos memoria, pérdida de precisión más notable

**Trade-offs**:

Menos bits:

* ✅ menos memoria (crítico para dispositivos móviles)
* ✅ más velocidad (operaciones más rápidas)
* ✅ menor consumo de energía
* ❌ ligera pérdida de precisión

**Por qué Apple lo usa**: Para modelos on-device, la cuantización es esencial. Permite ejecutar modelos de 3-7B parámetros en un iPhone o Mac sin consumir toda la memoria disponible.

### 4.3 Ventana de contexto

La ventana de contexto es **cuántos tokens puede considerar a la vez** el modelo. Es el "límite de memoria" de la conversación.

**Ejemplos de ventanas**:

* GPT-3.5: 4K tokens (~3,000 palabras)
* GPT-4 Turbo: 128K tokens (~100,000 palabras)
* Claude 3.5 Sonnet: 200K tokens
* Modelos on-device: típicamente 4K-32K tokens

**Más contexto permite**:

* Conversaciones muy largas sin perder el hilo
* Análisis de documentos completos
* Razonamiento profundo sobre textos extensos

**Pero el costo crece cuadráticamente (O(n²))**:

Esto es crítico: si duplicas el contexto, el costo computacional se cuadruplica. Por eso los modelos con ventanas muy grandes son caros de ejecutar, y por eso Apple limita el contexto en modelos on-device.

**Implicación práctica**: Si tu app necesita procesar documentos largos, debes diseñar estrategias de truncamiento, resumen o chunking para mantener el contexto dentro de límites manejables.

---

## 5. Destilación y modelos podados

Cuando un modelo grande funciona bien pero es demasiado costoso para producción, hay técnicas para crear versiones más eficientes sin perder demasiada calidad.

### 5.1 Modelo destilado (Knowledge Distillation)

La destilación es un proceso de transferencia de conocimiento:

* **Modelo grande (teacher)**: el modelo original, potente pero lento
* **Modelo pequeño (student)**: un modelo más pequeño que se entrena para imitar al grande
* El pequeño aprende no solo de los datos, sino de las predicciones del grande

**Analogía educativa**:

* El teacher (profesor) sabe mucho pero es lento explicando
* El student (estudiante) aprende lo esencial del teacher
* Resultado: libro de 1000 páginas → resumen de 200 páginas que captura el 85% del conocimiento

**Por qué funciona**:
El modelo grande ha aprendido patrones sutiles y representaciones internas. El modelo pequeño puede aprender estas representaciones directamente, sin tener que redescubrir todo desde cero.

**Ventajas**:

* Más rápido (menos parámetros = menos cálculos)
* Más barato (menos memoria, menos GPU)
* Suficiente para muchos casos de uso
* Mantiene buena parte de la calidad del modelo original

**Cuándo usarlo**: Cuando necesitas inferencia rápida en dispositivos con recursos limitados, pero quieres mantener calidad razonable.

### 5.2 Modelo podado (Pruning)

La poda elimina partes del modelo que aportan poco al resultado final:

* **Neuronas**: se eliminan conexiones con pesos cercanos a cero
* **Capas**: se eliminan capas redundantes
* **Cabeza de atención**: en Transformers, se eliminan cabezas de atención que no aportan

**Estrategias**:

* **Magnitude pruning**: elimina pesos pequeños
* **Structured pruning**: elimina neuronas o capas completas (más eficiente)
* **Gradual pruning**: elimina gradualmente durante el entrenamiento

**Resultado**: Un modelo más pequeño que mantiene la mayoría de su capacidad, pero es más eficiente.

**Combinación común**: Muchos modelos modernos usan destilación + poda + cuantización para crear versiones ultra-eficientes para dispositivos móviles.

---

## 6. MoE: Mixture of Experts

MoE (Mixture of Experts) es una arquitectura que permite escalar modelos a tamaños masivos sin ejecutar todo el modelo en cada petición.

### 6.1 El problema

Un modelo gigante (digamos, 1 trillón de parámetros) enfrenta dos problemas fundamentales:

* **Memoria**: No puede cargarse completo en la mayoría de sistemas
* **Costo computacional**: Ejecutar todos los parámetros en cada petición es prohibitivamente caro

**Ejemplo**: Si GPT-4 tiene ~1.7T parámetros y cada petición ejecuta todo el modelo, el costo por token sería enorme. Además, muchos de esos parámetros no son relevantes para cada petición específica.

### 6.2 La idea MoE

> **No usar todo el cerebro todo el tiempo**.

En lugar de un modelo monolítico, MoE divide el modelo en múltiples "expertos" especializados:

* Cada experto es una sub-red neuronal especializada en ciertos tipos de tareas o patrones
* Un **router** (red pequeña) decide qué expertos activar para cada token
* Solo se ejecutan los expertos seleccionados, no todos

**Resultado**:

* Escalas a trillions de parámetros (el modelo total puede ser enorme)
* Usas solo una fracción por petición (típicamente 1-2 expertos de 8-128 disponibles)
* El costo por petición es mucho menor que ejecutar todo el modelo

**Analogía**: Un restaurante con 50 chefs especializados (italiano, japonés, mexicano, etc.). Cuando llega una orden de pizza, solo activas al chef italiano. No necesitas que todos los chefs trabajen en cada orden.

**Ejemplo real**:

* Modelo total: 1.4T parámetros
* Expertos activos por petición: ~37B parámetros (solo ~2.6% del modelo)
* Resultado: calidad de modelo gigante, costo de modelo mediano

**Por qué importa**: MoE es la arquitectura detrás de modelos como GPT-4 y Claude 3 Opus. Permite que estos modelos sean masivos sin ser prohibitivamente caros de ejecutar.

---

## 7. LoRA: afinación sin reentrenar

LoRA (Low-Rank Adaptation) es una técnica que permite adaptar modelos grandes a tareas específicas sin reentrenar todo el modelo.

### 7.1 El problema

Reentrenar un Transformer completo es extremadamente caro:

* **Costo computacional**: Requiere GPUs de alta gama durante días o semanas
* **Costo económico**: Miles de dólares en infraestructura cloud
* **Tiempo**: No es práctico para iteración rápida
* **Riesgo**: Puedes romper el conocimiento general del modelo

**Ejemplo**: Si quieres que GPT-4 escriba en el estilo de tu empresa, reentrenarlo completo costaría millones y tomaría meses. Además, podrías perder su capacidad general.

### 7.2 LoRA (Low-Rank Adaptation)

LoRA resuelve esto de forma elegante:

* **Congela el modelo base**: Los pesos originales no se tocan
* **Añade pequeñas matrices entrenables**: Solo entrena matrices de bajo rango (low-rank) que se insertan en capas específicas
* **Especializa el comportamiento**: El modelo aprende a adaptar sus respuestas para la tarea específica

**Cómo funciona técnicamente**:

En lugar de ajustar todos los pesos de una capa (que puede tener millones de parámetros), LoRA añade dos matrices pequeñas A y B. La modificación es: `W' = W + BA`, donde B y A son mucho más pequeñas que W original.

**Resultado**:

* Entrenas solo 0.1-1% de los parámetros originales
* El modelo base mantiene su conocimiento general
* Obtienes especialización para tu caso de uso

> **LoRA no hace al modelo más inteligente, lo hace más especializado**.

**Ejemplos prácticos**:

* **Estilo de escritura**: Adaptar un modelo para escribir como tu marca
* **Dominio concreto**: Especializar en medicina, derecho, código específico
* **Formato específico**: Generar siempre JSON, o seguir un template particular
* **Idioma/región**: Adaptar para español mexicano vs español español

**Por qué Apple lo usa extensivamente**:

Apple necesita modelos on-device que se adapten a diferentes usuarios y contextos sin reentrenar modelos completos. LoRA permite:

* Un modelo base compartido
* Adaptadores ligeros por usuario o tarea
* Actualizaciones rápidas sin reentrenar todo
* Mantener privacidad (el modelo base no cambia, solo los adaptadores locales)

**Ventaja clave**: Puedes tener múltiples LoRAs para diferentes tareas y activarlos según necesites, todo compartiendo el mismo modelo base eficientemente.

---

## 8. Hardware: por qué importa tanto

La IA moderna, en su esencia más básica, es:

> **multiplicación de matrices a gran escala**.

Cada vez que un modelo genera un token, está realizando millones de multiplicaciones de matrices. El hardware determina si esto toma segundos o milisegundos, y si es posible hacerlo en tu dispositivo o requiere un servidor.

### 8.1 CPU vs GPU

**CPU (Central Processing Unit)**:

* Diseñada para control y lógica secuencial
* Pocos núcleos (4-16 típicamente), pero muy potentes individualmente
* Excelente para tareas que requieren decisiones complejas
* **No ideal para IA**: Las operaciones de matrices son demasiado lentas

**GPU (Graphics Processing Unit)**:

* Diseñada originalmente para gráficos (muchas operaciones paralelas)
* Miles de núcleos simples trabajando en paralelo
* **Perfecta para IA**: Las multiplicaciones de matrices son inherentemente paralelizables
* Puede ser 10-100x más rápida que CPU para modelos de IA

**Analogía**:

* CPU = un chef experto que cocina un plato complejo paso a paso
* GPU = 1000 chefs simples que cocinan 1000 platos simples en paralelo

Para IA, necesitas el paralelismo masivo de la GPU.

### 8.2 Apple Silicon: el cambio de juego

Apple Silicon (M1, M2, M3, M4, M5) introduce arquitecturas que cambian completamente el panorama de IA local:

**Memoria unificada**:

* CPU y GPU comparten la misma memoria física
* No hay copias entre espacios de memoria separados
* Menor latencia (acceso directo)
* Más eficiencia energética

**Núcleos especializados**:

* **CPU cores**: Para lógica y control
* **GPU cores**: Para procesamiento paralelo general
* **Neural Engine**: Específicamente diseñado para operaciones de ML/IA
* **Núcleos tensoriales** (M4/M5): Hardware especializado para multiplicaciones de matrices

**Implicaciones prácticas**:

Con los núcleos tensoriales en GPU (M4/M5 especialmente):

* **Inferencia**: Ejecutar modelos de 3-7B parámetros en tiempo real
* **Fine-tuning**: Entrenar LoRAs localmente en minutos u horas
* **Entrenamiento ligero**: Entrenar modelos pequeños desde cero

**Comparación**:

* **Cloud (servidor remoto)**: Potente pero con latencia de red, costo por token, privacidad cuestionable
* **Apple Silicon local**: Latencia mínima, sin costo por uso, privacidad total, suficiente para muchos casos

Esto habilita **IA generativa local**: puedes tener ChatGPT-level de calidad ejecutándose completamente en tu Mac o iPhone, sin conexión a internet, con total privacidad.

**Por qué esto importa para FoundationModels**: Apple puede ofrecer modelos on-device precisamente porque su hardware está optimizado para este tipo de cargas de trabajo. Sin Apple Silicon, los modelos on-device serían demasiado lentos o requerirían modelos tan pequeños que perderían calidad.

---

## 9. IA generativa: realidad vs marketing

La IA generativa es la capacidad de crear contenido nuevo (texto, imágenes, audio, código) basándose en patrones aprendidos de datos de entrenamiento.

### 9.1 Qué hace realmente

La IA generativa:

* **Genera**: Produce texto, imagen, audio, código que no existía antes
* **No entiende**: No tiene comprensión semántica real, solo patrones estadísticos
* **Predice**: Cada token/píxel es una predicción probabilística basada en el contexto

**Ejemplo**: Cuando ChatGPT escribe "El perro corre", no "sabe" qué es un perro. Sabe que después de "El" y antes de "corre", la palabra "perro" tiene alta probabilidad según millones de ejemplos similares.

### 9.2 La realidad vs el marketing

**Marketing dice**: "La IA entiende y razona como humanos"

**Realidad**: La IA es extremadamente buena imitando comprensión humana, pero funciona de forma completamente diferente. Es como la diferencia entre un avión (vuela, pero no batiendo alas) y un pájaro (vuela batiendo alas).

> **La IA es un espejo**: devuelve lo que le das.

Si le das buenos prompts, devuelve buenas respuestas. Si le das datos sesgados, devuelve sesgo. Si le das contexto confuso, devuelve confusión. La calidad de la salida depende críticamente de la calidad de la entrada.

### 9.3 Por qué esto importa

**No reemplaza la inteligencia humana**:

* No tiene juicio crítico real
* No tiene valores éticos inherentes
* No puede evaluar la verdad de sus afirmaciones
* No tiene experiencia del mundo real

**La amplifica**:

* Puede procesar información más rápido que humanos
* Puede recordar más contexto simultáneamente
* Puede generar variaciones y explorar espacios de solución amplios
* Puede trabajar 24/7 sin cansancio

**Implicación práctica**: Como developer, debes usar la IA como herramienta de amplificación, no como reemplazo de tu criterio. La IA genera código, pero tú debes entenderlo, evaluarlo y decidir si es correcto.

---

## 10. RAG y agentes

Los modelos base tienen conocimiento limitado a su fecha de entrenamiento y no pueden acceder a información externa. RAG y agentes son dos técnicas que resuelven esto de formas diferentes.

### 10.1 RAG (Retrieval Augmented Generation)

RAG permite al modelo consultar documentos externos en tiempo real:

**Cómo funciona**:

1. **Indexación**: Los documentos se convierten en **embeddings** (vectores numéricos que representan significado)
2. **Búsqueda**: Cuando el usuario hace una pregunta, se busca en el índice los documentos más relevantes (búsqueda semántica)
3. **Contexto aumentado**: Los documentos relevantes se inyectan en el prompt del modelo
4. **Generación**: El modelo genera una respuesta usando tanto su conocimiento base como los documentos recuperados

**Ideal para**:

* **Manuales internos**: Documentación de tu empresa que el modelo no conoce
* **Documentación reciente**: Información que salió después del entrenamiento del modelo
* **Datos específicos**: Información que es única a tu dominio o aplicación
* **Hechos verificables**: Cuando necesitas que el modelo cite fuentes específicas

**Limitaciones**:

* **No entiende estructuras complejas**: Si tu documento tiene tablas, gráficos o relaciones complejas, RAG puede tener dificultades
* **Calidad de embeddings**: Si la búsqueda semántica falla, el modelo no recibe el contexto correcto
* **Límite de contexto**: Solo puedes inyectar una cantidad limitada de documentos en el prompt
* **Costo**: Cada búsqueda y generación consume tokens

**Ejemplo práctico**: Un chatbot de soporte que consulta la base de conocimiento de tu empresa. El modelo no sabe sobre tus productos específicos, pero RAG le permite acceder a esa información cuando es relevante.

### 10.2 Agentes de código

Un agente es un sistema que combina un LLM con la capacidad de **ejecutar acciones** en el mundo:

**Capacidades de un agente**:

* **Explora archivos**: Lee código, documentación, estructura del proyecto
* **Sigue referencias**: Navega imports, dependencias, llamadas de función
* **Ejecuta comandos**: Corre tests, compila, ejecuta código
* **Itera**: Basándose en resultados, ajusta su estrategia y vuelve a intentar

**Diferencia clave con RAG**:

* **RAG**: Carga información estática en el contexto
* **Agente**: Navega dinámicamente, decide qué explorar basándose en lo que encuentra

**Por qué importa**:

No carga todo en contexto. En lugar de intentar meter un repositorio completo de 10,000 archivos en el prompt (imposible), el agente:

1. Empieza con el archivo relevante
2. Lee referencias cuando las necesita
3. Explora solo lo necesario para la tarea

**Ejemplo**: Un agente que arregla un bug:

1. Lee el archivo con el error
2. Sigue el import a la función relacionada
3. Ejecuta los tests para ver qué falla
4. Lee la documentación relevante
5. Propone un fix
6. Ejecuta tests de nuevo para validar

**Limitaciones**:

* Puede hacer muchas llamadas (costoso en tokens)
* Puede entrar en loops si no está bien diseñado
* Requiere permisos para ejecutar código (riesgo de seguridad)

**Uso en IDEs**: Xcode Coding Intelligence y Cursor son ejemplos de agentes que navegan tu código dinámicamente en lugar de cargar todo el proyecto en contexto.

---

## 11. Modelos de razonamiento

Los modelos de razonamiento (también llamados "reasoning models" o modelos con "chain-of-thought") representan un avance importante: en lugar de generar una respuesta directa, el modelo **piensa paso a paso** antes de responder.

### 11.1 Cómo funcionan

A diferencia de modelos tradicionales que generan la respuesta final directamente, los modelos de razonamiento:

* **Exploran hipótesis**: Consideran múltiples enfoques posibles
* **Validan coherencia**: Verifican que sus pasos intermedios sean lógicos
* **Se autocorrigen**: Si detectan un error en su razonamiento, vuelven atrás y ajustan

**Proceso interno** (simplificado):

1. Recibe el prompt
2. Genera un "borrador" de razonamiento (pensamientos intermedios, no visibles al usuario)
3. Evalúa si el borrador es coherente
4. Refina el razonamiento si es necesario
5. Genera la respuesta final basada en el razonamiento validado

Toman tu prompt como **borrador**, lo refinan internamente antes de responder.

### 11.2 Por qué importa

**Modelos tradicionales**:

* Input → Output directo
* Pueden "alucinar" (generar respuestas que suenan correctas pero son incorrectas)
* Dificultad con tareas que requieren múltiples pasos

**Modelos de razonamiento**:

* Input → Razonamiento interno → Output
* Menos alucinaciones (el proceso de razonamiento es verificable)
* Mejor en tareas complejas que requieren múltiples pasos lógicos

### 11.3 Mejores para

Los modelos de razonamiento brillan en tareas que requieren pensamiento estructurado:

* **Debugging**: Analizar código, identificar el problema, proponer solución
* **Matemáticas**: Resolver problemas paso a paso, verificar cálculos
* **Planificación**: Descomponer tareas complejas en subtareas, considerar dependencias
* **Análisis**: Evaluar múltiples opciones, sopesar pros y contras

**Ejemplo**: En lugar de responder "El bug está en la línea 42" directamente, un modelo de razonamiento podría pensar:

1. "El error dice 'nil unwrapping', así que busco force unwraps"
2. "Encontré 3 force unwraps, pero solo uno puede ser nil en este contexto"
3. "La línea 42 tiene un force unwrap de un optional que puede ser nil"
4. "La solución es usar optional binding"

### 11.4 Trade-offs

**Ventajas**:

* Respuestas más confiables
* Proceso verificable (puedes ver el razonamiento)
* Mejor en tareas complejas

**Desventajas**:

* Más lento (genera más tokens internamente)
* Más costoso (más tokens = más costo)
* No siempre necesario (para tareas simples, es overkill)

**Cuándo usar**: Cuando la tarea requiere pensamiento lógico complejo, cuando la precisión es crítica, o cuando necesitas poder verificar el proceso de razonamiento.

---

## 12. Benchmarks: HumanEval vs SWE-bench

Los benchmarks miden qué tan bien los modelos pueden generar código. Pero no todos los benchmarks miden lo mismo, y entender la diferencia es crucial para evaluar modelos reales.

### 12.1 HumanEval

HumanEval es el benchmark más conocido para evaluar capacidades de coding:

**Características**:

* **Funciones aisladas**: Cada problema es una función independiente
* **Pass@k**: Mide cuántas de k soluciones generadas pasan los tests (pass@1, pass@10, pass@100)
* **Corrección funcional**: Solo importa que la función pase los tests, no cómo está escrita

**Ejemplo típico**:

```python
def reverse_string(s: str) -> str:
    # Tu código aquí
    pass
```

**Limitaciones**:

* No refleja trabajo real de ingeniería
* No requiere entender arquitectura
* No prueba manejo de dependencias
* No evalúa estilo, mantenibilidad, o mejores prácticas

**Por qué se usa**: Es fácil de automatizar, rápido de ejecutar, y da una métrica comparable entre modelos.

### 12.2 SWE-bench

SWE-bench (Software Engineering Benchmark) es más realista:

**Características**:

* **Repos reales**: Usa repositorios de código abierto reales (Django, scikit-learn, etc.)
* **Bugs multi-archivo**: Los bugs requieren cambios en múltiples archivos
* **Ingeniería real**: Debes entender la arquitectura, seguir convenciones, manejar dependencias

**Ejemplo típico**:

* Issue de GitHub real: "El método X falla cuando Y es None"
* Debes: encontrar dónde está el bug, entender el contexto, arreglarlo sin romper otras cosas, seguir el estilo del proyecto

**Por qué es mejor**:

* Refleja trabajo real de desarrollo
* Requiere comprensión de código existente
* Evalúa capacidad de navegar proyectos grandes
* Más cercano a lo que un developer hace día a día

**Limitación**: Es más difícil de automatizar y más lento de ejecutar.

> **HumanEval mide código aislado. SWE-bench mide trabajo real.**

### 12.3 Implicaciones prácticas

**Para evaluar modelos**:

* Si un modelo tiene buen HumanEval pero mal SWE-bench, es bueno para coding challenges pero no para trabajo real
* Si un modelo tiene buen SWE-bench, probablemente sea útil para desarrollo real

**Para elegir herramientas**:

* IDEs con IA que solo pasan HumanEval pueden fallar en proyectos reales
* Herramientas que navegan código (como Xcode Coding Intelligence) están diseñadas para SWE-bench-style tasks

**Para tu trabajo**:

* No te fíes solo de métricas de HumanEval
* Prueba el modelo en tu código real
* Evalúa si puede navegar tu arquitectura, entender tus convenciones, y hacer cambios que no rompan cosas

---

## 13. Vibe Coding e IDEs con IA

"Vibe Coding" es un término que describe un estilo de desarrollo donde dejas que la IA genere código y tú te enfocas en validar y refinar.

### 13.1 Vibe Coding: qué es y cuándo funciona

**Definición**: Dejar que la IA escriba código y tú validar que funcione y sea correcto.

**Útil para**:

* **Prototipos**: Explorar ideas rápidamente, ver qué funciona antes de invertir tiempo
* **Boilerplate**: Código repetitivo que conoces bien pero es tedioso escribir
* **Exploración**: Probar diferentes enfoques sin escribir todo manualmente
* **Aprendizaje**: Ver cómo la IA resuelve problemas para aprender nuevos patrones

**Riesgos**:

* **No entender lo que se construye**: Si no entiendes el código generado, no puedes mantenerlo ni debuggearlo
* **Dependencia excesiva**: Perder habilidades de coding fundamentales
* **Código de baja calidad**: La IA puede generar código que funciona pero tiene problemas de diseño
* **Sesgo de confirmación**: Aceptar código porque "funciona" sin evaluar si es la mejor solución

**Mejores prácticas**:

> **La IA amplifica tu criterio. Si no hay criterio, amplifica el caos.**

* Siempre lee y entiende el código generado
* Evalúa si es la solución correcta, no solo si funciona
* Refactoriza si es necesario
* Usa la IA como herramienta, no como reemplazo

### 13.2 IDEs con IA: el panorama actual

**Realidad del mercado**:

No hay IDEs completamente nuevos diseñados desde cero para IA. Lo que existe son:

* **Forks de VS Code**: Cursor, Continue, etc. - VS Code con IA integrada
* **Extensiones**: GitHub Copilot, Codeium, etc. - IA añadida a IDEs existentes

**Cursor**:

* Lidera en features de IA (chat, edición, navegación)
* Buena experiencia general
* **Pero**: **no recomendado para desarrollo Apple**

**Por qué no para Apple**:

* No tiene soporte nativo para Swift/SwiftUI
* No integra bien con herramientas de Apple (Instruments, etc.)
* No aprovecha características específicas de Apple (como FoundationModels)
* La experiencia de desarrollo Apple requiere Xcode

**Para desarrollo Apple**:

* **Xcode + IA integrada**: La mejor opción
  * Coding Intelligence (Claude integrado)
  * Soporte nativo completo
  * Integración con todo el ecosistema Apple
  * Acceso a FoundationModels y APIs de Apple

**Recomendación**: Si desarrollas para Apple, usa Xcode. Si desarrollas para otras plataformas, Cursor puede ser una buena opción, pero evalúa si realmente necesitas cambiar de VS Code.

---

## 14. LLMs en local

Ejecutar modelos de lenguaje localmente (en tu Mac, sin conexión a internet) se ha vuelto completamente viable gracias a Apple Silicon y herramientas como LM Studio y Ollama.

### 14.1 Por qué ejecutar modelos localmente

**Ventajas**:

* **Privacidad total**: Tus datos nunca salen de tu dispositivo
* **Sin costo por token**: Una vez descargado el modelo, usarlo es gratis
* **Sin latencia de red**: Respuestas instantáneas
* **Funciona offline**: No necesitas internet
* **Control total**: Puedes usar cualquier modelo, ajustar parámetros, etc.

**Desventajas**:

* **Recursos limitados**: Modelos más pequeños que en cloud (típicamente 3-7B parámetros vs 70B+ en cloud)
* **Calidad**: Modelos locales suelen ser menos capaces que los mejores modelos cloud
* **Memoria**: Requiere bastante RAM (8-16GB mínimo para modelos decentes)

**Cuándo tiene sentido**: Para desarrollo, prototipado, casos de uso donde la privacidad es crítica, o cuando quieres experimentar sin costos.

### 14.2 LM Studio

**Características**:

* **GUI**: Interfaz gráfica amigable, no necesitas CLI
* **MLX**: Optimizado para Apple Silicon usando MLX (framework de Apple para ML)
* **Apple Silicon**: Aprovecha Neural Engine y GPU cores eficientemente

**Ideal para**: Usuarios que quieren una experiencia tipo ChatGPT pero local, sin tocar código.

**Uso típico**: Descargas un modelo, abres la GUI, chateas con él. Simple y directo.

### 14.3 Ollama

**Características**:

* **CLI**: Interfaz de línea de comandos, más flexible
* **API compatible OpenAI**: Puedes usar las mismas librerías que usas para OpenAI
* **Automatización**: Fácil de integrar en scripts y aplicaciones

**Ideal para**: Developers que quieren integrar modelos locales en sus apps o workflows automatizados.

**Uso típico**: Instalas Ollama, descargas un modelo (`ollama pull llama2`), y lo usas desde código Swift/Python/etc. como si fuera OpenAI.

### 14.4 Modelos clave disponibles

**DeepSeek**:

* Modelo chino de alta calidad
* Buen balance entre tamaño y capacidad
* Especializado en código y razonamiento

**GPT-OSS** (modelos open source):

* Varios modelos inspirados en GPT
* Diferentes tamaños disponibles
* Comunidad activa

**Devstral**:

* Especializado en código
* Basado en Mistral
* Bueno para tareas de desarrollo

**Qwen / Gemma**:

* Modelos de Alibaba y Google respectivamente
* Multilingües (especialmente Qwen)
* Buena calidad general

**Recomendación**: Para desarrollo, Devstral o DeepSeek. Para uso general, Qwen o modelos basados en Llama.

### 14.5 El gap cloud–local se cierra rápido

**Hace 2 años**: Modelos locales eran juguetes, calidad muy inferior a cloud.

**Hoy**:

* Modelos de 7B parámetros locales pueden competir con modelos cloud de hace 1-2 años
* Para muchos casos de uso, la calidad es suficiente
* La velocidad y privacidad compensan la diferencia de calidad

**Futuro**: Con mejor hardware (M5, M6) y técnicas de optimización, el gap seguirá cerrándose. Para muchos desarrolladores, modelos locales ya son la opción preferida para desarrollo y prototipado.

---

## 15. Best practices para Vibe Coding

Usar IA para generar código es poderoso, pero requiere disciplina y criterio. Estas prácticas te ayudan a aprovechar la IA sin caer en trampas comunes.

### 15.1 Principios fundamentales

**La IA no hace el trabajo por ti**:

* Tú sigues siendo responsable del código
* La IA es una herramienta, no un reemplazo
* El código generado debe pasar por tu revisión y aprobación

**Entiende y evalúa el código**:

* Siempre lee el código generado antes de usarlo
* Verifica que hace lo que necesitas
* Asegúrate de que sigue tus estándares y convenciones

**Trátala como un developer junior**:

* Da instrucciones claras y específicas
* Revisa su trabajo antes de aceptarlo
* Corrige errores y pide mejoras cuando sea necesario
* No asumas que siempre tiene razón

### 15.2 Evita trampas comunes

**Sesgo de confirmación**:

* No aceptes código solo porque "funciona"
* Evalúa si es la mejor solución, no solo si pasa los tests
* Considera alternativas antes de decidir

**No copies/pegues a ciegas**:

* Cada pieza de código debe tener un propósito claro
* Elimina código innecesario que la IA pueda haber generado
* Asegúrate de que el código encaja en tu arquitectura

### 15.3 Mejores prácticas de prompts

**Da prompts detallados**:

* Especifica el contexto (qué hace tu app, qué framework usas)
* Indica restricciones (estilo, performance, dependencias)
* Proporciona ejemplos cuando sea relevante

**Divide problemas grandes**:

* En lugar de "hazme una app completa", pide features específicas
* Construye iterativamente
* Valida cada pieza antes de continuar

**Ejemplo de buen prompt**:

```plaintext
"Necesito una función en Swift que valide emails. 
Debe usar regex, retornar un Bool, y seguir las convenciones de Swift. 
Incluye comentarios de documentación."
```

**Ejemplo de mal prompt**:

```plaintext
"hazme validar emails"
```

### 15.4 Casos de uso ideales para IA

**Explicar código**:

* "¿Qué hace esta función?"
* "¿Por qué este código falla?"
* "¿Cómo puedo optimizar esto?"

**Tests**:

* Generar tests unitarios
* Crear casos de prueba edge cases
* Escribir tests de integración

**Documentación**:

* Generar comentarios de documentación
* Crear READMEs
* Escribir guías de uso

**Refactors**:

* Modernizar código legacy
* Aplicar mejores prácticas
* Mejorar legibilidad

### 15.5 Cuándo NO usar IA

**No uses IA para**:

* Aprender fundamentos (aprende primero, luego usa IA para acelerar)
* Código crítico de seguridad sin revisión exhaustiva
* Decisiones arquitectónicas importantes (tú debes entender la arquitectura)
* Cuando no tienes tiempo para revisar el código generado

> **La IA amplifica tu criterio. Si no hay criterio, amplifica el caos.**

Si no tienes el conocimiento para evaluar el código generado, no deberías usarlo en producción. La IA es una herramienta para developers experimentados, no un atajo para evitar aprender.

---

## 16. El Foundation Model de Apple (FoundationModels)

Para cerrar el día 5, entramos a la parte más “productizable” de todo el workshop: **usar el modelo de lenguaje on-device de Apple desde Swift**, a través del framework **FoundationModels**.

### 16.0 La propuesta de Apple

La propuesta de Apple es muy clara y se diferencia fundamentalmente de los modelos cloud:

* **El modelo vive en el sistema** (on-device): No requiere conexión a internet, no envía datos a servidores externos
* **Tu app accede mediante una API nativa**: Integración directa con Swift, sin wrappers ni SDKs de terceros
* **Priorizan privacidad**: Tus datos nunca salen del dispositivo
* **Latencia baja**: Sin round-trips de red, respuestas casi instantáneas
* **Experiencias integradas**: El modelo puede acceder a información del sistema (calendario, contactos, etc.) de forma segura y privada

**Por qué esto importa**:

Mientras que ChatGPT, Claude y otros modelos cloud ofrecen máxima capacidad a cambio de privacidad y latencia, FoundationModels ofrece un balance diferente: capacidad suficiente para muchos casos de uso, con privacidad total y latencia mínima.

**Cuándo usar FoundationModels vs modelos cloud**:

* **FoundationModels**: Cuando la privacidad es crítica, necesitas respuestas instantáneas, o quieres funcionar offline
* **Modelos cloud**: Cuando necesitas máxima capacidad, modelos más grandes, o features avanzadas que requieren modelos de 70B+ parámetros

### 16.1 Por qué usamos `#Playground` dentro de un proyecto (y no un `.playground` suelto)

En Xcode, el macro **`#Playground`** permite ejecutar un bloque como si fuera un Playground, **pero dentro de un archivo Swift normal del proyecto**. Es ideal para experimentar sin salirte del target real de la app.

Esto resuelve un problema práctico:

* Hay frameworks/APIs que **no funcionan bien en un Playground aislado**.
* En cambio, dentro de un proyecto completo, el código se compila y ejecuta con el mismo entorno del app target.

> En otras palabras: `#Playground` te da el flujo “rápido” de un Playground, sin abandonar el contexto real del proyecto.

### 16.2 El punto de entrada: `SystemLanguageModel`

El modelo base se expone como **`SystemLanguageModel.default`**. Apple recomienda **verificar disponibilidad** antes de generar contenido.

Conceptualmente, piensa en esto como:

* “¿El dispositivo soporta el modelo on-device?”
* “¿Está disponible y listo para usarse?”

### 16.3 `LanguageModelSession`: una conversación con memoria (estado)

Apple modela la interacción con el LLM como una **sesión**:

* mantiene contexto entre llamadas
* puedes reutilizarla para experiencias “con hilo”
* o crear una nueva para tareas aisladas

La sesión puede configurarse con:

* **instrucciones** (rol/estilo)
* **tools** (si aplica)
* **transcripts** (historial/contexto)
* **modelo/adaptadores** (variantes especializadas)

### 16.4 Guardrails: seguridad por defecto

El framework incluye **guardrails** (barandales) que filtran o bloquean salidas según políticas de seguridad. En términos simples: límites para evitar contenido no deseado.

**Qué son los guardrails**:

Los guardrails son filtros que Apple aplica automáticamente para:

* **Contenido inapropiado**: Bloquea generación de contenido ofensivo, violento, etc.
* **Información sensible**: Puede bloquear generación de información personal si se detecta
* **Uso malicioso**: Previene ciertos tipos de prompts que podrían ser problemáticos

**Cómo funcionan**:

Los guardrails operan de forma transparente:

* Se ejecutan durante la generación
* Pueden bloquear completamente una respuesta
* O pueden modificar/redactar partes de la respuesta
* El framework te notifica si se activaron

**Manejo de guardrails**:

```swift
do {
  let response = try await session.respond(to: prompt)
  // Respuesta generada exitosamente
} catch {
  // El error puede indicar que los guardrails bloquearon la generación
  // Maneja el error apropiadamente
}
```

**Limitaciones**:

* Los guardrails no son perfectos: pueden bloquear contenido legítimo o permitir contenido problemático
* Son conservadores por defecto: priorizan seguridad sobre funcionalidad
* No puedes desactivarlos: son parte del sistema de seguridad de Apple

**En producción**: Siempre maneja el caso donde los guardrails bloquean una generación. Muestra un mensaje apropiado al usuario en lugar de fallar silenciosamente.

### 16.5 Formas de generar: `respond` vs `streamResponse`

Hay dos formas principales de “pedir” una generación:

* **`respond(...)`**: te devuelve una respuesta completa cuando termina.

  * Simple y directo.
  * Desventaja: el usuario ve “espera” (y se nota si tarda).

* **`streamResponse(...)`**: te permite recibir la salida **por partes**.

  * Mejor UX.
  * Puedes ir pintando en pantalla conforme llega.

> Para apps reales, **streaming suele ser la experiencia correcta**.

---

## 16.6 Generación tipada: `@Generable` + `@Guide`

Una de las partes más elegantes de FoundationModels es que no solo genera texto: puede generar **estructuras Swift tipadas**.

Aquí el punto es cambiar el juego de:

* “genera un texto de receta”

A:

* “genera un `Recipe` válido siguiendo este contrato”

### `Recipe` como contrato de salida

```swift
@Generable(description: "Structure for cooking recipes")
struct Recipe {
  @Guide(description: "Suggested name for the plate")
  let name: String

  @Guide(description: "Small and yummy description")
  let description: [String]

  @Guide(description: "List of ingredients for the recipe", .count(4...20))
  let ingredients: [Ingredient]

  @Guide(description: "Steps to create the recipe")
  let steps: [String]

  @Guide(description: "Time needed to prepare the recipe in minutes", .range(5...180))
  let preparationTime: Int

  @Guide(description: "Level of difficulty", .anyOf(["Easy", "Medium", "Difficult"]))
  let difficulty: String
}

@Generable(description: "Ingredients for the kitchen recipe")
struct Ingredient {
  let name: String
  let quantity: Double

  @Guide(.anyOf(["gr", "kg", "ml", "l", "units", "cups", "tsp", "tbsp", "oz", "g"]))
  let unit: String
}
```

**Qué logras con esto**:

* Pasas de “texto libre” a **datos utilizables**.
* `ingredients` ya no es una lista de strings ambiguos; ahora tiene **nombre + cantidad + unidad**.
* `anyOf` obliga a que las unidades sean consistentes (ideal para UI, listas del súper, conversiones).

> Esto no hace al modelo más inteligente. Hace el problema más claro.

---

## 16.7 `respond` tipado: respuesta completa

Cuando usas `generating: Recipe.self`, el `response` regresa tipado:

* `LanguageModelSession.Response<Recipe>`

Y obtienes el objeto real:

```swift
let recipe = response.content
```

Ejemplo rápido:

```swift
#Playground {
  guard SystemLanguageModel.default.isAvailable else {
    return print("Foundation Model is not available on this device")
  }

  let session = LanguageModelSession()

  do {
    let response = try await session.respond(
      to: "Create a recipe for a delicious pizza",
      generating: Recipe.self
    )

    let recipe = response.content

    print("Recipe: \(recipe.name)")
    print("Time: \(recipe.preparationTime) min")

    for ingredient in recipe.ingredients {
      print("> \(ingredient.name), \(ingredient.quantity) - \(ingredient.unit)")
    }

    for step in recipe.steps {
      print("* \(step)")
    }
  } catch {
    print("Generation failed: \(error)")
  }
}
```

**Trade-off**: el usuario espera hasta que termina.

---

## 16.8 Streaming tipado: experiencia de producto

Cuando el usuario toca “Generate recipe”, `respond` puede tardar y se nota. Con streaming, recibes un **`Recipe.PartiallyGenerated`** que se va llenando conforme el modelo genera.

### ViewModel con streaming

```swift
@MainActor
@Observable
final class RecipeGeneratorVM {
  var partialRecipe: Recipe.PartiallyGenerated?

  let session = LanguageModelSession(
    instructions: "You are a professional chef that works years ago in TV, and you are able to create the best recipes as easy as just say the plate you want. Make it funny and direct."
  )

  func generateRecipe(for recipe: String) async throws {
    let stream = session.streamResponse(
      to: "Create a recipe for the plate \(recipe)",
      generating: Recipe.self
    )

    for try await partial in stream {
      self.partialRecipe = partial.content
    }
  }
}
```

### Vista SwiftUI: pintando “en vivo”

```swift
struct RecipeView: View {
  @State private var viewModel = RecipeGeneratorVM()
  @State private var recipe = ""

  var body: some View {
    ScrollView {
      VStack(spacing: 20) {
        Text("Tim Cook")
          .font(.largeTitle)

        TextField("What do you want to eat today?", text: $recipe)
          .textFieldStyle(.roundedBorder)

        Button {
          Task {
            try? await viewModel.generateRecipe(for: recipe)
          }
        } label: {
          Text("Generate recipe \(Image(systemName: "cooktop"))")
        }
        .buttonStyle(.bordered)

        VStack(alignment: .leading) {
          if let description = viewModel.partialRecipe?.description {
            Text(description)
              .foregroundStyle(.secondary)
          }

          VStack {
            if let ingredients = viewModel.partialRecipe?.ingredients {
              ForEach(ingredients, id: \.name) { ingredient in
                Text("* \(ingredient.name ?? "")")
                  .frame(maxWidth: .infinity, alignment: .leading)
              }
            }
          }
          .padding(.vertical)

          if let steps = viewModel.partialRecipe?.steps {
            ForEach(steps, id: \.self) { step in
              Text("> \(step)")
                .frame(maxWidth: .infinity, alignment: .leading)
            }
          }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
      }
    }
    .safeAreaPadding()
  }
}

#Preview {
  RecipeView()
}
```

**Qué gana el usuario**:

* ve progreso inmediato
* siente que la app es rápida
* la UI se va poblando conforme llegan los partials

**Qué ganas tú como dev**:

* no necesitas inventar “spinners” largos
* el patrón encaja con SwiftUI de forma natural

---

## 16.9 Manejo de errores y edge cases

FoundationModels puede fallar de varias formas. Entender y manejar estos casos es crucial para una app robusta.

### 16.9.1 Tipos de errores comunes

**Modelo no disponible**:

```swift
guard SystemLanguageModel.default.isAvailable else {
  // Maneja el caso donde el modelo no está disponible
  return
}
```

**Guardrails activados**:

```swift
do {
  let response = try await session.respond(to: prompt)
} catch {
  // Los guardrails pueden bloquear la generación
  // Muestra un mensaje apropiado al usuario
}
```

**Timeout o cancelación**: Si la generación tarda demasiado o el usuario cancela, el stream puede lanzar un error.

**Límites de contexto excedidos**: Si el transcript es demasiado largo, el modelo puede rechazar la petición.

### 16.9.2 Estrategias de manejo

**Verificación proactiva**:

* Siempre verifica `isAvailable` antes de usar el modelo
* Valida el tamaño del input antes de enviarlo
* Establece timeouts razonables

**Fallbacks**:

* Si el modelo falla, degrada a una feature sin IA
* Ofrece alternativas al usuario
* Guarda el estado para reintentar más tarde

**Feedback al usuario**:

* Explica qué salió mal de forma clara
* Ofrece acciones que el usuario puede tomar
* No falles silenciosamente

### 16.9.3 Guardrails: qué bloquean

Los guardrails bloquean:

* Contenido ofensivo o inapropiado
* Información personal sensible
* Prompts que intentan evadir restricciones
* Contenido que viola políticas de Apple

**No puedes desactivarlos**, pero puedes:

* Diseñar prompts que eviten activarlos
* Manejar errores gracefully cuando se activan
* Proporcionar contexto adicional si es necesario

### 16.9.4 Límites del modelo on-device

**Límites conocidos**:

* **Contexto limitado**: Típicamente 4K-32K tokens (menos que modelos cloud)
* **Capacidad**: Modelos más pequeños que cloud (3-7B vs 70B+)
* **Velocidad**: Puede ser más lento en dispositivos más antiguos
* **Memoria**: Consume RAM del dispositivo

**Cómo trabajar dentro de los límites**:

* Trunca inputs largos antes de enviarlos
* Usa resúmenes para contexto histórico
* Limita el tamaño de arrays en `@Generable`
* Monitorea el uso de memoria

---

## 16.10 Optimización y performance

Usar FoundationModels eficientemente requiere entender cómo medir y optimizar el consumo de recursos.

### 16.10.1 Medición de tokens

**Por qué importa**:

* Los tokens determinan el costo computacional
* Más tokens = más tiempo de generación
* Más tokens = más memoria consumida
* Más tokens = mayor latencia

**Cómo estimar**:

* 1 token ≈ 0.75 palabras en inglés
* 1 token ≈ 1-2 palabras en español
* Strings largos = más tokens

**Qué medir**:

* Tokens de input (prompt + transcript)
* Tokens de output (respuesta generada)
* Tokens totales por sesión
* Tiempo de generación

### 16.10.2 Estrategias para reducir tokens

**Prompts concisos**: Ve directo al punto, elimina palabras innecesarias, usa instrucciones claras.

**Instrucciones en la sesión**: En lugar de repetir instrucciones en cada prompt, configúralas una vez en la sesión.

**Limitar contexto histórico**: No mantengas conversaciones infinitas, resume o trunca el transcript cuando sea necesario.

**Usar `@Generable`**: Genera datos estructurados en lugar de texto largo, más eficiente que texto libre.

### 16.10.3 Caching de sesiones

**Cuándo cachear**:

* Sesiones que se reutilizan frecuentemente
* Conversaciones que el usuario puede retomar
* Contexto que no cambia mucho

**Cuándo no cachear**:

* Sesiones efímeras para tareas puntuales
* Cuando el contexto es muy grande
* Cuando la memoria es limitada

### 16.10.4 Monitoreo y métricas

**Qué monitorear**:

* Tiempo de generación promedio
* Tasa de errores
* Uso de memoria
* Tamaño de respuestas
* Frecuencia de uso

**Por qué importa**: Sin métricas, no sabes si tu app está funcionando bien o si hay problemas de performance que afectan la experiencia del usuario.

---

## Conclusión

La IA moderna no es magia.

Es:

* estadística
* ingeniería
* hardware
* decisiones humanas

Si entiendes esto, **ya estás muy por delante de la media**.

---

## 17. Metodología de desarrollo con FoundationModels

Apple insiste en algo: antes de integrar IA en tu app, primero entiéndela y mídela. Estas recomendaciones, basadas en las mejores prácticas de Apple, te ayudan a construir features de IA robustas y predecibles.

### 17.1 Prototipa primero con #Playground

Antes de tocar tu arquitectura, UI o flujos reales, usa `#Playground` como laboratorio de experimentación.

**Qué probar en el Playground**:

* **Prompts**: Prueba diferentes formas de formular tus prompts
* **Estructuras @Generable**: Experimenta con diferentes diseños de estructuras
* **Restricciones @Guide**: Prueba qué restricciones funcionan mejor
* **respond vs streamResponse**: Compara ambas opciones para tu caso de uso
* **Límites y errores**: Descubre qué pasa cuando excedes límites

**Qué descubrir**:

* Qué hace bien el modelo
* Dónde se rompe o falla
* Qué tipos de prompts lo guían mejor
* Qué guardrails pueden bloquear casos legítimos
* Cuáles son los límites prácticos

**Regla práctica**: Todo experimento primero vive en `#Playground`, luego pasa a app.

### 17.2 Mide tokens desde el inicio

El costo y los límites reales están en los tokens. No esperes hasta producción para medirlos.

**Qué medir**:

* Cuántos tokens usas por petición
* Compara el total de tokens por iteración
* Mide el "tamaño" de tus entradas y salidas
* Rastrea cómo crecen los tokens con el uso

**Por qué importa**:

Esto te ayuda a evitar el error más común: **"funciona en demo, pero falla en producción con inputs reales"**.

### 17.3 Stress testing del contexto

Identifica "hasta dónde el sistema puede tragar" antes de que los usuarios lo descubran.

**Qué probar**:

* ¿Qué pasa si el usuario pega un texto muy largo?
* ¿Si mandas 10x más contenido de lo normal?
* ¿Si el transcript crece indefinidamente?
* ¿Si le das 30 ingredientes o 200 en un `@Generable`?

**Qué encontrar**:

* **Límite operativo cómodo**: Donde el sistema funciona bien
* **Límite de degradación**: Donde empieza a funcionar mal pero no falla
* **Límite de fallo**: Donde el sistema falla completamente

**Qué definir con esta información**:

* **Estrategias de truncamiento**: Cómo cortar inputs largos
* **Resúmenes intermedios**: Cómo resumir contexto histórico
* **Límites de UI**: Máximo de caracteres en campos de texto
* **Validaciones**: Verifica tamaño antes de llamar al modelo

### 17.4 Presupuestos de tokens

No solo se trata de "cuántos tokens" sino de cómo se distribuyen.

**Componentes del presupuesto**:

* **Tokens de prompt (input)**: Lo que envías al modelo
* **Tokens de transcript (historial)**: Contexto de conversaciones previas
* **Tokens de output (respuesta)**: Lo que genera el modelo
* **Tokens extra**: Por traducción, reescrituras, o procesamiento adicional

**Por qué importa**:

Si no lo mides, el sistema se vuelve impredecible: **funciona hoy, no mañana**.

### 17.5 Cuándo usar @Generable vs texto libre

Esta es una recomendación muy fuerte de Apple: **si puedes, usa `@Generable`**.

**Problema con texto libre**:

Cuando generas texto largo libre, típicamente gastas más tokens porque:

* El modelo tiene que "explicar" más
* Se repite información
* Agrega palabras de relleno y transición
* El formato puede variar

**Ventajas de @Generable**:

* El output está estructurado y predecible
* El modelo llena campos específicos
* Se reduce ambigüedad
* Usualmente más eficiente (menos "palabrería")
* Integración directa con tu código Swift

**Regla de producto**:

> En producto, casi siempre tiene sentido: **genera datos → renderiza tú la UI**.

En lugar de que el modelo genere HTML o markdown, genera estructuras de datos y tú renderizas la UI. Esto te da más control y es más eficiente.

**Cuándo usar texto libre**:

* Contenido creativo extenso (artículos, historias)
* Cuando el formato debe ser completamente flexible
* Cuando el usuario necesita editar el resultado directamente

### 17.6 Ajuste de límites del modelo

Usa `#Playground` no solo para "ver si funciona", sino para **definir tus reglas**.

**Qué definir**:

* **Máximo de caracteres en input**: Basado en tus stress tests
* **Máximo de items**: Por ejemplo, ingredientes `.count(4...20)`
* **Rangos numéricos**: `.range(5...180)` para tiempos de preparación
* **Opciones cerradas**: `.anyOf(["Easy", "Medium", "Difficult"])` para dificultad
* **Manejo de errores**: Qué hacer cuando los guardrails bloquean

**Resultado**:

Esto transforma tu integración de **"prueba y error"** a **contratos claros** (sistema de tipos + restricciones + UX).

### 17.7 Manejo de idiomas y traducción

Todo lo que implique traducción consume tokens adicionales.

**Problemas comunes**:

* **Input en un idioma, output en otro**: El modelo hace trabajo extra de traducción
* **Usuario mezcla idiomas**: Aumenta complejidad y tokens
* **Multilenguaje sin estrategia**: Resultados impredecibles

**Estrategias**:

**Opción 1: Normalizar al idioma del usuario**

* Detecta el idioma del usuario
* Siempre trabaja en ese idioma
* Más simple, pero requiere detección

**Opción 2: Idioma base + traducción al final**

* Trabaja en un idioma base (p. ej., inglés)
* Traduce al final si es necesario
* Más control, pero más complejo

**Recomendación**: Para apps con usuarios de un solo idioma, normaliza. Para apps multilenguaje, considera un idioma base.

---

La metodología de desarrollo con FoundationModels se resume en una frase:

> Prototipa en Playground, mide tokens, define límites y usa datos tipados siempre que puedas.

Con esto, ya no estás "probando IA". Estás diseñando una feature con ingeniería real.

---

## 18. Checklist: Antes de enviar una feature de IA

Este checklist ayuda a asegurar que tu integración de FoundationModels esté lista para producción.

### 18.1 Prototipado y validación

* [ ] Experimentaste con `#Playground` antes de implementar
* [ ] Probaste diferentes prompts y estructuras
* [ ] Validaste que `@Generable` funciona para tu caso de uso
* [ ] Comparaste `respond` vs `streamResponse` y elegiste la mejor opción
* [ ] Identificaste qué guardrails pueden afectar tu app

### 18.2 Medición y límites

* [ ] Mides tokens (o estimas basado en palabras)
* [ ] Conoces los límites de tu dispositivo objetivo
* [ ] Hiciste stress testing del contexto
* [ ] Definiste límites operativos cómodos
* [ ] Implementaste validaciones antes de llamar al modelo

### 18.3 Optimización

* [ ] Usas `@Generable` cuando es apropiado (no texto libre innecesario)
* [ ] Configuraste instrucciones en la sesión (no las repitas en cada prompt)
* [ ] Implementaste estrategias de truncamiento para inputs largos
* [ ] Tienes un plan para manejar contexto histórico creciente
* [ ] Consideraste caching de sesiones si aplica

### 18.4 Manejo de errores

* [ ] Verificas `isAvailable` antes de usar el modelo
* [ ] Manejas el caso donde el modelo no está disponible
* [ ] Tienes fallbacks cuando la generación falla
* [ ] Manejas gracefully cuando los guardrails bloquean contenido
* [ ] Proporcionas feedback claro al usuario cuando algo falla

### 18.5 UX y performance

* [ ] Usas `streamResponse` para interacciones de usuario (no `respond`)
* [ ] La UI muestra progreso durante la generación
* [ ] Implementaste timeouts razonables
* [ ] Monitoreas tiempo de generación y errores
* [ ] La experiencia es fluida incluso cuando el modelo es lento

### 18.6 Internacionalización

* [ ] Decidiste una estrategia para manejo de idiomas
* [ ] Probaste con usuarios de diferentes idiomas
* [ ] Consideraste costo de tokens por traducción
* [ ] Validaste que los prompts funcionan en todos los idiomas soportados

### 18.7 Testing

* [ ] Probaste con inputs reales (no solo demos)
* [ ] Validaste edge cases (inputs vacíos, muy largos, etc.)
* [ ] Probaste en diferentes dispositivos (si aplica)
* [ ] Verificaste que funciona offline (on-device)
* [ ] Tienes tests automatizados para casos críticos

**Resumen en una frase**:

> Prototipa en Playground, mide tokens, define límites y usa datos tipados siempre que puedas.

Con esto, ya no estás "probando IA". Estás diseñando una feature con ingeniería real.

---

*Notas tomadas durante el Swift Developer Workshop 2025 ([Apple Coding Academy](https://acoding.academy/)) y reinterpretadas desde una perspectiva práctica y real-world.*
