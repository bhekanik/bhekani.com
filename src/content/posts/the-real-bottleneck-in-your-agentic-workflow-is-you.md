---
title: "The real bottleneck in your agentic workflow is you"
pubDate: 2026-03-14
description: "When an AI agent stops to ask you something, it's usually not a reasoning failure. It's a context-access failure. The fix isn't a smarter model. It's better systems for capturing the judgment trapped in your head."
author: "Bhekani Khumalo"
published: true
tags: ["ai", "technical", "agents", "memory"]
---

I spend a lot of time coding with AI agents, and a pattern keeps showing up that I think most people misread.

The agent gets stuck. It stops and asks me something. I answer. It carries on perfectly well. The standard interpretation is that the model wasn't smart enough. But look at what actually happened: it asked one question, got one missing piece, and continued. If the model were incapable of doing the work, my answer wouldn't have unblocked it. I would have needed to reason through the whole thing myself.

That's not what happens. The model hits a boundary where some piece of context lives in one place only: my head. The interruption is not a reasoning failure. It's a context-access failure.

Once you see it that way, a different design problem appears. The question stops being "how do we make the model smarter?" and becomes "how do we reduce the number of times the system has to query the human for context that could have been available already, or captured once and reused later?"

When an agent interrupts you mid-task, it is doing something simple. It is querying you. Almost like an API call to a system it can't fully inspect. The model doesn't have access to the assumptions in your head, your project-specific judgment, your preferences, your mental map of the codebase, the decisions you made three weeks ago that still shape how the work should be done today. So it asks.

I think human-in-the-loop agent systems are best understood as a cache architecture. Your brain is the origin server. The agent's memory, documentation, skills, prior examples, and operational rules are the cache in front of it. The goal is to avoid hitting that origin for the same class of question over and over again.

## What's actually stuck in your head

Most people assume that what's stuck in the human's head is project facts. That matters, but it's too narrow.

When you step in to answer an agent's question, you're not always giving it information. Often, you're giving it judgment.

Sometimes it's concrete facts: this service behaves differently in staging, this endpoint is technically deprecated but another team still depends on it, this customer workflow matters more than the internal abstraction.

Sometimes it's preferences about how you or your team works: prefer explicit if statements over ternaries, keep orchestration logic out of the route handler, don't introduce another config format unless absolutely necessary.

Sometimes it's principles: fix root causes rather than patching symptoms, prefer reversible changes when ambiguity is high, don't optimize away clarity in core flows.

Often it's heuristics, compressed judgment from experience: if something touches billing, auth, or migrations, slow down. If there are two plausible interpretations, choose the one with the safer rollback story. If a failing test looks flaky, check shared mutable state before touching production code.

It could be decision rules you apply repeatedly: if the change touches a shared interface, prefer the adapter layer before changing domain types. If the request is underspecified and low-risk, act with the most unsurprising default. If the action is hard to reverse, stop and ask.

It could be workflow steps about how work actually gets done: before changing this pipeline, inspect the event shape at all three boundaries. Before merging a migration, assess lock risk and reversibility separately.

Or it could be exceptions, things that look fine generically but are wrong here: don't reuse that helper, it has side effects nobody expects. Don't copy that older pattern, it exists for historical reasons.

This is what makes the problem interesting. The missing thing is usually not an answer. It's a decision policy. And decision policies can often be externalized enough to reduce future interruptions.

## Why "just document everything" doesn't work

The obvious response is: fine, so write it down. Document your facts, your preferences, your heuristics, your decision rules. Problem solved.

Two things make that harder than it sounds.

First, you can't write down everything. There's always tacit knowledge. Knowledge you don't realize you have. Knowledge you have but can't articulate yet. Pattern recognition from years of experience that doesn't compress into a rule. I'm not claiming that every part of human reasoning can be exported into a machine-readable system.

But the opposite mistake is more common and more damaging: assuming that because not everything can be captured, there's no point capturing the recurring parts. When people complain that "the model keeps asking me things," they usually don't mean the task is irreducibly human. They mean there's a recurring class of missing context that nobody has turned into shared memory, rules, or a skill. That's a solvable problem.

Second, you usually don't know in advance which details will matter. You don't know which ambiguities will recur. Nobody sits down one day and transcribes their working knowledge into a neat operating manual. And if they tried, most of it would be low-signal junk.

I've [written before](/posts/your-agents-md-is-probably-hurting-your-agent/) about how dumping everything into a static context file often makes agents worse, not better. The instruction budget is real — every irrelevant rule competes with the agent's own reasoning. Static documentation is necessary but not sufficient. The better pattern is dynamic capture. Let the interruptions themselves show you where the cache misses are.

Every time the agent stops and asks a meaningful question, you've learned something. You've found a place where live human context was still on the critical path. That interruption is diagnostic. It tells you: this class of work still depends on private knowledge. This policy was never externalized. This ambiguity was predictable. This decision pattern should be reusable.

Instead of trying to precompute everything, you let repeated friction reveal what matters. A lot of useful knowledge only surfaces at decision time. You don't know what should be a rule until you notice the agent getting stuck on it. You don't know what your own private policy actually is until you hear yourself explain it.

## Store the policy, not the answer

This is the part that matters most.

