---
title: 'Swift Refresh 2025 – Day 5: Modern AI, Foundation Models, and AI-powered development'
description: 'A deep dive into Day 5 of Swift Refresh Workshop 2025: neural networks, Transformers, Apple on-device models, FoundationModels, and practical methodology for integrating AI into apps.'
pubDate: 'Jan 23 2026'
heroImage: './hero.png'
lang: 'en'
translationKey: 'swift-refresh-2025-day5-ai-foundation-models-intelligence'
slug: 'swift-refresh-2025-day-5-modern-ai-foundation-models-ai-powered-development'
---

## From neural networks to Vibe Coding (no hype, with judgment)

> **Goal of this series**
>
> Explain what's *really* behind modern AI —from neural networks to Vibe Coding— in a **technical but understandable** way, with **friendly examples**, without hype and with **professional judgment**.
>
> This **Part 1** is conceptual. We're not going to implement models or write papers. We're going to **understand**. In Part 2 (if you do it) we dive into code and real flows.

---

## 1. Neural networks: the foundation of everything

A **neural network** is a mathematical structure inspired (very loosely) by the human brain. It doesn't think, it doesn't reason, it doesn't understand. It **calculates**.

This distinction is fundamental: when you use ChatGPT, Claude, or any modern model, you're not talking to an entity that "understands". You're using a machine that has learned statistical patterns from millions of examples.

### 1.1 What is an artificial neuron?

An artificial neuron is the basic processing unit:

* receives input numbers (can be pixels, encoded words, any numerical data)
* multiplies them by **weights** (numbers that determine the importance of each input)
* adds a **bias** (a constant value that adjusts the activation threshold)
* applies an **activation function** (like ReLU, sigmoid, which introduces non-linearity)
* produces an output (another number)

The mathematical function is fixed. **What changes are the weights**.

> **Key idea**: learning = adjusting weights.

During training, an algorithm (like backpropagation) adjusts these weights thousands or millions of times, comparing the expected output with the actual one, and gradually correcting. It's a process of mathematical optimization, not understanding.

### 1.2 Training vs inference

These are two completely distinct phases:

* **Training**: weights are adjusted (expensive in time, energy, and hardware)
  * Requires massive datasets
  * Can take weeks or months
  * Consumes enormous amounts of computational resources
  * Only done once (or a few times) before deploying the model

* **Inference**: weights are fixed, the model is just used
  * This is what you do when you use ChatGPT or any model
  * Weights are already trained
  * The model just "calculates" with those fixed weights
  * Much faster and more efficient than training

This is crucial: **models don't learn while you use them**. When you ask an LLM a question, it's not "learning" from your question. It's using knowledge that was already trained previously. The model is static at runtime.

---

## 2. Layers and complexity

Neural networks are organized in layers:

* input
* hidden layers
* output

Each layer learns more complex patterns:

* edges → textures → shapes → concepts

That's why a deep network can recognize "a dog" and not just pixels.

### 2.1 Why layers matter

Each layer learns to recognize patterns at different levels of abstraction:

* **First layer**: detects edges, basic lines, color changes
* **Intermediate layers**: recognize textures, simple shapes, combinations of edges
* **Deep layers**: identify complete objects, complex relationships, abstract concepts

**Visual example**: In a network that recognizes dog images:

* Layer 1: "there's an edge here, another there"
* Layer 3: "these edges form a circular shape (eyes)"
* Layer 5: "these shapes suggest a dog's face"
* Final layer: "this is a dog"

That's why a deep network can recognize "a dog" and not just pixels. Depth allows the network to build increasingly abstract and complex representations.

### 2.2 The cost of depth

More layers = more learning capacity, but also:

* More parameters (more memory)
* More training time
* Higher risk of overfitting
* Harder to interpret

Not always "deeper is better". Architecture design is a balance between capacity and efficiency.

---

## 3. Transformers: the modern leap

The big change comes in 2017 with Google's paper:

> **"Attention is All You Need"**

Here the **Transformer** architecture is born, which completely revolutionizes natural language processing and becomes the foundation of all modern models (GPT, Claude, Gemini, etc.).

### 3.1 The central idea: attention

Before Transformers, networks processed sequences in a strictly linear way (like RNNs or LSTMs): word by word, left to right. This limited the ability to understand long-distance relationships.

A Transformer breaks this limitation:

* looks at **all tokens at once** (parallel processing)
* decides **which ones to pay attention to** based on context
* can relate any token to any other, regardless of distance

This is called **self-attention**: each token "looks" at all others and decides which are relevant for its interpretation.

**Why this matters**: In the sentence "The bank where I keep my money is closed", the word "bank" needs to relate to "money" to be understood correctly, not to "river". Attention enables these contextual connections.

### 3.2 Tokens: how a model sees the world

A language model doesn't see complete words like humans. It sees **tokens**, which are smaller units:

* **Complete words**: for common words ("the", "a", "and")
* **Sub-words**: most common, especially for long or rare words
* **Symbols**: individual characters for special cases

Tokenization example:

```nocode
"chasing" → ["ch", "as", "ing"]
"developer" → ["dev", "el", "oper"]
```

**Why this matters**:

* Allows generalization: if the model sees "chasing" and "chase", it recognizes the common pattern "ch"
* Handles infinite vocabulary: new words can be decomposed into known tokens
* Efficiency: doesn't need a predefined vocabulary of millions of words

Token vocabulary size is typically between 30,000 and 100,000 tokens, but can represent millions of different words through combinations.

### 3.3 Friendly attention example

Imagine this sentence:

> "The dog that was chasing the cat ate food"

When the model processes "ate", attention works like this:

* **High attention to**: "dog", "ate", "food" (subject, verb, direct object - the main semantic relationship)
* **Medium attention to**: "cat", "chasing" (relevant but secondary context)
* **Low attention to**: "the", "that", "the" (functional words, less semantic)

The model learns these relationships **through statistics**, analyzing millions of similar examples. There are no explicit grammar rules programmed.

> **Key phrase**: Transformers understand *probability of meaning*, not meaning.

This means the model doesn't "know" what a dog is. It knows that in similar contexts, "dog" appears near "ate" and "food" with high probability, and generates coherent responses based on those statistical patterns.

---

## 4. Models: parameters, quantization, and context

Today we evaluate models by three fundamental axes that determine their capacity, efficiency, and cost:

### 4.1 Parameters

Parameters are the **trained weights** of the neural network. Each connection between neurons has a weight, and these weights store the model's "knowledge".

**Typical scale**:

* Small models: 7B parameters (7 billion)
* Medium models: 70B parameters
* Large models: 175B+ parameters (GPT-4 is estimated at ~1.7T)

**Why it matters**:

