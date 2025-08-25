---
title: 'From Requirements to Use Cases: Building a BTC Price App the Right Way'
description: 'Learn how to transform vague challenge requirements into clear user stories, narratives, and use cases. Avoid assumptions, cover all gaps, and build software that is predictable, testable, and professional.'
pubDate: 'Aug 25 2025'
heroImage: './hero.png'
lang: 'en'
translationKey: 'from-requirements-to-use-cases'
slug: 'from-requirements-to-use-cases-building-a-btc-price-app-the-right-way'
---

## Introduction

When we get a coding challenge, <_insert here your preferred source_>, our first instinct is usually: "_Let's start coding._"

But challenges - just like real client requirements - are rarely complete or unambiguous.

If we jump straight into code, we risk:

- Making hidden assumptions 🤔
- Missing edge cases 💥
- Writing brittle code that breaks when requirements evolve ⚡

In this article, I'll walk you through how I **converted the BTC/USD Price Challenge** from the Essential Developer Academy into **user stories**, **narratives**, **BDD specs**, and **use cases**.

The goal isn't just to build an app. The goal is to **learn how to think like a professional engineer**:

- Clarify requirements.
- Expose gaps early.
- Define behavior before implementation.
- Build software that is testable, predictable, and maintainable.

## Step 1 - Reading Between the Lines

The challenge said:

> Create a multi-platform app (CLI + iOS) to display the BTC/USD exchange price every second. Use Binance as the primary data source and CryptoCompare as fallback. Handle errors by showing the last cached value and timestamp, and hide the error when the next update succeeds.

Looks clear? Actually, a lot is unsaid:

- How exactly should the error look to the user?
- What happens if both sources fail at the same time?
- What if the fetch takes longer than one second?
- What if there's no cache at all?
- Should iOS keep polling in the background?

**👉 Requirements are never complete**. Our job is to make them explicit.

## Step 2 - Turning Raw Requirements into User Stories

User stories frame the problem from the **user's perspective**.

They answer: _Who wants what and why?_

Example:

```plain
As an iOS user
I want to see the most recent BTC/USD price on screen
So I know the current value and when it was last updated
```

By writing multiple stories (for CLI, fallback, error states, caching, accessibility…), we already reduced ambiguity.

Stories also help us validate with stakeholders: "_Is this what you expect?_"

## Step 3 - Writing Narratives and Acceptance Criteria (BDD)

Stories are still too broad.
Narratives + BDD (Behavior Driven Development) style scenarios help us **cover all the branches**.

Example narrative:

```plain
As a user
I want the app to show the last cached value when the network fails
So I still see useful information instead of a blank screen
```

Acceptance criteria (BDD):

```gherkin
Given both data sources fail for the current tick
And a cached value exists
When the system renders the result
Then it displays the cached value with its timestamp
And shows a visible error message
```

Why is this valuable? Because:

- It forces us to think of **happy paths** and **sad paths**.
- It sets up our **tests before code**.
- It prevents the classic "but I thought it should…" discussions.

## Step 4 - Use Cases: Defining System Responsibilities

Now we move from "what the user wants" → to "what the system must do."

Use cases describe the responsibilities of our modules.

Example: **Load Latest Price with Fallback**

- **Happy Path**
  1. Try primary source (with timeout).
  2. If success → return result.
  3. If failure → try fallback.
  4. If fallback succeeds → return result.

- **Error Path**
  1. If both fail → deliver error, render cached value, show message.

Notice how we **separate concerns**:

- Use case doesn't care about UIKit/SwiftUI/CLI.
- It defines _business rules_.
- Later, presentation layers just consume them.

## Why Covering All Gaps Matters

Imagine coding straight away without specs.

What if during demo day, someone asks: "_What happens if the update takes longer than a second?_"
If we didn't think about it, our app may freeze or silently fail.

By writing stories, narratives, and use cases we:

- Force ourselves to handle edge cases up front.
- Make no assumptions.
- Define contracts that tests can validate.
- Enable modular, reusable architecture (iOS + CLI share the same core).

This process is not bureaucracy.
It's how we make sure our system is **predictable and robust**.

## Step 5 - Teaching Through Specs

What I like about this process is that the specs themselves teach:

- New developers can read the stories and understand the system in minutes.
- Tests map 1:1 with acceptance criteria.
- Specs become living documentation.

It's not just about finishing a challenge — it's about showing how professionals build real systems.

## Conclusion

Challenges are not about "just code." They're about **thinking like an engineer**.

By transforming raw requirements into **stories** → **narratives** → **BDD specs** → **use cases**, we:

- Reduced ambiguity.
- Eliminated assumptions.
- Defined behavior clearly.
- Built a solid foundation for TDD and modular design.

Next, I'll show how I mapped these use cases into a modular **Swift package structure** (Core, Networking, Persistence, Feature) and started implementing them with TDD.
