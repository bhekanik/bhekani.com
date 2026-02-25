---
title: "Your AGENTS.md is probably hurting your agent"
pubDate: 2026-02-24
description: "Research shows agent context files reduce task success rates. Here's what to do instead."
author: "Bhekani Khumalo"
published: true
tags: ["ai", "technical", "agents", "developer-tools"]
---

You start using a coding agent. You run `/init`. It generates a big AGENTS.md file full of architecture overviews, coding conventions, testing strategies, framework patterns. You commit it. You feel good. You've given your agent "context."

Everyone does this. The agent providers tell you to do it. It feels like the responsible thing.

Here's the problem: **you probably just made your agent worse at its job.**

## The paper that changed my thinking

In February 2026, researchers from ETH Zurich and LogicStar.ai published a paper titled ["Evaluating AGENTS.md: Are Repository-Level Context Files Helpful for Coding Agents?"](https://arxiv.org/abs/2602.11988). It's the first rigorous investigation into whether these context files actually help.

The findings are not what you'd expect:

- LLM-generated context files (the ones `/init` creates) **reduced success rates by ~3%** on average
- Developer-written context files only **improved success rates by ~4%**
- Both **increased inference cost by over 20%**
- These results held across multiple agents and models (Claude Code, Codex, Qwen Code) and two benchmarks

The paper's conclusion is blunt: _"unnecessary requirements from context files make tasks harder, and human-written context files should describe only minimal requirements."_

## Why it hurts - the instruction budget

Here's why.

AGENTS.md is global context. It loads on **every single request**, regardless of what the agent is doing.

There's a useful concept called the "instruction budget" (from Kyle at HumanLayer, popularised by Matt Pocock): frontier thinking LLMs can reliably follow roughly 150-200 instructions in a single session. Smaller or non-thinking models handle fewer. Every rule in your AGENTS.md is an instruction that competes with the instructions the agent generates for itself: exploration plans, implementation steps, test feedback loops.

A React Query pattern guide burns tokens during a database migration. An architecture overview costs you when the agent just needs to fix a typo. A testing strategy eats into the budget when the agent is writing a one-line config change.

You're hamstringing your agent before it even gets started.

## Most of it is discoverable anyway

The test I apply now: **can the agent figure this out from the code?**

Agents have gotten pretty good at exploring codebases on their own. They read `package.json`, `tsconfig.json`, framework configs, test suites. They grep for patterns and conventions.

Most of what people put in AGENTS.md is already available in the actual source of truth: the code itself. And unlike a markdown file, the code won't rot. That architecture overview you wrote three months ago? Half the file paths are wrong now. But the code is always current.

The "discoverable from code" test eliminates probably 80% of what I see in most AGENTS.md files. Language conventions? The linter config already says that. Framework patterns? The existing code already shows that. File structure? The agent can literally `ls` the directory.

## What actually belongs in AGENTS.md

So between the instruction budget and the discoverability test, what's left? The bar is: the agent needs it on every task, and it can't figure it out from the code.

What survives that filter is surprisingly small:

- "Use pnpm, not npm." Tooling the agent might guess wrong.
- "Run `make test` before submitting." Commands not discoverable from the code.
- "This repo requires Python 3.12+." Constraints that save the agent from debugging cryptic errors.
- "Don't import from `src/internal`, use the public API." Anti-patterns the agent would otherwise walk right into.

That's roughly it. If you need more than ~10 lines of explanation for something, it probably doesn't belong in the always-on file.

## Skills - the better pattern

So where does everything else go? Into **skills**.

Skills are on-demand context. They load when relevant and stay out of the way when they're not.

Your React Query patterns? That's a skill. Your architecture guide for the payments module? Skill.

The key difference is selectivity. Say you have a skill called `testing-strategy.md` that describes your integration test setup, your mocking conventions, how you handle database fixtures, and which test runner flags to use. When the agent is writing a new test, it reads that file and follows your patterns. When it's updating a README? It never sees it. Those 80 lines of testing context cost you nothing on tasks where they're irrelevant.

This is the same principle behind lazy loading in software. You don't load your entire application into memory at startup. You load the modules you need when you need them. Context for agents should work the same way.

```
# Bad: everything in AGENTS.md (always loaded)
AGENTS.md (200 lines of conventions, patterns, architecture)

# Better: minimal AGENTS.md + scoped skills (loaded on demand)
AGENTS.md (10 lines of universal rules)
skills/
  react-patterns.md
  testing-strategy.md
  api-conventions.md
  i18n-workflow.md
  database-migrations.md
```

## A caveat, and where this is heading

The paper studied bug fixes and issue resolution on existing codebases. It didn't study "build me a feature from scratch" or "refactor this entire module." It's possible that richer context files help more in those scenarios. We don't know yet.

But I'd bet the direction holds. Most people today give agents small, bounded tasks, and a bloated AGENTS.md is annoying but survivable. The industry is moving toward longer-running agentic workflows though. Background agents that plan and iterate across entire features for minutes at a time. In that scenario, the agent's own reasoning takes up more and more of the budget. Your 200-line conventions file doesn't just waste tokens at that point. It actively competes with the agent's ability to hold its own plan together.

## What I actually have in my setup

My own CLAUDE.md is opinionated but focused on things that genuinely apply to every task: use TypeScript, extreme conciseness, minimal blast radius, prefer battle-tested libraries over custom code, specific commit message format.

Everything else lives in skills. [blah.chat](https://blah.chat) has a `.claude/skills/` directory with domain-specific skills that load on demand: memory architecture patterns, API conventions, testing approaches, deployment workflows.

It works. The agent stays focused. Costs stay reasonable. And the skills don't rot because they're scoped narrowly enough to stay accurate.

## The simple version

Your AGENTS.md is probably too long, and it's probably making your agent worse.

Apply the two-question filter ruthlessly. What survives will fit in ten lines. Move the rest to skills, or delete it entirely. Let your agent think.