* More parameters = more capacity to store complex patterns
* But also = more memory, more inference time, more cost

> More parameters = more capacity (not always better).

The law of diminishing returns applies: doubling parameters doesn't double quality. Smaller, more efficient models (like Apple's on-device) can be sufficient for many use cases.

### 4.2 Quantization

Quantization is how those weights are represented in memory:

* **FP32** (32 bits, floating point): maximum precision, lots of space
* **FP16** (16 bits): half the memory, minimal precision loss
* **INT8** (8 bits): 4x less memory, acceptable precision loss
* **INT4** (4 bits): 8x less memory, more noticeable precision loss

**Trade-offs**:

Fewer bits:

* ✅ less memory (critical for mobile devices)
* ✅ more speed (faster operations)
* ✅ lower energy consumption
* ❌ slight precision loss

**Why Apple uses it**: For on-device models, quantization is essential. It allows running 3-7B parameter models on an iPhone or Mac without consuming all available memory.

### 4.3 Context window

The context window is **how many tokens the model can consider at once**. It's the conversation's "memory limit".

**Window examples**:

* GPT-3.5: 4K tokens (~3,000 words)
* GPT-4 Turbo: 128K tokens (~100,000 words)
* Claude 3.5 Sonnet: 200K tokens
* On-device models: typically 4K-32K tokens

**More context allows**:

* Very long conversations without losing the thread
* Analysis of complete documents
* Deep reasoning about extensive texts

**But cost grows quadratically (O(n²))**:

This is critical: if you double the context, computational cost quadruples. That's why models with very large windows are expensive to run, and why Apple limits context in on-device models.

**Practical implication**: If your app needs to process long documents, you must design truncation, summarization, or chunking strategies to keep context within manageable limits.

---

## 5. Distillation and pruned models

When a large model works well but is too expensive for production, there are techniques to create more efficient versions without losing too much quality.

### 5.1 Distilled model (Knowledge Distillation)

Distillation is a knowledge transfer process:

* **Large model (teacher)**: the original model, powerful but slow
* **Small model (student)**: a smaller model trained to imitate the large one
* The small one learns not just from data, but from the large one's predictions

**Educational analogy**:

* The teacher knows a lot but is slow at explaining
* The student learns the essentials from the teacher
* Result: 1000-page book → 200-page summary that captures 85% of the knowledge

**Why it works**:
The large model has learned subtle patterns and internal representations. The small model can learn these representations directly, without having to rediscover everything from scratch.

**Advantages**:

* Faster (fewer parameters = fewer calculations)
* Cheaper (less memory, less GPU)
* Sufficient for many use cases
* Maintains much of the original model's quality

**When to use it**: When you need fast inference on devices with limited resources, but want to maintain reasonable quality.

### 5.2 Pruned model (Pruning)

Pruning removes parts of the model that contribute little to the final result:

* **Neurons**: connections with weights close to zero are removed
* **Layers**: redundant layers are removed
* **Attention heads**: in Transformers, attention heads that don't contribute are removed

**Strategies**:

* **Magnitude pruning**: removes small weights
* **Structured pruning**: removes complete neurons or layers (more efficient)
* **Gradual pruning**: removes gradually during training

**Result**: A smaller model that maintains most of its capacity, but is more efficient.

**Common combination**: Many modern models use distillation + pruning + quantization to create ultra-efficient versions for mobile devices.

---

## 6. MoE: Mixture of Experts

MoE (Mixture of Experts) is an architecture that allows scaling models to massive sizes without running the entire model on each request.

### 6.1 The problem

A giant model (say, 1 trillion parameters) faces two fundamental problems:

* **Memory**: Cannot be fully loaded on most systems
* **Computational cost**: Running all parameters on each request is prohibitively expensive

**Example**: If GPT-4 has ~1.7T parameters and each request runs the entire model, the cost per token would be enormous. Also, many of those parameters aren't relevant for each specific request.

### 6.2 The MoE idea

> **Don't use the whole brain all the time**.

Instead of a monolithic model, MoE divides the model into multiple specialized "experts":

* Each expert is a sub-neural network specialized in certain types of tasks or patterns
* A **router** (small network) decides which experts to activate for each token
* Only selected experts run, not all

**Result**:

* Scale to trillions of parameters (the total model can be huge)
* Use only a fraction per request (typically 1-2 experts out of 8-128 available)
* Cost per request is much lower than running the entire model

**Analogy**: A restaurant with 50 specialized chefs (Italian, Japanese, Mexican, etc.). When a pizza order arrives, you only activate the Italian chef. You don't need all chefs working on each order.

**Real example**:

* Total model: 1.4T parameters
* Active experts per request: ~37B parameters (only ~2.6% of the model)
* Result: giant model quality, medium model cost

**Why it matters**: MoE is the architecture behind models like GPT-4 and Claude 3 Opus. It allows these models to be massive without being prohibitively expensive to run.

---

## 7. LoRA: fine-tuning without retraining

LoRA (Low-Rank Adaptation) is a technique that allows adapting large models to specific tasks without retraining the entire model.

### 7.1 The problem

Retraining a complete Transformer is extremely expensive:

* **Computational cost**: Requires high-end GPUs for days or weeks
* **Economic cost**: Thousands of dollars in cloud infrastructure
* **Time**: Not practical for rapid iteration
* **Risk**: You might break the model's general knowledge

**Example**: If you want GPT-4 to write in your company's style, retraining it completely would cost millions and take months. Also, you might lose its general capability.

### 7.2 LoRA (Low-Rank Adaptation)

LoRA solves this elegantly:

* **Freezes the base model**: Original weights are untouched
* **Adds small trainable matrices**: Only trains low-rank matrices inserted into specific layers
* **Specializes behavior**: The model learns to adapt its responses for the specific task

**How it works technically**:

Instead of adjusting all weights of a layer (which can have millions of parameters), LoRA adds two small matrices A and B. The modification is: `W' = W + BA`, where B and A are much smaller than original W.

**Result**:

* Train only 0.1-1% of original parameters
* Base model maintains its general knowledge
* You get specialization for your use case

> **LoRA doesn't make the model smarter, it makes it more specialized**.

**Practical examples**:

* **Writing style**: Adapt a model to write like your brand
* **Concrete domain**: Specialize in medicine, law, specific code
* **Specific format**: Always generate JSON, or follow a particular template
* **Language/region**: Adapt for Mexican Spanish vs Spanish Spanish

**Why Apple uses it extensively**:

Apple needs on-device models that adapt to different users and contexts without retraining complete models. LoRA allows:

