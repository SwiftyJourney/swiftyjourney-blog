---
title: 'From AI assistant to AI engineering teams'
description: 'How parallel agent teams are changing AI development, and how to apply it to iOS using Claude Code Agent Teams.'
pubDate: 'Mar 13 2026'
heroImage: './hero.png'
lang: 'en'
translationKey: 'ai-agent-teams'
slug: 'from-ai-assistant-to-ai-engineering-teams'
tags: ['ai', 'claude', 'ios', 'claude-code']
---

We're moving from "AI assistant" to "AI engineering teams"

And it turns out you can try it today.

For a long time we used AI like this:

One agent.
One context.
One perspective.

Useful, yes. But limited.

Because that's not how a real engineering team works.

What's starting to appear now is something different:

teams of agents working in parallel.

Not one.
Several.
Each with a different specialization.

And the difference… is enormous.

---

## Where this comes from

I recently read a guide by [Tom Crawshaw](https://www.linkedin.com/in/tomcrawshaw/) (The AI Operator's Playbook) about something Anthropic just launched in Claude Code:

Agent Teams.

Interestingly, something very similar was already being explored by the OpenClaw community using workarounds and custom skills.

Now Anthropic has integrated it directly into Claude Code.

No plugins.
No hacks.
Built-in.

The idea is simple:

Instead of a single agent doing everything sequentially, a lead agent divides the work, creates several teammates, and they all work in parallel coordinating with each other.

When I read it I immediately thought of mobile development.

---

## From the iOS development perspective

I'm an iOS engineer, and I've been experimenting with specialized skills to better guide models in different domains.

For example:

🏛️ iOS Architecture
https://github.com/SwiftyJourney/ios-architecture-expert-skill

🎨 SwiftUI
https://github.com/SwiftyJourney/swiftui-expert-skill

📋 Requirements Engineering
https://github.com/SwiftyJourney/requirements-engineering-skill

The idea behind these skills is simple:

Instead of asking a generalist model for everything, guide it to reason more deeply about a specific domain.

But when you read about Agent Teams, an interesting question appears:

what happens if several of these roles work at the same time?

That's where things get really interesting.

---

## An "AI team" for your next feature

Imagine you're developing a new feature in your app.

For example, a three-step onboarding flow.

Instead of a single agent doing everything…

you have something like this:

<div class="img-medium">

![Four specialized agents working in parallel with a central AI Core coordinator](./02.png)

</div>

### Agent 1 — Requirements

Reads the PRD or ticket.
Identifies edge cases.
Defines acceptance criteria.

"What happens if the user closes the app at step 2?"

### Agent 2 — Architecture

Designs the module.
Proposes layers.
Defines responsibilities.

"This flow fits better with a coordinator and a separate view model."

### Agent 3 — SwiftUI

Proposes the UI.
Models the state.
Suggests best practices.

"Here it's better to use @StateObject instead of @ObservedObject."

### Agent 4 — Testing

Identifies failure scenarios.
Proposes test cases.

"Missing the case where the user loses connection at step 3."

<div class="img-medium">

![Four agents working in parallel on the same feature](./03.png)

</div>

---

All at the same time.
Each with its own context.

That looks a lot more like how a real engineering team works.

---

## Do you want to try it?

Anthropic already allows experimenting with this in Claude Code.

First you activate the feature in your settings.json:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Then you can describe what you want in natural language:

```text
I'm building a new onboarding flow for an iOS app.

Create an agent team with different roles:

- one agent focused on requirements
- one agent focused on iOS architecture
- one agent focused on SwiftUI implementation
- one agent focused on testing

Each agent should work on its part in parallel.
```

The lead agent coordinates the work and distributes the tasks.

You can even talk directly with each agent if you want to redirect its work.

Official documentation:
https://code.claude.com/docs/en/agent-teams

---

## How I connect this with my own skills

Something I'm interested in exploring is combining Agent Teams with specialized skills.

For example:

- one agent guided by Requirements Engineering
- another guided by iOS Architecture
- another guided by SwiftUI expertise
- another focused on Testing strategy

<div class="img-medium">

![Combining Agent Teams with specialized iOS skills](./04.png)

</div>

Something like:

Agent 1 → Requirements engineering
Agent 2 → iOS architecture
Agent 3 → SwiftUI implementation
Agent 4 → Testing strategy

I'm still experimenting with this, but the potential is quite interesting.

---

## What's not perfect yet

Tom Crawshaw mentions it clearly in his guide: this is still in research preview.

There are some limitations.

**Cost**

Each agent is an independent session.
More agents → more tokens.

---

**Coordination**

If the tasks aren't well separated, agents can step on each other's work.

Especially if they modify the same file.

---

**Current limitations**

For example:
- session resume doesn't work well yet
- you can only have one team per session
- some visualization modes require tools like tmux

Nothing serious, but clearly this is still evolving.

---

## If you want to go deeper

Some interesting resources:

[Tom Crawshaw — "Anthropic just shipped Agent Teams into Claude Code"](https://www.linkedin.com/posts/tomcrawshaw_anthropic-just-shipped-agent-teams-into-claude-activity-7425524814859169792-2xeb)

Anthropic docs
https://docs.anthropic.com

Claude Code Agent Teams
https://code.claude.com/docs/en/agent-teams

CrewAI
LangGraph

All exploring the same idea:
agent teams with defined roles.

---

## My conclusion

For years we thought of AI as an assistant.

What's starting to emerge now is something different:

AI as a complete engineering team.

One that can:
- explore solutions in parallel
- review problems from different angles
- divide a complex problem into specialties

For mobile development this could mean:
- better architecture decisions
- faster debugging
- deeper code reviews

Something that caught my attention in Tom's article:

The community built it first with workarounds.
Anthropic made it native afterward.

That says a lot about where all of this is heading.

And the interesting thing is that you can try it today.

---

💭 Curious to know what other iOS / mobile developers think.

If you could build an AI engineering team for your next feature…

What roles would it have?

Performance
Accessibility
Security
Architecture

Tell me 👇
