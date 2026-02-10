---
title: "Why I Built AI That Forgets: A Tampa Trip Story"
pubDate: 2026-02-10
description: "My AI remembered I was going to Tampa. Then it forgot which day I was going to the beach. The problem wasn't too little memory—it was too much, all equally prioritized."
author: "Bhekani Khumalo"
published: true
tags: ["ai", "memory", "product", "blah.chat"]
---

I was planning a trip to Tampa last month. I told my AI assistant about it—which hotels I was considering, what I wanted to do, when I'd be there. Over the next few weeks, the magic happened.

I'd be talking about something completely unrelated, and the AI would naturally reference my Tampa plans. "Oh, you could read that book on the flight to Tampa." "That restaurant sounds like the kind of place you'd want to try while you're in Tampa." It felt like talking to someone who actually *knew* me.

Then one day I asked: "Which day am I planning to go to the beach on my Tampa trip?"

The response: "Oh, you're going to Tampa? That's exciting! Let me research some beaches for you."

All the magic—gone in an instant.

## The Problem Wasn't Missing Memory

The strange thing? The AI *had* memories about my Tampa trip. I could see them in the database. Dozens of entries about hotels, beaches, dates, activities.

But when I asked which day I'd planned for the beach, it couldn't find the right one. It knew I was going to Tampa (that came up in the search), but not the specific plan I'd made.

The problem wasn't that memory was missing. The problem was that **every memory had equal priority**.

## How AI Memory Works (and Fails)

Most AI memory systems—including the one I'd built for [blah.chat](https://blah.chat)—work like this:

1. Store everything you talk about
2. When you ask a question, do vector search for relevant memories
3. Return the most semantically similar ones

The only way memories are prioritized is by **relevance score**—how closely the embedding matches your query.

But here's what that misses:

- **Recency**: The beach plan from yesterday vs. a beach thought from three weeks ago
- **Importance**: A confirmed reservation vs. a passing "maybe we should..."
- **Access patterns**: Something I've referenced 10 times vs. mentioned once

Everything gets the same treatment. A trivial thought from last month can outrank a critical detail from yesterday, simply because the words match better.

That's not how your brain works.

## How Human Memory Actually Works

Your brain doesn't treat all memories equally. It:

1. **Fades unimportant things**: Trivial details decay quickly. If you don't use them, they disappear.

2. **Strengthens important things**: Every time you recall something, it gets stronger. Your brain is literally saying "this matters, keep it."

3. **Adapts to what's relevant now**: The beach day you planned yesterday is more accessible than beach thoughts from last month, even if the words are identical.

This isn't a bug—it's optimization. Your brain has limited resources. Remembering *everything* equally would make it impossible to think.

Neuroscientist Blake Richards puts it plainly: **"The goal of memory is not to transmit the most accurate information over time, but to guide intelligent decision-making."**

Perfect memory isn't the goal. *Useful* memory is.

## Why "Just Add More Context" Doesn't Work

The obvious fix: dump more memories into the context window. If 5 memories aren't enough, try 20. Or 50.

I tried this. It made things worse.

More context meant:
- Slower responses (more tokens to process)
- Higher costs (paying for irrelevant context)
- Worse reasoning (AI drowning in noise)

And fundamentally, it didn't solve the problem. The Tampa beach day was still buried among 50 other memories, all treated equally.

Adding more memories is like trying to remember something by reading your entire diary. You need *curation*, not *volume*.

## The Research: Forgetting is a Feature

I went looking for solutions and found research that changed how I think about memory.

**Popov et al. (2019)**: "Forgetting Is a Feature, Not a Bug: Intentionally Forgetting Some Things Helps Us Remember Others by Freeing Up Working Memory Resources."

Their finding: When your brain forgets irrelevant things, it frees up resources for what actually matters.

**Richards & Frankland (2017)**: "The Persistence and Transience of Memory."

Their argument: Memory isn't about perfect recall. It's about making good decisions in a changing world. Forgetting outdated information is *adaptive*.

The pattern was clear: **forgetting makes you smarter, not dumber**.

## What I Built Instead

I rebuilt blah.chat's memory system around three principles:

### 1. Memories Decay Over Time

Unimportant things fade. Important things persist.

