---
title: "Building an LLM Model Router: Lessons From the Wild"
pubDate: 2026-02-24
published: true
description: "What we learned building a model router for a multi-model AI chat app - the scoring approach that didn't scale, and the classifier rewrite that fixed it."
author: "Bhekani Khumalo"
tags: ["technical", "ai", "llm", "model-routing"]
---

I built [blah.chat](https://blah.chat) mostly for my friends and family. It's an AI chat app that gives you access to every major model - OpenAI, Anthropic, Google, Perplexity, DeepSeek, Meta, xAI - and you can switch between them mid-conversation.

The first version had a model picker. You'd open it, see a list of 30+ models, and choose one. I thought this was great. My friends and family did not.

The feedback was unanimous: "I don't know what any of these mean." GPT-5? Claude Sonnet? Gemini Flash? These names carry weight if you're in the AI bubble. If you're not, they're gibberish.

So I built a feature I called "triage." After every message, a fast model would read the request, look at which model was chosen, and if there was a better fit it'd nudge the user: "Hey, you asked a coding question - you might get better results with GPT-5.1 Codex."

People liked it. Then they said: "This is useful, but it would be great if I didn't have to think about it at all. On ChatGPT I just get in there and talk."

Fair enough. But here's the thing about ChatGPT - when you're on the free tier, they're quietly routing you to their cheapest model. I didn't want that for my users. I wanted them to not think about model selection _and_ actually get the best model for each task.

So I needed to build a router. That's harder than it sounds.

## The naive approach: let the LLM decide

The first router worked like this:

1. Send the user's message to a fast, cheap LLM (GPT-OSS-120B via Cerebras)
2. Ask it to classify the message into one of 8 task categories (coding, reasoning, creative, factual, analysis, conversation, multimodal, research)
3. Score every eligible model with a multi-dimensional weighted formula
4. Pick the winner

The classification LLM also assessed complexity (simple/moderate/complex), whether vision or long context was needed, and whether the question was high-stakes (medical, legal, financial advice). Then the scoring engine kicked in.

The scoring formula looked reasonable on paper:

```
base_score = category_score[model][task]
+ secondary_category_bonus
- cost_penalty * user_cost_bias
+ speed_bonus * user_speed_bias
+ stickiness_bonus (if same model as last message)
+ reasoning_bonus (if task needs thinking)
+ research_bonus (if perplexity model + research task)
```

After scoring, we'd bucket models into cheap/mid/premium tiers, roll a weighted random to pick which tier, then select a random model from that tier. The weights shifted based on complexity - simple tasks weighted toward cheap models, complex tasks toward premium.

It worked. For about two weeks.

## Why mathematical capability scoring breaks

The problem with scoring models is that the scores are lies. Not intentional lies - they're just opinions that ossify into numbers.

When I first set up the model profiles, I gave Claude Opus 4 a coding score of 98 and GPT-5 a coding score of 92. Why those numbers? Because that's roughly how they felt when I tested them. "Roughly how they felt" is a terrible foundation for a routing system that makes thousands of decisions a day.

**The scores drift.** Models get updated silently. Google pushes a Gemini 2.5 Flash update that seriously improves its coding ability, but the router still thinks it's an 85. Meanwhile, a model that was genuinely good at creative writing three months ago has been de-tuned for "safety" and now produces bland output - but the router still routes creative tasks to it because the score says 95.

**The weights fight each other.** Instead of stopping to rethink the approach, I kept patching.

The stickiness problem was a good example. The clean solution is a simple rule: if the route label hasn't changed, keep the same model. But I was so committed to the scoring approach that I tried to solve it with scores. So I bumped the current model's score to weight it higher. A user would start with a cheap model for a casual question, then ask something complex, and the stickiness bonus would keep them on the cheap model because the score bump would outweigh the category score. So I'd add a decay factor. Which interacted with the cost penalty. Which broke something else.

The same thing happened with model diversity. The mathematical model kept giving heavy weight to Llama because it's essentially free. Every message that wasn't explicitly complex would route to Llama. I didn't want that, but instead of asking why the scoring approach kept funnelling everything to one model, I tried to inject randomness. Tier-weighted exploration: roll the dice, sometimes pick a premium model for variety. Good idea in theory. In practice, a simple "what's 2+2?" sometimes gets routed to Claude Opus 4 ($15/M input tokens) because the random roll landed on the premium tier. For a message that should cost $0.00001. Paying 100x more for the same output.

**You're asking an LLM to reason about model selection.** This was the real mistake. "Which model should handle this query?" is a classification problem, not a reasoning problem. The LLM would sometimes over-think, marking a simple "hello" as moderate complexity because, well, greetings can have cultural nuance, right?

My wife is my primary tester. She's the person I most want to actually use the things I build. One day she asked a serious question and the router, doing what it loved to do, sent it to Llama. The answer came back unanchored from reality. She looked at me and said, "See your apps now. I should just use ChatGPT."

That stung, but it was also clarifying. I looked at the scoring system I'd built and realized I didn't understand how it worked anymore. I couldn't explain why it made the choices it made. Every fix I'd applied had been a patch on a patch, and the whole thing had become opaque to its own creator. If I can't reason about the system, the system can't be reasoned with.

Cost per route: ~$0.000008. Latency: 250-600ms. And the LLM classification was wrong 15-20% of the time anyway.

## The rewrite: classification + policy

Before rewriting, I went looking for how other people solve this. There's academic work but almost no production stories. **RouteLLM** (UC Berkeley, Anyscale, and Canva, 2024) showed that classification-based routing can cut cost by up to 85% on certain benchmarks while maintaining 95% of quality. **FrugalGPT** (Stanford, 2023) demonstrated that cascading works: try a cheap model first, escalate only when needed.

OpenRouter presumably has a sophisticated production router, but they publish nothing about its internals. That made me nervous. If routing were as simple as "classify and look up," wouldn't someone have written about it by now? Maybe there's secret sauce I'm missing. Maybe the reason nobody publishes is that their routers are all held together with the same duct tape mine was.

I built the new system anyway, but with less confidence than the first time. Here's what it looks like.

### Stage 1: Hard deterministic rules

Before any ML, check simple rules. Image attachments? Route to `vision`. User says "search for" or "latest news"? Route to `research`. Conversation context over 100K tokens? Route to `long_context`. Message matches high-stakes patterns (medical advice, legal questions)? Route to `reasoning_complex`.

These fire in <1ms and handle 15-20% of all messages. Deterministic. No LLM, no embeddings, no cost.

One thing that worries me here: capability metadata can rot too. A model that supports tool calling today might lose it in an update, or a provider might add vision support without us knowing. The difference is that a broken hard rule produces an obvious failure ("this model doesn't support images"), not a subtly wrong answer. Obvious failures are easier to catch and fix. But it's still a maintenance surface I'll need to watch.

### Stage 2: Embedding similarity

For everything else, we embed the user's message and compare it against ~120 labeled examples using cosine similarity. Each example is a short message tagged with a route label.

The route labels are product trade-offs, not task types:

| Label               | What it means                           |
| ------------------- | --------------------------------------- |
| `fast_cheap_chat`   | Quick responses, minimize cost          |
| `balanced_general`  | Everyday tasks, good quality/cost ratio |
| `code_heavy`        | Code generation, debugging              |
| `creative_writing`  | Stories, copy, brainstorming            |
| `reasoning_complex` | Math, logic, high-stakes decisions      |
| `research`          | Needs web search, current information   |

The old router would classify your message as "coding" and then try to _reason_ about which model is best at coding. That's two problems stacked on top of each other. First you need an accurate task classification, and then you need an accurate scoring of model capabilities. Every routing decision passes through two layers of uncertainty, and errors in either layer compound.

The new router asks a different question entirely: "what does this message _need_?" Classifying something as `code_heavy` doesn't just describe the task. It encodes a product decision: this is worth paying for a good coder, and here's the ranked list of models we trust for that.

Each label maps to an ordered list of models (a "bin"). `code_heavy` goes to GPT-5.1 Codex first, then Claude Sonnet 4, then DeepSeek R1. `fast_cheap_chat` goes to GPT-5 Nano first, then Gemini 2.0 Flash.

The embedding comparison uses top-K weighted voting (K=5). Look at the 5 most similar examples, aggregate their labels by similarity score, pick the winner. If the winning label has high enough confidence (>82%) and enough margin over second place (>5%), we use it directly.

Cost: one `text-embedding-3-small` call, ~$0.000003. Latency: 50-100ms. 60% cheaper, 3-5x faster than the LLM approach.

### Stage 3: LLM fallback (only when uncertain)

When the classifier isn't confident - maybe the message is genuinely ambiguous between "code_heavy" and "reasoning_complex" - we fall back to a simplified LLM call. But instead of the full classification prompt, we just say: "pick one of these 3 labels." Much simpler, much faster.

This fires about 10-15% of the time in testing.

### Stage 4: Model bin selection

Once we have a route label, selecting the model is deterministic. Walk the ordered candidate list, filter by capabilities (vision? long context?), apply cost/speed preferences (user's bias settings reorder within the bin), check sticky routing (keep the same model if the label hasn't changed).

### Stage 5: Decision trace

Every routing decision gets a full trace: which hard rule matched, the top similarity score, the route label, whether the LLM fallback was used, embedding latency, total latency, candidate models considered. All stored on the message.

This is what I wanted most. With the old system, debugging a bad route meant reading LLM reasoning text like "This appears to be a moderate-complexity coding task with some analytical elements." Okay, but _why_ did it pick Gemini Flash over GPT-5.1 Codex? Who knows.

With the new system: "Hard rule: none. Top similarity: 0.89 to `code_heavy`. Second: 0.72 to `reasoning_complex`. Margin: 0.17. Selected: GPT-5.1 Codex (first in bin). Latency: 67ms." I can look at that and know exactly what happened and why.

## The feedback loop

The old system couldn't learn. The new one can.

When a user gets an auto-routed response, we capture signals. If the generation completes normally, that's an implicit positive. If they hit regenerate, that's an implicit negative. If they manually switch the model, that's a strong negative. And thumbs up/down is the obvious explicit signal.

These feed back into the example database. If users consistently regenerate messages routed as `balanced_general` that should have been `code_heavy`, we add those messages as labeled examples. The classifier gets better over time without any code changes. Right now the promotion from signal to labeled example is manual curation, but the infrastructure for automating it is there.

## What we don't know yet

I'm writing this on the day we merged the new system, before it's handled real traffic. The code sits behind a feature flag (`routerMode` in our admin config), defaulting to the legacy scoring system.

Rollout plan: run both systems in shadow mode for a week or two, logging the classifier's decisions alongside the legacy system's actual decisions. Compare agreement rate, latency, cost distribution. When I'm confident, flip the feature flag. If something breaks, flip it back from the admin dashboard. No deploy needed.

I'll write a follow-up with real production data once we have it. Questions I want answered:

- What's the actual agreement rate between legacy and classifier?
- How often does the LLM fallback fire on real traffic?
- Does the 60% cost reduction hold up?
- Do users regenerate less with the new router?
- Which route labels are under-represented in seed examples?

## What actually changed

We went from a system that cost $0.000008 per route and was wrong 15-20% of the time to one that costs $0.000003. But if I'm honest, the debuggability matters more than the cost savings. The old system produced plausible-sounding reasoning for decisions I couldn't verify or act on. The new system gives me a similarity score, a margin, and an ordered candidate list. When it makes a bad call, I can see the nearest examples, spot the gap, add a labeled example, and move on. I know where to look.

The first time around, I was so excited to ship a clever system that I never stopped to ask whether I could understand it. I kept patching because admitting the approach was wrong felt like admitting I'd wasted the work. The thing I actually learned isn't about routing. It's that a system you can explain will always beat a system that impresses you. Clever breaks at 2am and you can't figure out why. Simple breaks and you fix it in ten minutes.

And for a product I built for people I care about, that's the difference that matters.

Blah is [open source](https://github.com/b-chmlo/blah). If any of this sounds interesting to work on, I'd love some contributors.