* A shared base model
* Lightweight adapters per user or task
* Quick updates without retraining everything
* Maintain privacy (base model doesn't change, only local adapters)

**Key advantage**: You can have multiple LoRAs for different tasks and activate them as needed, all sharing the same base model efficiently.

---

## 8. Hardware: why it matters so much

Modern AI, in its most basic essence, is:

> **matrix multiplication at scale**.

Every time a model generates a token, it's performing millions of matrix multiplications. Hardware determines whether this takes seconds or milliseconds, and whether it's possible on your device or requires a server.

### 8.1 CPU vs GPU

**CPU (Central Processing Unit)**:

* Designed for control and sequential logic
* Few cores (4-16 typically), but very powerful individually
* Excellent for tasks requiring complex decisions
* **Not ideal for AI**: Matrix operations are too slow

**GPU (Graphics Processing Unit)**:

* Originally designed for graphics (many parallel operations)
* Thousands of simple cores working in parallel
* **Perfect for AI**: Matrix multiplications are inherently parallelizable
* Can be 10-100x faster than CPU for AI models

**Analogy**:

* CPU = an expert chef who cooks a complex dish step by step
* GPU = 1000 simple chefs cooking 1000 simple dishes in parallel

For AI, you need the massive parallelism of the GPU.

### 8.2 Apple Silicon: the game changer

Apple Silicon (M1, M2, M3, M4, M5) introduces architectures that completely change the local AI landscape:

**Unified memory**:

* CPU and GPU share the same physical memory
* No copies between separate memory spaces
* Lower latency (direct access)
* More energy efficient

**Specialized cores**:

* **CPU cores**: For logic and control
* **GPU cores**: For general parallel processing
* **Neural Engine**: Specifically designed for ML/AI operations
* **Tensor cores** (M4/M5): Specialized hardware for matrix multiplications

**Practical implications**:

With tensor cores in GPU (M4/M5 especially):

* **Inference**: Run 3-7B parameter models in real-time
* **Fine-tuning**: Train LoRAs locally in minutes or hours
* **Light training**: Train small models from scratch

**Comparison**:

* **Cloud (remote server)**: Powerful but with network latency, cost per token, questionable privacy
* **Apple Silicon local**: Minimal latency, no usage cost, total privacy, sufficient for many cases

This enables **local generative AI**: you can have ChatGPT-level quality running completely on your Mac or iPhone, without internet connection, with total privacy.

**Why this matters for FoundationModels**: Apple can offer on-device models precisely because its hardware is optimized for this type of workload. Without Apple Silicon, on-device models would be too slow or require models so small they'd lose quality.

---

## 9. Generative AI: reality vs marketing

Generative AI is the ability to create new content (text, images, audio, code) based on patterns learned from training data.

### 9.1 What it really does

Generative AI:

* **Generates**: Produces text, image, audio, code that didn't exist before
* **Doesn't understand**: Has no real semantic understanding, only statistical patterns
* **Predicts**: Each token/pixel is a probabilistic prediction based on context

**Example**: When ChatGPT writes "The dog runs", it doesn't "know" what a dog is. It knows that after "The" and before "runs", the word "dog" has high probability according to millions of similar examples.

### 9.2 Reality vs marketing

**Marketing says**: "AI understands and reasons like humans"

**Reality**: AI is extremely good at imitating human understanding, but works completely differently. It's like the difference between an airplane (flies, but not by flapping wings) and a bird (flies by flapping wings).

> **AI is a mirror**: it returns what you give it.

If you give it good prompts, it returns good responses. If you give it biased data, it returns bias. If you give it confusing context, it returns confusion. Output quality critically depends on input quality.

### 9.3 Why this matters

**Doesn't replace human intelligence**:

* Has no real critical judgment
* Has no inherent ethical values
* Cannot evaluate the truth of its claims
* Has no real-world experience

**Amplifies it**:

* Can process information faster than humans
* Can remember more context simultaneously
* Can generate variations and explore wide solution spaces
* Can work 24/7 without fatigue

**Practical implication**: As a developer, you must use AI as an amplification tool, not as a replacement for your judgment. AI generates code, but you must understand it, evaluate it, and decide if it's correct.

---

## 10. RAG and agents

Base models have knowledge limited to their training date and cannot access external information. RAG and agents are two techniques that solve this in different ways.

### 10.1 RAG (Retrieval Augmented Generation)

RAG allows the model to query external documents in real-time:

**How it works**:

1. **Indexing**: Documents are converted into **embeddings** (numerical vectors that represent meaning)
2. **Search**: When the user asks a question, the index is searched for the most relevant documents (semantic search)
3. **Augmented context**: Relevant documents are injected into the model's prompt
4. **Generation**: The model generates a response using both its base knowledge and retrieved documents

**Ideal for**:

* **Internal manuals**: Your company's documentation that the model doesn't know
* **Recent documentation**: Information that came out after the model's training
* **Specific data**: Information unique to your domain or application
* **Verifiable facts**: When you need the model to cite specific sources

**Limitations**:

* **Doesn't understand complex structures**: If your document has tables, graphs, or complex relationships, RAG may have difficulties
* **Embedding quality**: If semantic search fails, the model doesn't receive the correct context
* **Context limit**: You can only inject a limited amount of documents in the prompt
* **Cost**: Each search and generation consumes tokens

**Practical example**: A support chatbot that queries your company's knowledge base. The model doesn't know about your specific products, but RAG allows it to access that information when relevant.

### 10.2 Code agents

An agent is a system that combines an LLM with the ability to **execute actions** in the world:

**Agent capabilities**:

* **Explores files**: Reads code, documentation, project structure
* **Follows references**: Navigates imports, dependencies, function calls
* **Executes commands**: Runs tests, compiles, executes code
* **Iterates**: Based on results, adjusts its strategy and tries again

**Key difference with RAG**:

* **RAG**: Loads static information into context
* **Agent**: Navigates dynamically, decides what to explore based on what it finds

**Why it matters**:

It doesn't load everything into context. Instead of trying to put a complete repository of 10,000 files in the prompt (impossible), the agent:

1. Starts with the relevant file
2. Reads references when needed
3. Explores only what's necessary for the task

**Example**: An agent that fixes a bug:

1. Reads the file with the error
2. Follows the import to the related function
3. Runs tests to see what fails
4. Reads relevant documentation
5. Proposes a fix
6. Runs tests again to validate

**Limitations**:

* Can make many calls (expensive in tokens)
* Can get into loops if not well designed
* Requires permissions to execute code (security risk)

**Use in IDEs**: Xcode Coding Intelligence and Cursor are examples of agents that navigate your code dynamically instead of loading the entire project into context.

---

## 11. Reasoning models

Reasoning models (also called "reasoning models" or models with "chain-of-thought") represent an important advance: instead of generating a direct response, the model **thinks step by step** before responding.

### 11.1 How they work

Unlike traditional models that generate the final response directly, reasoning models:

* **Explore hypotheses**: Consider multiple possible approaches
* **Validate coherence**: Verify that their intermediate steps are logical
* **Self-correct**: If they detect an error in their reasoning, they go back and adjust

**Internal process** (simplified):

1. Receives the prompt
2. Generates a "draft" of reasoning (intermediate thoughts, not visible to user)
3. Evaluates if the draft is coherent
4. Refines reasoning if necessary
5. Generates final response based on validated reasoning

They take your prompt as a **draft**, refine it internally before responding.

### 11.2 Why it matters

**Traditional models**:

* Input → Direct output
* Can "hallucinate" (generate responses that sound correct but are incorrect)
* Difficulty with tasks requiring multiple steps

**Reasoning models**:

* Input → Internal reasoning → Output
* Fewer hallucinations (reasoning process is verifiable)
* Better at complex tasks requiring multiple logical steps

### 11.3 Best for

Reasoning models shine at tasks requiring structured thinking:

* **Debugging**: Analyze code, identify the problem, propose solution
* **Mathematics**: Solve problems step by step, verify calculations
* **Planning**: Break down complex tasks into subtasks, consider dependencies
* **Analysis**: Evaluate multiple options, weigh pros and cons

**Example**: Instead of directly responding "The bug is on line 42", a reasoning model might think:

1. "The error says 'nil unwrapping', so I look for force unwraps"
2. "Found 3 force unwraps, but only one can be nil in this context"
3. "Line 42 has a force unwrap of an optional that can be nil"
4. "The solution is to use optional binding"

### 11.4 Trade-offs

**Advantages**:

* More reliable responses
* Verifiable process (you can see the reasoning)
* Better at complex tasks

**Disadvantages**:

* Slower (generates more tokens internally)
* More expensive (more tokens = more cost)
* Not always necessary (for simple tasks, it's overkill)

**When to use**: When the task requires complex logical thinking, when precision is critical, or when you need to be able to verify the reasoning process.

---

## 12. Benchmarks: HumanEval vs SWE-bench

Benchmarks measure how well models can generate code. But not all benchmarks measure the same thing, and understanding the difference is crucial for evaluating real models.

### 12.1 HumanEval

HumanEval is the best-known benchmark for evaluating coding capabilities:

**Characteristics**:

* **Isolated functions**: Each problem is an independent function
* **Pass@k**: Measures how many of k generated solutions pass tests (pass@1, pass@10, pass@100)
* **Functional correctness**: Only matters that the function passes tests, not how it's written

**Typical example**:

```python
def reverse_string(s: str) -> str:
    # Your code here
    pass
```

**Limitations**:

* Doesn't reflect real engineering work
* Doesn't require understanding architecture
* Doesn't test dependency handling
* Doesn't evaluate style, maintainability, or best practices

**Why it's used**: Easy to automate, fast to run, and gives a comparable metric between models.

### 12.2 SWE-bench

SWE-bench (Software Engineering Benchmark) is more realistic:

**Characteristics**:

* **Real repos**: Uses real open-source repositories (Django, scikit-learn, etc.)
* **Multi-file bugs**: Bugs require changes in multiple files
* **Real engineering**: You must understand architecture, follow conventions, handle dependencies

**Typical example**:

* Real GitHub issue: "Method X fails when Y is None"
* You must: find where the bug is, understand context, fix it without breaking other things, follow project style

**Why it's better**:

* Reflects real development work
* Requires understanding existing code
* Evaluates ability to navigate large projects
* Closer to what a developer does day to day

**Limitation**: Harder to automate and slower to run.

> **HumanEval measures isolated code. SWE-bench measures real work.**

### 12.3 Practical implications

**For evaluating models**:

* If a model has good HumanEval but bad SWE-bench, it's good for coding challenges but not for real work
* If a model has good SWE-bench, it's probably useful for real development

**For choosing tools**:

* IDEs with AI that only pass HumanEval may fail on real projects
* Tools that navigate code (like Xcode Coding Intelligence) are designed for SWE-bench-style tasks

**For your work**:

* Don't trust only HumanEval metrics
* Test the model on your real code
* Evaluate if it can navigate your architecture, understand your conventions, and make changes that don't break things

---

## 13. Vibe Coding and AI-powered IDEs

"Vibe Coding" is a term that describes a development style where you let AI generate code and you focus on validating and refining.

### 13.1 Vibe Coding: what it is and when it works

**Definition**: Let AI write code and you validate that it works and is correct.

**Useful for**:

* **Prototypes**: Explore ideas quickly, see what works before investing time
* **Boilerplate**: Repetitive code you know well but is tedious to write
* **Exploration**: Try different approaches without writing everything manually
* **Learning**: See how AI solves problems to learn new patterns

**Risks**:

* **Not understanding what's built**: If you don't understand the generated code, you can't maintain or debug it
* **Excessive dependency**: Losing fundamental coding skills
* **Low-quality code**: AI can generate code that works but has design problems
* **Confirmation bias**: Accepting code because it "works" without evaluating if it's the best solution

**Best practices**:

> **AI amplifies your judgment. If there's no judgment, it amplifies chaos.**

* Always read and understand generated code
* Evaluate if it's the correct solution, not just if it works
* Refactor if necessary
* Use AI as a tool, not as a replacement

### 13.2 AI-powered IDEs: the current landscape

**Market reality**:

There are no completely new IDEs designed from scratch for AI. What exists are:

* **VS Code forks**: Cursor, Continue, etc. - VS Code with AI integrated
* **Extensions**: GitHub Copilot, Codeium, etc. - AI added to existing IDEs

**Cursor**:

* Leads in AI features (chat, editing, navigation)
* Good overall experience
* **But**: **not recommended for Apple development**

**Why not for Apple**:

* No native support for Swift/SwiftUI
* Doesn't integrate well with Apple tools (Instruments, etc.)
* Doesn't leverage Apple-specific features (like FoundationModels)
* Apple development experience requires Xcode

**For Apple development**:

* **Xcode + integrated AI**: The best option
  * Coding Intelligence (Claude integrated)
  * Complete native support
  * Integration with entire Apple ecosystem
  * Access to FoundationModels and Apple APIs

**Recommendation**: If you develop for Apple, use Xcode. If you develop for other platforms, Cursor can be a good option, but evaluate if you really need to switch from VS Code.

---

## 14. Local LLMs

Running language models locally (on your Mac, without internet connection) has become completely viable thanks to Apple Silicon and tools like LM Studio and Ollama.

### 14.1 Why run models locally

**Advantages**:

* **Total privacy**: Your data never leaves your device
* **No cost per token**: Once the model is downloaded, using it is free
* **No network latency**: Instant responses
* **Works offline**: You don't need internet
* **Total control**: You can use any model, adjust parameters, etc.

**Disadvantages**:

* **Limited resources**: Smaller models than cloud (typically 3-7B parameters vs 70B+ in cloud)
* **Quality**: Local models are usually less capable than the best cloud models
* **Memory**: Requires quite a bit of RAM (8-16GB minimum for decent models)

**When it makes sense**: For development, prototyping, use cases where privacy is critical, or when you want to experiment without costs.

### 14.2 LM Studio

**Characteristics**:

* **GUI**: Friendly graphical interface, you don't need CLI
* **MLX**: Optimized for Apple Silicon using MLX (Apple's framework for ML)
* **Apple Silicon**: Leverages Neural Engine and GPU cores efficiently

**Ideal for**: Users who want a ChatGPT-like experience but local, without touching code.

**Typical use**: Download a model, open the GUI, chat with it. Simple and direct.

### 14.3 Ollama

**Characteristics**:

* **CLI**: Command-line interface, more flexible
* **OpenAI-compatible API**: You can use the same libraries you use for OpenAI
* **Automation**: Easy to integrate into scripts and applications

**Ideal for**: Developers who want to integrate local models into their apps or automated workflows.

**Typical use**: Install Ollama, download a model (`ollama pull llama2`), and use it from Swift/Python/etc. code as if it were OpenAI.

### 14.4 Key available models

**DeepSeek**:

* High-quality Chinese model
* Good balance between size and capacity
* Specialized in code and reasoning

**GPT-OSS** (open source models):

* Various models inspired by GPT
* Different sizes available
* Active community

**Devstral**:

* Specialized in code
* Based on Mistral
* Good for development tasks

**Qwen / Gemma**:

* Models from Alibaba and Google respectively
* Multilingual (especially Qwen)
* Good general quality

**Recommendation**: For development, Devstral or DeepSeek. For general use, Qwen or models based on Llama.

### 14.5 The cloud–local gap closes fast

**2 years ago**: Local models were toys, quality much inferior to cloud.

**Today**:

* 7B parameter local models can compete with cloud models from 1-2 years ago
* For many use cases, quality is sufficient
* Speed and privacy compensate for quality difference

**Future**: With better hardware (M5, M6) and optimization techniques, the gap will continue closing. For many developers, local models are already the preferred option for development and prototyping.

---

## 15. Best practices for Vibe Coding

Using AI to generate code is powerful, but requires discipline and judgment. These practices help you leverage AI without falling into common traps.

### 15.1 Fundamental principles

**AI doesn't do the work for you**:

* You're still responsible for the code
* AI is a tool, not a replacement
* Generated code must pass your review and approval

**Understand and evaluate code**:

* Always read generated code before using it
* Verify it does what you need
* Make sure it follows your standards and conventions

**Treat it like a junior developer**:

* Give clear and specific instructions
* Review its work before accepting it
* Correct errors and ask for improvements when necessary
* Don't assume it's always right

### 15.2 Avoid common traps

**Confirmation bias**:

* Don't accept code just because it "works"
* Evaluate if it's the best solution, not just if it passes tests
* Consider alternatives before deciding

**Don't copy/paste blindly**:

* Each piece of code must have a clear purpose
* Remove unnecessary code that AI might have generated
* Make sure code fits your architecture

### 15.3 Best prompt practices

**Give detailed prompts**:

* Specify context (what your app does, what framework you use)
* Indicate constraints (style, performance, dependencies)
* Provide examples when relevant

**Divide large problems**:

* Instead of "make me a complete app", ask for specific features
* Build iteratively
* Validate each piece before continuing

**Good prompt example**:

```nocode
"I need a Swift function that validates emails. 
It must use regex, return a Bool, and follow Swift conventions. 
Include documentation comments."
```

**Bad prompt example**:

```nocode
"make me validate emails"
```

### 15.4 Ideal use cases for AI

**Explain code**:

* "What does this function do?"
* "Why does this code fail?"
* "How can I optimize this?"

**Tests**:

* Generate unit tests
* Create edge case test cases
* Write integration tests

**Documentation**:

* Generate documentation comments
* Create READMEs
* Write usage guides

**Refactors**:

* Modernize legacy code
* Apply best practices
* Improve readability

### 15.5 When NOT to use AI

**Don't use AI for**:

* Learning fundamentals (learn first, then use AI to accelerate)
* Security-critical code without exhaustive review
* Important architectural decisions (you must understand the architecture)
* When you don't have time to review generated code

> **AI amplifies your judgment. If there's no judgment, it amplifies chaos.**

If you don't have the knowledge to evaluate generated code, you shouldn't use it in production. AI is a tool for experienced developers, not a shortcut to avoid learning.

---

## 16. Apple's Foundation Model (FoundationModels)

To close day 5, we enter the most "productizable" part of the entire workshop: **using Apple's on-device language model from Swift**, through the **FoundationModels** framework.

### 16.0 Apple's proposal

Apple's proposal is very clear and fundamentally different from cloud models:

* **The model lives in the system** (on-device): Doesn't require internet connection, doesn't send data to external servers
* **Your app accesses via native API**: Direct integration with Swift, without wrappers or third-party SDKs
* **Prioritize privacy**: Your data never leaves the device
* **Low latency**: No network round-trips, almost instant responses
* **Integrated experiences**: The model can access system information (calendar, contacts, etc.) securely and privately

**Why this matters**:

While ChatGPT, Claude, and other cloud models offer maximum capacity in exchange for privacy and latency, FoundationModels offers a different balance: sufficient capacity for many use cases, with total privacy and minimal latency.

**When to use FoundationModels vs cloud models**:

* **FoundationModels**: When privacy is critical, you need instant responses, or want to work offline
* **Cloud models**: When you need maximum capacity, larger models, or advanced features requiring 70B+ parameter models

### 16.1 Why we use `#Playground` inside a project (and not a standalone `.playground`)

In Xcode, the **`#Playground`** macro allows executing a block as if it were a Playground, **but inside a normal Swift file in the project**. It's ideal for experimenting without leaving the app's real target.

**The problem with traditional Playgrounds**:

`.playground` files are isolated files that:

* Have their own compilation context
* Don't have complete access to project frameworks
* Can have different behaviors than the real app target
* Cannot use certain APIs that require the app's complete context

**Why FoundationModels needs the real context**:

FoundationModels is a system framework that:

* Requires specific permissions and capabilities from the app target
* May need access to project resources
* Behaves differently in an isolated Playground vs a real app
* Some features (like system data access) only work in an app context

**The solution: `#Playground`**:

```swift
#Playground {
  // Your experimentation code here
  // Runs in the project's real context
  // But with Playground's iteration speed
}
```

**Advantages**:

* ✅ Compiles with the same environment as your app
* ✅ Complete access to all project frameworks
* ✅ Identical behavior to production
* ✅ You can test code that you then move directly to your app
* ✅ You don't need to create a separate target to experiment

> In other words: `#Playground` gives you the "fast" Playground flow, without abandoning the project's real context.

**Recommended workflow**:

1. Experiment with FoundationModels in a `#Playground` block
2. Once it works, move the code to your real ViewModel or service
3. Remove the `#Playground` block (or leave it commented for reference)

### 16.2 The entry point: `SystemLanguageModel`

The base model is exposed as **`SystemLanguageModel.default`**. This is your entry point to Apple's on-device language model.

**Why check availability**:

Apple recommends **checking availability** before generating content because:

* **Not all devices support the model**: Older devices may not have the model available
* **The model may not be ready**: It may be downloading, updating, or temporarily unavailable
* **Different devices, different capabilities**: An iPhone may have one model, a Mac another, and an iPad another

**How to check**:

```swift
guard SystemLanguageModel.default.isAvailable else {
  // Model is not available
  // Show a message to the user or use a fallback
  return
}
```

**Conceptually, think of this as**:

* "Does the device support the on-device model?"
* "Is it available and ready to use?"
* "Can I trust it will work when I need it?"

**Fallback strategies**:

If the model is not available, you can:

* Show a message to the user explaining the situation
* Use an alternative local model (Ollama, LM Studio)
* Degrade to a feature without AI
* Suggest updating the system if it's a version problem

**In production**: Always check availability before showing features that depend on the model. Don't assume it's available on all devices.

### 16.3 `LanguageModelSession`: a conversation with memory (state)

Apple models the interaction with the LLM as a **session**, not as individual calls without memory. This is an important design decision that reflects how humans interact with assistants: in conversations with context.

**What a session is**:

A session is an object that:

* **Maintains context between calls**: Remembers what was said before
* **Can be reused**: For "threaded" experiences (like a continuous chat)
* **Or created new**: For isolated tasks without previous context

**Why it matters**:

Instead of sending all history in each request (expensive in tokens), the session maintains context internally. This is more efficient and allows natural conversations.

**Create a basic session**:

```swift
let session = LanguageModelSession()
```

**Configure a session**:

The session can be configured with several parameters that affect its behavior:

* **Instructions** (role/style): Defines how the model should behave

  ```swift
  let session = LanguageModelSession(
    instructions: "You are a helpful assistant that explains code in simple terms."
  )
  ```

* **Tools** (if applicable): Functions the model can call

  * Allows the model to execute actions (search information, calculate, etc.)
  * Similar to function calling in other models

* **Transcripts** (history/context): Previous conversation context
  * You can inject previous messages
  * Useful for restoring a conversation or giving initial context

* **Model/adapters** (specialized variants):
  * You can specify which model variant to use
  * Or use adapters (LoRAs) for specialization

**When to create a new session**:

* **New conversation**: When the user starts a new topic
* **Isolated task**: When you don't need previous context
* **Context reset**: When you want to "forget" the previous

**When to reuse a session**:

* **Continuous chat**: When the user continues the same conversation
* **Necessary context**: When previous responses are relevant
* **Fluid experience**: To maintain the interaction's "memory"

**Memory management**:

Sessions consume memory (they maintain the transcript). If your app handles many conversations, consider:

* Limiting the number of active sessions
* Closing old sessions when not used
* Using ephemeral sessions for one-off tasks

### 16.4 Guardrails: security by default

The framework includes **guardrails** that filter or block outputs according to security policies. Simply put: limits to avoid unwanted content.

**What guardrails are**:

Guardrails are filters that Apple applies automatically for:

* **Inappropriate content**: Blocks generation of offensive, violent content, etc.
* **Sensitive information**: May block generation of personal information if detected
* **Malicious use**: Prevents certain types of prompts that could be problematic

**How they work**:

Guardrails operate transparently:

* Execute during generation
* Can completely block a response
* Or can modify/redact parts of the response
* The framework notifies you if they activated

**Guardrail handling**:

```swift
do {
  let response = try await session.respond(to: prompt)
  // Successfully generated response
} catch {
  // The error may indicate that guardrails blocked the generation
  // Handle the error appropriately
}
```

**Limitations**:

* Guardrails aren't perfect: they may block legitimate content or allow problematic content
* They're conservative by default: prioritize security over functionality
* You can't disable them: they're part of Apple's security system

**In production**: Always handle the case where guardrails block a generation. Show an appropriate message to the user instead of failing silently.

### 16.5 Ways to generate: `respond` vs `streamResponse`

There are two main ways to "request" a generation from the model, each with its trade-offs:

**`respond(...)`: Complete response**

```swift
let response = try await session.respond(to: "Explain Swift concurrency")
// response.content contains the complete response
```

* ✅ **Simple and direct**: One call, you get everything
* ✅ **Easy to handle**: You don't need to manage streams
* ❌ **User sees 'wait'**: Until it finishes, there's no feedback
* ❌ **Noticeable if slow**: For long responses, it can feel slow

**When to use `respond`**:

* Quick tasks where the response is short
* Background processing where the user doesn't wait
* When you need the complete response before continuing

**`streamResponse(...)`: Response by parts**

```swift
let stream = session.streamResponse(to: "Explain Swift concurrency")
for try await partial in stream {
  // partial.content contains the part generated so far
  // You can update the UI as it arrives
}
```

* ✅ **Better UX**: User sees immediate progress
* ✅ **Feels fast**: App feels more responsive
* ✅ **Continuous feedback**: You can show something is happening
* ❌ **More complex**: You need to handle the stream
* ❌ **More complex UI**: You must update UI incrementally

**When to use `streamResponse`**:

* Real-time user interactions
* Responses that may be long
* When you want the best possible user experience

> For real apps, **streaming is usually the correct experience**.

**Recommendation**: Use `streamResponse` for any direct user interaction. Use `respond` only for background tasks or when the response is guaranteed to be very short.

---

## 16.6 Typed generation: `@Generable` + `@Guide`

One of the most elegant parts of FoundationModels is that it doesn't just generate text: it can generate **typed Swift structures**. This completely changes how you integrate AI into your app.

### 16.6.1 The problem with free text

When you generate free text, you get something like:

```nocode
"To make a pizza you need flour, water, salt, yeast, 
tomato, mozzarella cheese, oregano..."
```

**Problems**:

* You have to parse the text manually
* Format can vary
* No type validation
* Hard to use directly in your UI
* Prone to errors

### 16.6.2 The solution: typed contracts

Here the point is to change the game from:

* "generate a recipe text"

To:

* "generate a valid `Recipe` following this contract"

**Advantages**:

* ✅ Type safe: The compiler verifies it's a valid `Recipe`
* ✅ No parsing: You already have the structure ready to use
* ✅ Automatic validation: Constraints are applied automatically
* ✅ Direct integration: You can use the object directly in SwiftUI
* ✅ Fewer errors: The type system prevents many bugs

### `Recipe` as output contract

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

**What you achieve with this**:

* You go from "free text" to **usable data**.
* `ingredients` is no longer an ambiguous list of strings; now it has **name + quantity + unit**.
* `anyOf` forces units to be consistent (ideal for UI, shopping lists, conversions).

### 16.6.3 How it works internally

**`@Generable`**:

* Marks a structure as "generable" by the model
* Tells the model what type of data it should produce
* Automatically generates a `PartiallyGenerated` for streaming

**`@Guide`**:

* Provides instructions to the model about each field
* Can include constraints (`.count`, `.range`, `.anyOf`)
* Helps the model understand what values are valid

**The process**:

1. The model receives the prompt + the `@Generable` structure
2. Generates data that tries to fulfill the contract
3. The framework validates that data meets constraints
4. Returns a typed Swift object, not text

> This doesn't make the model smarter. It makes the problem clearer.

The model doesn't "understand" better, but has much more specific instructions about what to generate, resulting in more useful and consistent outputs.

### 16.6.4 Available constraints

**`.count(min...max)`**: Limits the number of elements in arrays

```swift
@Guide(.count(4...20))
let ingredients: [Ingredient]
```

**`.range(min...max)`**: Limits numerical values

```swift
@Guide(.range(5...180))
let preparationTime: Int
```

**`.anyOf([...])`**: Restricts to specific values

```swift
@Guide(.anyOf(["Easy", "Medium", "Difficult"]))
let difficulty: String
```

**When to use each**:

* `.count`: When you need to control list sizes
* `.range`: For numerical values with reasonable limits
* `.anyOf`: For enums or discrete values your UI can handle

### 16.6.5 Limitations and when not to use it

**Don't use `@Generable` when**:

* You need extensive free text (articles, long stories)
* Format is completely open
* You need multiple possible formats
* Structure is too complex or deeply nested

**Use free text when**:

* User needs to edit the result directly
* Format is completely flexible
* You need creative generation without constraints

**Balance**: For most use cases in apps, `@Generable` is better. For creative or open content, free text may be more appropriate.

---

## 16.7 Typed `respond`: complete response

When you use `generating: Recipe.self`, the `response` returns typed:

* `LanguageModelSession.Response<Recipe>`

And you get the real object:

```swift
let recipe = response.content
```

Quick example:

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

**Trade-off**: the user waits until it finishes.

---

## 16.8 Typed streaming: product experience

When the user taps "Generate recipe", `respond` can take time and it shows. With streaming, you receive a **`Recipe.PartiallyGenerated`** that fills up as the model generates.

### ViewModel with streaming

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

### SwiftUI view: painting "live"

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

**What the user gains**:

* sees immediate progress
* feels the app is fast
* UI populates as partials arrive

**What you gain as a dev**:

* don't need to invent long "spinners"
* pattern fits naturally with SwiftUI

---

## 16.9 Error handling and edge cases

FoundationModels can fail in various ways. Understanding and handling these cases is crucial for a robust app.

### 16.9.1 Common error types

**Model not available**:

```swift
guard SystemLanguageModel.default.isAvailable else {
  // Handle the case where the model is not available
  return
}
```

**Guardrails activated**:

```swift
do {
  let response = try await session.respond(to: prompt)
} catch {
  // Guardrails may have blocked the generation
  // Show an appropriate message to the user
}
```

**Timeout or cancellation**: If generation takes too long or the user cancels, the stream may throw an error.

**Context limits exceeded**: If the transcript is too long, the model may reject the request.

### 16.9.2 Handling strategies

**Proactive verification**:

* Always verify `isAvailable` before using the model
* Validate input size before sending it
* Set reasonable timeouts

**Fallbacks**:

* If the model fails, degrade to a feature without AI
* Offer alternatives to the user
* Save state to retry later

**User feedback**:

* Explain clearly what went wrong
* Offer actions the user can take
* Don't fail silently

### 16.9.3 Guardrails: what they block

Guardrails block:

* Offensive or inappropriate content
* Sensitive personal information
* Prompts that try to evade restrictions
* Content that violates Apple policies

**You can't disable them**, but you can:

* Design prompts that avoid activating them
* Handle errors gracefully when they activate
* Provide additional context if necessary

### 16.9.4 On-device model limits

**Known limits**:

* **Limited context**: Typically 4K-32K tokens (less than cloud models)
* **Capacity**: Smaller models than cloud (3-7B vs 70B+)
* **Speed**: May be slower on older devices
* **Memory**: Consumes device RAM

**How to work within limits**:

* Truncate long inputs before sending them
* Use summaries for historical context
* Limit array sizes in `@Generable`
* Monitor memory usage

---

## 16.10 Optimization and performance

Using FoundationModels efficiently requires understanding how to measure and optimize resource consumption.

### 16.10.1 Token measurement

**Why it matters**:

* Tokens determine computational cost
* More tokens = more generation time
* More tokens = more memory consumed
* More tokens = higher latency

**How to estimate**:

* 1 token ≈ 0.75 words in English
* 1 token ≈ 1-2 words in Spanish
* Long strings = more tokens

**What to measure**:

* Input tokens (prompt + transcript)
* Output tokens (generated response)
* Total tokens per session
* Generation time

### 16.10.2 Strategies to reduce tokens

**Concise prompts**: Go straight to the point, eliminate unnecessary words, use clear instructions.

**Instructions in session**: Instead of repeating instructions in each prompt, configure them once in the session.

**Limit historical context**: Don't keep infinite conversations, summarize or truncate transcript when necessary.

**Use `@Generable`**: Generate structured data instead of long text, more efficient than free text.

### 16.10.3 Session caching

**When to cache**:

* Sessions that are reused frequently
* Conversations the user can resume
* Context that doesn't change much

**When not to cache**:

* Ephemeral sessions for one-off tasks
* When context is very large
* When memory is limited

### 16.10.4 Monitoring and metrics

**What to monitor**:

* Average generation time
* Error rate
* Memory usage
* Response size
* Usage frequency

**Why it matters**: Without metrics, you don't know if your app is working well or if there are performance problems affecting user experience.

---

## Conclusion

Modern AI is not magic.

It is:

* statistics
* engineering
* hardware
* human decisions

If you understand this, **you're already well ahead of the average**.

---

## 17. Development methodology with FoundationModels

Apple insists on something: before integrating AI into your app, first understand it and measure it. These recommendations, based on Apple's best practices, help you build robust and predictable AI features.

### 17.1 Prototype first with #Playground

Before touching your architecture, UI, or real flows, use `#Playground` as an experimentation laboratory.

**What to test in the Playground**:

* **Prompts**: Try different ways to formulate your prompts
* **@Generable structures**: Experiment with different structure designs
* **@Guide constraints**: Test which constraints work best
* **respond vs streamResponse**: Compare both options for your use case
* **Limits and errors**: Discover what happens when you exceed limits

**What to discover**:

* What the model does well
* Where it breaks or fails
* What types of prompts guide it best
* What guardrails may block legitimate cases
* What the practical limits are

**Practical rule**: Every experiment first lives in `#Playground`, then moves to app.

### 17.2 Measure tokens from the start

The cost and real limits are in tokens. Don't wait until production to measure them.

**What to measure**:

* How many tokens you use per request
* Compare total tokens per iteration
* Measure the "size" of your inputs and outputs
* Track how tokens grow with usage

**Why it matters**:

This helps you avoid the most common error: **"works in demo, but fails in production with real inputs"**.

### 17.3 Stress testing context

Identify "how far the system can swallow" before users discover it.

**What to test**:

* What happens if the user pastes a very long text?
* If you send 10x more content than normal?
* If the transcript grows indefinitely?
* If you give it 30 ingredients or 200 in an `@Generable`?

**What to find**:

* **Comfortable operational limit**: Where the system works well
* **Degradation limit**: Where it starts working poorly but doesn't fail
* **Failure limit**: Where the system fails completely

**What to define with this information**:

* **Truncation strategies**: How to cut long inputs
* **Intermediate summaries**: How to summarize historical context
* **UI limits**: Maximum characters in text fields
* **Validations**: Verify size before calling the model

### 17.4 Token budgets

It's not just about "how many tokens" but how they're distributed.

**Budget components**:

* **Prompt tokens (input)**: What you send to the model
* **Transcript tokens (history)**: Context from previous conversations
* **Output tokens (response)**: What the model generates
* **Extra tokens**: For translation, rewrites, or additional processing

**Why it matters**:

If you don't measure it, the system becomes unpredictable: **works today, doesn't tomorrow**.

### 17.5 When to use @Generable vs free text

This is a very strong recommendation from Apple: **if you can, use `@Generable`**.

**Problem with free text**:

When you generate long free text, you typically spend more tokens because:

* The model has to "explain" more
* It repeats information
* Adds filler and transition words
* Format can vary

**Advantages of @Generable**:

* Output is structured and predictable
* Model fills specific fields
* Ambiguity is reduced
* Usually more efficient (less "wordiness")
* Direct integration with your Swift code

**Product rule**:

> In product, it almost always makes sense: **generate data → render the UI yourself**.

Instead of the model generating HTML or markdown, generate data structures and you render the UI. This gives you more control and is more efficient.

**When to use free text**:

* Extensive creative content (articles, stories)
* When format must be completely flexible
* When user needs to edit the result directly

### 17.6 Model limit adjustment

Use `#Playground` not just to "see if it works", but to **define your rules**.

**What to define**:

* **Maximum characters in input**: Based on your stress tests
* **Maximum items**: For example, ingredients `.count(4...20)`
* **Numerical ranges**: `.range(5...180)` for preparation times
* **Closed options**: `.anyOf(["Easy", "Medium", "Difficult"])` for difficulty
* **Error handling**: What to do when guardrails block

**Result**:

This transforms your integration from **"trial and error"** to **clear contracts** (type system + constraints + UX).

### 17.7 Language and translation handling

Everything involving translation consumes additional tokens.

**Common problems**:

* **Input in one language, output in another**: The model does extra translation work
* **User mixes languages**: Increases complexity and tokens
* **Multilingual without strategy**: Unpredictable results

**Strategies**:

**Option 1: Normalize to user's language**

* Detect user's language
* Always work in that language
* Simpler, but requires detection

**Option 2: Base language + translation at the end**

* Work in a base language (e.g., English)
* Translate at the end if necessary
* More control, but more complex

**Recommendation**: For apps with single-language users, normalize. For multilingual apps, consider a base language.

---

## 18. Checklist: Before shipping an AI feature

This checklist helps ensure your FoundationModels integration is ready for production.

### 18.1 Prototyping and validation

* [ ] You experimented with `#Playground` before implementing
* [ ] You tested different prompts and structures
* [ ] You validated that `@Generable` works for your use case
* [ ] You compared `respond` vs `streamResponse` and chose the best option
* [ ] You identified what guardrails may affect your app

### 18.2 Measurement and limits

* [ ] You measure tokens (or estimate based on words)
* [ ] You know the limits of your target device
* [ ] You did stress testing of context
* [ ] You defined comfortable operational limits
* [ ] You implemented validations before calling the model

### 18.3 Optimization

* [ ] You use `@Generable` when appropriate (not unnecessary free text)
* [ ] You configured instructions in the session (don't repeat them in each prompt)
* [ ] You implemented truncation strategies for long inputs
* [ ] You have a plan to handle growing historical context
* [ ] You considered session caching if applicable

### 18.4 Error handling

* [ ] You check `isAvailable` before using the model
* [ ] You handle the case where the model is not available
* [ ] You have fallbacks when generation fails
* [ ] You handle gracefully when guardrails block content
* [ ] You provide clear feedback to the user when something fails

### 18.5 UX and performance

* [ ] You use `streamResponse` for user interactions (not `respond`)
* [ ] UI shows progress during generation
* [ ] You implemented reasonable timeouts
* [ ] You monitor generation time and errors
* [ ] Experience is fluid even when the model is slow

### 18.6 Internationalization

* [ ] You decided on a strategy for language handling
* [ ] You tested with users of different languages
* [ ] You considered token cost for translation
* [ ] You validated that prompts work in all supported languages

### 18.7 Testing

* [ ] You tested with real inputs (not just demos)
* [ ] You validated edge cases (empty inputs, very long, etc.)
* [ ] You tested on different devices (if applicable)
* [ ] You verified it works offline (on-device)
* [ ] You have automated tests for critical cases

**Summary in one sentence**:

> Prototype in Playground, measure tokens, define limits, and use typed data whenever you can.

With this, you're no longer "testing AI". You're designing a feature with real engineering.

---

*Notes taken during Swift Developer Workshop 2025 ([Apple Coding Academy](https://acoding.academy/)) and reinterpreted from a practical and real-world perspective.*