I implemented **Ebbinghaus forgetting curves**—the exponential decay discovered in 1885. Each memory has a "retention score" that drops over time.

But the decay isn't uniform:
- **Important memories** decay slower (your trip dates vs. random beach thoughts)
- **Procedural memories** don't decay at all (your coffee preferences are stable)
- **Episodic memories** fade faster (what you had for lunch last Tuesday is gone)

### 2. Retrieval Strengthens Memory

Every time you access a memory, it gets stronger.

This is **spaced repetition**—the technique used by Anki and SuperMemo. But instead of flashcards, it's automatic.

When the AI recalls your Tampa beach day to answer your question, that memory's stability increases. It's more likely to surface next time.

Trivial memories that never get accessed? They fade away.

### 3. Related Memories Link Together

When two memories are accessed together, they link.

If I ask about the Tampa trip and the AI recalls both "beach day on Thursday" and "hotel checkout Friday morning," those memories link.

Next time I think about checkout time, the beach day surfaces too. Just like your brain's associative memory.

## The Results

I tested the new system with the Tampa scenario.

**Before (static memory):**
- Query: "Which day is the beach?"
- Top result: Generic beach discussion from 3 weeks ago
- My specific plan: Buried at #8

**After (cognitive memory):**
- Query: "Which day is the beach?"
- Top result: "Beach day Thursday, confirmed with Sarah"
- Why: High importance, accessed twice, very recent

The magic came back. But now it was *reliable* magic.

## Why This Matters for Your AI Projects

If you're building anything with AI memory, here's what I learned:

**Don't optimize for total recall.** Optimize for *relevant* recall.

**Use decay curves.** Old information shouldn't compete with new information at equal priority.

**Strengthen on access.** When the AI uses a memory successfully, make it easier to find next time.

**Link related memories.** Context isn't just semantic similarity—it's what you've accessed together.

**Let things fade.** Forgetting isn't failure. It's cleanup.

The human brain has had millions of years to figure this out. We should learn from it.

## The Technical Implementation

If you want to implement this yourself, I open-sourced the system:

**npm package**: `@blah-chat/cognitive-memory`

**Key features:**
- Ebbinghaus decay curves (configurable by memory type)
- Automatic retrieval strengthening
- Associative memory graph
- Adapter pattern (works with Postgres, Convex, etc.)

The core formula is simple:

```typescript
retention = e^(-days / (stability × importance × base_decay))
```

Where:
- `days` = time since last access
- `stability` = grows each time you retrieve it
- `importance` = how significant the memory is
- `base_decay` = 30 days (episodic), 90 days (semantic), ∞ (procedural)

[Technical deep dive here](https://bhekani.com/posts/cognitive-memory-for-ai-agents)

## What Changed for Users

The difference is subtle but profound:

**Before:** "My AI has a huge memory, but can't find what I need."

**After:** "My AI remembers what actually matters."

Conversations feel more natural. The AI doesn't just search for keywords—it knows what you talked about recently, what you've emphasized, what's connected to what.

It's not perfect memory. It's *intelligent* memory.

## The Bigger Picture

We're at an inflection point with AI. Everyone's racing to add more context, bigger windows, infinite memory.

But that's the wrong direction.

The limiting factor isn't memory *capacity*—it's memory *quality*. An AI with 1 million tokens of context is useless if it can't prioritize what matters.

The solution isn't remembering more. It's **remembering better**.

That means:
- Forgetting the irrelevant
- Strengthening the important  
- Adapting as contexts change

Your brain already does this. Your AI should too.

## Try It

blah.chat now uses cognitive memory by default. Every new conversation benefits from:
- Memories that fade naturally
- Automatic retrieval strengthening
- Associative linking

You don't have to think about it. It just works.

The Tampa beach day problem? Solved.

Not because the AI has perfect memory, but because it has *smart* memory. Memory that knows what matters, what's recent, and what's worth keeping.

**Try it:** [blah.chat](https://blah.chat)

**Build it:** [npm install @blah-chat/cognitive-memory](https://www.npmjs.com/package/@blah-chat/cognitive-memory)

---

*Building AI that thinks like you do means building AI that forgets like you do.*

*That's not a limitation. It's the whole point.*