If the agent asks "should I use option A or option B?" and you say "use option B," that unblocks the task but doesn't improve the system. The answer is too local.

What matters is the policy behind the answer. Why option B? Because option A would create hidden coupling? Because option B is more reversible? Because this area is shared infrastructure and your team optimizes for clarity over abstraction in this layer? The reasoning is the reusable part.

Compare these:

A bad memory entry says: "use option B here." A better one says: "when a change touches shared interfaces and one option increases hidden coupling, prefer the option that preserves local isolation, even if it is less elegant."

A bad memory entry says: "don't use that helper." A better one says: "avoid reusing helpers with hidden side effects in request-critical paths. Prefer explicit local logic if the helper obscures control flow."

A bad memory entry says: "ask before doing schema changes." A better one says: "for schema changes, stop and ask when rollback is unclear, lock risk is unknown, or downstream consumers are not visible from the current repo."

The second version generalizes. That's what a cacheable human judgment artifact looks like.

The parallel to mentorship is hard to miss. When a junior engineer asks the same kind of question repeatedly, the right move isn't to answer the immediate question each time. It's to surface the underlying principle. "In situations like this, prefer X over Y because of Z." Over time, they internalize the policy. The number of interrupts drops. The quality of independent judgment goes up. A good agent system should compound in exactly the same way. Each interruption should make the next one less likely. If it doesn't, you're paying the same cognitive tax every time.

The system should also be rewriting your natural, conversational explanations into something operational. Not vague advice like "be careful with migrations" or "use good judgment" or "think about edge cases." Usable guidance like: "Before any migration, inspect current schema shape, estimate lock risk, ensure reversibility, and avoid combining schema and data backfill changes in one deploy unless explicitly justified." That's how hidden judgment becomes executable.

## The cache architecture

Once you see all this, the cache metaphor becomes surprisingly complete.

You don't repeatedly query the most expensive, highest-latency component in a system if you can front it with a well-designed cache. A good agent architecture should check its own task context first, then explicit rules and project docs, then prior decisions and examples, then extracted heuristics and skills. Only after all of that should it call the human.

The sub-concepts map cleanly. A cache hit is when the agent finds a relevant rule or prior decision and proceeds without asking. A cache miss is when the needed context isn't available, so the agent interrupts the human. Cache warming is when you proactively add rules and examples for things you know will come up. Read-through caching is when the agent asks you once, then stores the useful part so future cases are served from memory. Semantic caching is when the next case isn't identical but similar enough that the same policy applies.

The hard parts of caching map too. Invalidation matters because old rules go stale. Teams change, codebases change, preferences shift. Guidance that was right six months ago may be wrong now. This connects to something I explored in [building memory systems that forget](/posts/cognitive-memory-for-ai-agents/) — memory that treats everything as equally permanent is memory that eventually drowns in noise. Scope matters because some knowledge is global, some repo-specific, some feature-specific, some only valid for the current task. And some guidance should degrade in confidence over time.

A bad cache fails in two opposite directions. It either forgets too much and keeps hitting the human for things it should already know, or it remembers too aggressively and applies outdated rules where they no longer fit. The hard problem isn't "store more stuff." It's "store the right thing, at the right level of abstraction, with the right scope and retrieval behavior."

There's a related question the system should be asking: did I actually need to interrupt at all? Before asking, it should check whether it already has a relevant rule, whether it has similar prior examples, whether there's a safe reversible default, whether it's facing true ambiguity or just uncertainty. Some agents over-ask not because context is missing but because they're timid. You want learning, but you also want a bias toward acting when the downside is low and the move is reversible.

## What this reframes

All of this points to an uncomfortable conclusion. A lot of what we casually call "AI weakness" is really operator knowledge that has never been externalized. The human carries around facts, heuristics, interpretations of what "good" means in this particular project, memories of prior failures. None of that is available to the system until the human speaks.

Reasoning quality still matters. Not all interruptions are avoidable. But a surprising amount of human oversight is the injection of missing context and missing decision policy. Once you see that, you stop thinking only about bigger models, better prompts, or longer context windows. You start asking: what classes of interruption keep recurring? What hidden context caused them? Can it be represented in a reusable form? Can we reserve live human queries for the cases that genuinely need them?

This idea has roots in older work on tacit knowledge and externalization, the notion that valuable know-how lives inside people until it gets turned into shareable artifacts. There's also a growing body of work on agent memory and cognitive architectures that tries to classify different kinds of stored knowledge. What I'm adding here is a systems-level framing: an agent interrupt is often a cache miss against human-held context, and the right engineering response is to treat each interrupt as a chance to warm the cache.

A simple rule falls out of that: every meaningful interruption should produce either a one-time answer or a reusable artifact. If the answer is too local, it stays local. But if the same class of question is likely to come back, the system should capture the policy behind the answer and make it available next time. That's how the workflow compounds. That's how you reduce interruption frequency without pretending the human is unnecessary.

Human attention is expensive, slow, breaks flow, and doesn't parallelize. Use it where it matters: novel decisions, genuine ambiguity, high-risk actions, policy changes, edge cases outside the known patterns. Build everything else so that the system serves itself from the cache before it reaches for the human.

The best agent workflows don't try to remove the human. They put a smart cache in front of the human.
