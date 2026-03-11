---
title: "MLOps vs LLMOps: what changes when your model is an API call"
pubDate: 2026-03-10
description: "Your LLM can fail silently. No crash, no error - just worse answers reaching users while your logs show 200 OK. That's one of several ways LLMOps breaks from traditional MLOps. Here's what actually changes when your model is an API call."
author: "Bhekani Khumalo"
published: true
tags: ["ai", "technical", "mlops", "llmops"]
---

Every software engineer can call an API. Wire it up to an inference endpoint. Ship it. So if every engineer can do this... does that make every engineer an AI engineer? What exactly _is_ an AI engineer?

I've been digging into this question, partly to organize my own thinking. There are two ways people tend to get it wrong. The first: AI engineering is just calling an API. Wire it up, ship it, done. The second, more sophisticated version: AI engineering is machine learning, so the operational discipline is MLOps - the mature practice of training, deploying, and monitoring ML models. Both framings miss something. When you're building on top of foundation models you don't own, the operational problems are different enough that they've earned their own name: LLMOps. And understanding why requires understanding what breaks after deployment.

Chip Huyen, who literally wrote the book on this (her O'Reilly title [AI Engineering](https://www.oreilly.com/library/view/ai-engineering/9781098166298/) is the closest thing the field has to a reference text), puts it plainly: _"It's easy to make something cool with LLMs, but very hard to make something production-ready with them."_ Gartner [found](https://www.gartner.com/en/newsroom/press-releases/2024-10-22-gartner-says-more-than-30-percent-of-generative-ai-projects-will-be-abandoned-after-proof-of-concept-by-end-of-2025) that more than 30% of generative AI projects were abandoned after proof of concept by end of 2025. The demos worked. The operations didn't.

## Traditional MLOps: a quick refresher

In traditional machine learning, you train a model on labeled data. You collect a dataset, label it, train a classifier or regressor, evaluate it, deploy it, and monitor it for drift.

These models are deterministic. Same input, same output. You measure success with hard metrics: accuracy, precision, recall, F1 score. If performance degrades, it's usually because the data distribution shifted. Your users started behaving differently than your training data expected. You retrain on fresh data and redeploy.

The key thing: **you own the weights.** The model is a file you trained. You control it. You can inspect it. Nobody changes it without your knowledge.

The pipeline is well-understood: data collection → labeling → training → evaluation → deployment → monitoring. MLOps tooling exists to automate each step. It's a solved-ish problem.

The assumption running through all of it: you own the thing that determines behavior. That assumption doesn't survive contact with LLMs.

## The shift: you're orchestrating, not training

You're not training the base model. You're calling an API. The unit of work shifts from "model" to "system": your product is now a combination of prompts, retrieval pipelines, tool integrations, guardrails, and routing logic. Each with its own lifecycle and failure modes.

OpenAI, Anthropic, or Google can change model behavior under you with no notice. Your prompts that worked perfectly on GPT-5 might break when the provider updates to GPT-5.2. No code changed on your side.

If MLOps is building an engine, LLMOps is wiring together an engine you bought - with custom fuel lines, intake filters, and exhaust monitoring. You didn't build the engine and you can't open the hood, but you're responsible for making the car drive reliably. ZenML's analysis of [1,200 production deployments](https://www.zenml.io/blog/what-1200-production-deployments-reveal-about-llmops-in-2025) found that software engineering fundamentals, not frontier models, remain the primary predictor of success. The engine matters less than how well you've wired it together.

## What breaks after deployment

The MLOps instincts that serve you well - deterministic outputs, owned infrastructure, training-time costs, test suites with right answers - break in different ways depending on where you look. Here's where each one fails.

### Silent quality degradation

The scariest failure mode in LLM systems is the one that doesn't look like a failure. No crash. No error. Just worse answers.

Unlike traditional ML where data drift triggers alerts, LLM quality degrades without obvious signals. Hallucinations reach users without triggering anything in your monitoring. The model confidently makes something up, the user doesn't know enough to question it, and your logs show a successful 200 response.

According to LangChain's [State of AI Agents](https://www.langchain.com/state-of-agent-engineering) report (1,340 respondents), **32% cite quality as their number one production barrier.** Not latency, not cost — quality.

### Non-determinism

Here's something that still catches people off guard: the Thinking Machines team ran [1,000 identical completions at temperature=0](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/) and got **80 unique outputs.** Same prompt. Same parameters. 80 different answers.

This isn't just an inconvenience. It breaks the foundational assumption behind most of software engineering's quality tools. Unit tests work because the same input produces the same output - you write a test, it passes or fails, done. That contract doesn't hold with LLMs. You can't write a test that says "given this question, return this answer" because the answer will vary. The whole testing paradigm shifts from pass/fail to probabilistic - which is why the field landed on evals rather than tests. You're not checking whether the output is correct, you're measuring whether it's good enough, often by using another LLM as a judge. That's a different engineering discipline, not just a different tool.

Instead of accuracy and recall, you track helpfulness, coherence, latency, hallucination rate, and cost per query. The same shift applies to monitoring: you're not alerting on errors, you're measuring quality distributions over time and watching for drift.

Evaluation itself becomes an LLM task - you use one model to judge another model's outputs. It's the best approach we have at scale. I wrote about a related angle in [testing specific AI behaviors](/posts/your-ai-is-confidently-wrong), where even measuring something as simple as "does the model push back on nonsense" requires elaborate benchmarking.

### Cost spiraling

In traditional ML, compute costs are frontloaded during training. You pay once, then inference is cheap. Cost is a problem you solve before deployment, not one that compounds with every user request.

With LLMs, cost is a continuous operational variable. Every API call costs money, and output tokens cost 3-10x more than input tokens. A poorly optimized prompt that uses 2,000 tokens instead of 500 can quadruple your operational expenses, and you're paying that on every single request, indefinitely. The mental model of "we paid for the infrastructure, now it runs" doesn't apply.

The strategies that work: model tiering (cheap models handle the bulk of routine tasks, expensive models handle the edge cases that actually need them), prompt caching (cache hits cost about 10% of standard tokens, a 90% discount), and [smart routing between models](/posts/building-an-llm-model-router-lessons-from-the-wild). Applied together, these compound to 60-80% savings.

None of this exists in traditional MLOps. There's no "prompt cost" in a random forest.

### Latency and reliability

Traditional software latency is measured in milliseconds. You cache aggressively, optimize queries, and if something takes more than a second you investigate. That intuition breaks with LLMs.

API calls take seconds, not milliseconds. They can die or time out. And multi-step agent workflows multiply latency at each step, so if your agent makes five sequential LLM calls and each takes two seconds, your user is waiting ten seconds before seeing anything. The standard web engineering playbook (add a spinner, optimize the query) doesn't get you out of this. You need streaming responses, fallback models, circuit breakers, and deterministic fallback paths for when the AI just doesn't respond in time. 20% of teams cite latency as their top production challenge in the LangChain survey, which tracks because it's the one that most directly affects users and has the fewest easy fixes.

### Model updates break things

This is the one with no analogy in traditional ML - or in software engineering more broadly. In most engineering disciplines, dependencies change when you update them. A library ships a new version, you pin it or upgrade it, you own that decision.

To be fair to the providers: most of them do offer versioned model endpoints. You can pin to `gpt-4o-2024-05-13` or a specific Claude Sonnet release and get some stability. But "some" is doing a lot of work there. In April 2025, OpenAI pushed an update to GPT-4o that made it noticeably more sycophantic - users reported it endorsing harmful decisions and agreeing with delusions. OpenAI rolled it back four days later and admitted they'd over-weighted short-term thumbs-up feedback signals in training. On the Anthropic side, around the same time, infrastructure bugs caused weeks of quality degradation in Claude Sonnet and Haiku - responses getting dumber, context getting lost, code generation going sideways. Anthropic said it was unintentional bugs, not throttling, but the effect on developers was the same: your carefully tuned prompts stopped working and you had no way to know why.

The deeper issue is that versioning helps but doesn't fully protect you. Infrastructure changes, routing decisions, and load balancing all affect behavior without touching the model version string. You're managing a dependency with no real analogy in a package manager. When a pip package behaves differently on Tuesday than Monday with no version change, that's a bug in your code. When an LLM does it, it might be a bug in the provider's infrastructure, a training update, or just non-determinism. You often can't tell which.

You need fallback routes across providers (tools like [LiteLLM](https://github.com/BerriAI/litellm) help here), CI scanning for deprecated model aliases, and shadow testing before cutting over to new versions.

### Debugging opaque failures

When users report issues with traditional software, you check the logs, reproduce the bug, fix it. With LLMs, you open the logs and see the user's message and the model's response, but you can't see _why_ it said what it said. Where did it get that made-up policy? Why did it hallucinate a feature that doesn't exist?

You need distributed tracing, full request/response logging with trace IDs, and the ability to replay a specific conversation. But even then, non-determinism means exact reproduction is often impossible.

This is the gap most teams fall into: they instrument observability early (you can see what your LLM is doing) but never build evals (you can't systematically measure whether it's doing it well). Seeing and measuring are different problems.

That raises a harder question: what are you actually measuring? In traditional ML the answer is clear - you measure the model. In LLM systems the answer is more complicated, because the model isn't really what determines behavior. The prompts do.

## Prompts as production artifacts

A prompt change can silently break behavior you spent weeks tuning. For simple setups, version control handles this fine - prompts are text files, git works. But in live systems the problem is different: you need to run two prompt variants concurrently to see which performs better, roll back a bad change without a full redeploy, and keep dev/staging/prod versions separate.

The deeper problem isn't storage though. It's consistency. Without a defined end-to-end workflow, each conversation goes differently depending on how the user happens to phrase their request that day. Two people using the same agent for the same task can get completely different sequences of tool calls. When that happens, users blame the integration - the connector looks broken - when the real failure is that the workflow is unguided. The agent has no anchor for what to do next, so it improvises every time. Platforms like LangSmith and PromptLayer have emerged specifically for this: managing prompts as live operational artifacts with observability attached, so you can see not just what changed but whether it actually helped.

Prompting isn't a solo engineering activity anymore. Product managers iterate on wording, domain experts validate accuracy, engineers ensure technical correctness. You need a shared workflow for this, just like code review.

## RAG: your retrieval pipeline is the product

Prompts control what the model does. But in most production systems, what you put _into_ the prompt matters just as much - and that's where RAG comes in.

RAG (Retrieval-Augmented Generation) sounds simple: the model doesn't know your data, so you retrieve relevant documents and stuff them into the context window. But this is where another MLOps assumption quietly breaks. In traditional ML, the model is the product - you train it, it encodes the knowledge, you deploy it. With RAG, the retrieval pipeline is just as much the product as the model. A bad retrieval step produces a confidently wrong answer regardless of how good your model is.

Chunking strategy matters - too small and you lose context, too large and you dilute relevance. So does your embedding model, your vector store, and how fresh your index is. And then there's embedding drift: your embedding model gets updated, and now all your vectors are slightly off. Everything needs re-indexing.

ZenML's analysis found the biggest shift in production AI is from "prompt engineering" to "context engineering" - what goes in the context window matters more than the prompt itself. I explored related territory in [building cognitive memory for AI agents](/posts/cognitive-memory-for-ai-agents), where the challenge is deciding which memories to surface and which to let decay.

## Agents: when it gets really complicated

Once you move beyond single LLM calls to agents - systems that chain calls with tools, memory, and self-correction - you're no longer deploying a model. You're deploying a reasoning system that decides what to do next.

The failure modes get strange in ways that are hard to anticipate until you've seen them. A common one: an agent is connected to a support system with no defined workflow. Each conversation starts from scratch. Depending on how the user phrases the request, the agent might call three different tools in three different orders and arrive at three different answers - none of them obviously wrong. Users blame the integration. The connector looks broken. But the real failure is that the workflow is unguided: the agent has no anchor for what to do next, so it improvises every time. The scarier version is when it doesn't fail visibly at all - it calls the right tool with slightly malformed parameters, gets a graceful error back, and hallucinates an answer rather than escalating. Your logs show a completed workflow. The user sees a confident response. Nobody detects anything wrong.

This is why you need to trace why an agent made seven API calls to answer a simple question. Was it stuck in a retry loop? Did it call the wrong tool? Did a tool timeout cause it to try a different approach? Without distributed tracing at the agent level, you're mostly guessing.

In production agent systems, the AI itself completes only about [30% of the work](https://dev.to/imaginex/is-ai-agent-development-just-about-calling-apis-wheres-the-real-difficulty-2j75). The remaining 70% is tool engineering: deciding which tools to expose, how to describe them, what permissions to grant, how to handle failures. The engineering around the model dwarfs the model itself.

This is the frontier. Nobody has it figured out yet.

## The comparison

| Dimension     | MLOps                       | LLMOps                                                              |
| ------------- | --------------------------- | ------------------------------------------------------------------- |
| Core activity | Train and deploy models     | Orchestrate pre-trained models                                      |
| You own       | The weights                 | The prompts, retrieval, and glue                                    |
| Key artifact  | Trained model               | Prompt + pipeline config                                            |
| Metrics       | Accuracy, precision, recall | Helpfulness, coherence, hallucination rate, latency, cost           |
| Drift         | Data distribution drift     | Prompt drift, embedding drift, model behavior drift (provider-side) |
| Testing       | Test set with labels        | LLM-as-judge, human eval, A/B tests                                |
| Failure mode  | Wrong prediction            | Confident hallucination                                             |
| Cost model    | Training compute (upfront)  | Inference tokens (ongoing, per-request)                             |
| Determinism   | Same input → same output    | Same input → different output                                      |
| Debugging     | Reproduce with same input   | Can't reproduce — non-deterministic, need traces                    |

## So does calling an API make you an AI engineer?

No. Every software engineer can call an API. That's table stakes.

The differentiator is everything that happens after the API call. As one [analysis](https://dev.to/imaginex/is-ai-agent-development-just-about-calling-apis-wheres-the-real-difficulty-2j75) puts it: the enormous gap between a demo-quality agent and a production-quality one doesn't come from who's calling different APIs - it comes from the vastly different quality of the 95% of engineering that happens outside the API call.

AI engineers don't just build with AI APIs - they operate AI systems. The difference isn't just tooling. It's a different mental model: instead of thinking "does this code do what I wrote?" you're thinking "does this system behave well enough, often enough, at acceptable cost?" The LLMOps layer is what separates "I shipped a feature that uses AI" from "I run AI in production."

| Building with AI        | Operating AI systems                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| Makes a demo that works | Makes a system that works at scale                                   |
| Writes a prompt         | Versions, evaluates, and deploys prompts through environments        |
| Calls one model         | Routes between models based on task complexity and cost              |
| Hopes output is correct | Builds eval pipelines, guardrails, and feedback loops                |
| Pays whatever it costs  | Optimizes tokens, caches, batches, and tiers models                  |
| Ships and forgets       | Monitors latency, quality, hallucination rates, and cost per request |

This is why AI engineering is real. Not because calling APIs is hard. Because operating AI systems is.

## Bottom line

MLOps is about managing models. LLMOps is about managing entire systems.

If you're running an LLM application through your traditional ML pipeline, you're probably missing most of what can go wrong.

I'm still learning all of this myself. But I'm increasingly convinced that the gap between "I called an API" and "I run this in production" is where the real engineering lives.
