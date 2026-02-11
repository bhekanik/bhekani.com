---
title: "Cognitive Memory for AI Agents: Building AI That Actually Forgets"
pubDate: 2026-02-10
description: "How we built human-like memory for AI using Ebbinghaus decay curves, spaced repetition, and associative linking — and why forgetting matters."
author: "Bhekani Khumalo"
published: true
tags: ["ai", "technical", "memory", "cognitive-science"]
---

Most AI memory systems have a problem: they remember everything equally, forever. Or they remember nothing at all. Neither is how human memory works.

**And that matters.**

## Why Forgetting is a Feature

Your brain forgets most things you experience. Not because it's broken, but because it's brilliantly designed.

Research shows that **forgetting is an active process** that frees up cognitive resources. When your brain discards irrelevant information, it leaves more capacity for what actually matters. This isn't a bug—it's how you make good decisions without drowning in noise.

Neuroscientist Blake Richards puts it plainly: *"The goal of memory is not to transmit the most accurate information over time, but to guide intelligent decision-making."*

In a dynamic world, remembering everything is worse than remembering the right things. Your brain knows this. AI should too.

## The Problem with Perfect Memory

After months of building [blah.chat](https://blah.chat), I kept hitting the same wall: the AI would remember trivial details from weeks ago while forgetting important preferences mentioned yesterday. Or it would drown in context, unable to distinguish signal from noise.

Static memory (like ChatGPT's facts list) doesn't decay. Append-only RAG systems treat all context equally. Both approaches miss the fundamental insight: **memory should be dynamic, selective, and adaptive**.

So we built something different. Memory that works like *your* memory: important things stick, trivial things fade, and related memories surface together when needed.

## The Problem with Current AI Memory

There are three common approaches to AI memory today:

**1. No memory (stateless)**  
Every conversation starts fresh. What you said five minutes ago is gone. This is most chatbots.

**2. Simple context buffering (RAG)**  
Dump recent conversation history into context. Works until you hit token limits. No understanding of what matters.

**3. Static fact lists (ChatGPT's approach)**  
Save explicit memories: "User prefers dark mode." "User lives in London." These persist forever with no decay, no forgetting, no connection between memories.

The problem? **None of these mirror how human memory actually works.**

You don't remember every conversation equally. You don't keep trivial facts forever. You don't store memories in isolation.

## How Human Memory Really Works

Cognitive science has known for over a century how memory functions:

### 1. Ebbinghaus Forgetting Curve (1885)

Memories decay exponentially over time unless reinforced. Hermann Ebbinghaus discovered this by memorizing nonsense syllables and testing recall at intervals:

- After 20 minutes: ~58% retained
- After 1 day: ~34% retained  
- After 6 days: ~25% retained
- After 31 days: ~21% retained

But here's the key: **important memories decay slower**. Your first kiss? Still vivid decades later. What you had for lunch Tuesday? Already fuzzy.

### 2. Spaced Repetition

Every time you retrieve a memory, it gets stronger. But not linearly — the *spacing* between retrievals matters. Remembering something after 3 days strengthens it more than remembering it after 3 hours.

This is why flashcard apps like Anki work. They surface facts right before you'd forget them, maximizing retention.

### 3. Associative Memory

Memories don't exist in isolation. They link to related memories. Smelling coffee might trigger memories of a specific conversation, a place, a person. Your brain builds an associative graph.

When you recall one memory, related memories activate automatically. That's why you have "oh, that reminds me of..." moments.

### 4. Memory Types

Not all memories work the same way:

- **Episodic**: Events with time/place context. "Yesterday I had coffee with Sarah."
- **Semantic**: Facts without temporal context. "Paris is the capital of France."
- **Procedural**: Skills and how-to knowledge. "How to ride a bicycle."

Each type decays differently. Skills persist longer than episodic details.

## Our Architecture

We implemented these principles using Postgres + pgvector. Here's the system:

### Storage Schema

```typescript
interface Memory {
  id: string;
  userId: string;
  content: string;
  embedding: number[];  // Vector for semantic search
  memoryType: 'episodic' | 'semantic' | 'procedural';
  
  // Cognitive fields
  importance: number;    // 0.0-1.0
  stability: number;     // 0.0-1.0, grows with retrievals
  accessCount: number;   // How many times accessed
  lastAccessed: number;  // Timestamp
  retention: number;     // Cached decay score
  
  createdAt: number;
  updatedAt: number;
}
```

### Decay Formula

This is the heart of the system. Retention decays exponentially based on time and stability:

```typescript
function calculateRetention(
  stability: number,
  importance: number,
  lastAccessed: number,
  memoryType: MemoryType
): number {
  const daysSinceAccess = (Date.now() - lastAccessed) / (1000 * 60 * 60 * 24);

  // Importance boosts decay resistance (3x max)
  const importanceBoost = 1 + (importance * 2);

  // Base decay varies by type
  const baseDecay = {
    episodic: 30,          // 30 days
    semantic: 90,          // 90 days
    procedural: Infinity   // Never decays
  }[memoryType];

  // Non-decaying memories always retain fully
  if (!Number.isFinite(baseDecay)) {
    return 1;
  }

  // Avoid zero/NaN decay constants by clamping stability
  const epsilon = 1e-6;
  const safeStability = Math.max(stability, epsilon);

  // Combined decay constant
  const decayConstant = Math.max(
    safeStability * importanceBoost * baseDecay,
    epsilon
  );
  // Exponential decay (Ebbinghaus curve)
  return Math.exp(-daysSinceAccess / decayConstant);
}
```

**Example decay:**
- Fresh memory (stability 0.3, importance 0.5): 50% after ~9 days
- Reinforced memory (stability 0.8, importance 0.9): 50% after ~67 days

### Retrieval Strengthening

Every time we retrieve a memory, we update its stability:

```typescript
function updateStability(
  currentStability: number,
  daysSinceLastAccess: number
): number {
  // Longer gaps = bigger boost (spaced repetition)
  const spacingBonus = Math.min(2.0, daysSinceLastAccess / 7);
  
  // Increase stability by 10% × spacing bonus
  const newStability = currentStability + (0.1 * spacingBonus);
  
  // Cap at 1.0
  return Math.min(1.0, newStability);
}
```

This means:
- Accessing a memory after 1 day: +0.014 stability
- Accessing after 7 days: +0.1 stability
- Accessing after 14 days: +0.2 stability (max bonus)

Spaced retrievals make memories stronger faster.

### Retrieval Scoring

When searching for relevant memories, we combine semantic similarity with retention:

```typescript
async function retrieve(query: string, limit: number): Promise<Memory[]> {
  // 1. Get embedding for query
  const queryEmbedding = await getEmbedding(query);
  
  // 2. Vector search (cosine similarity)
  const candidates = await vectorSearch(queryEmbedding, limit * 3);
  
  // 3. Calculate final scores
  const scored = candidates.map(memory => {
    const relevanceScore = cosineSimilarity(queryEmbedding, memory.embedding);
    const retentionScore = calculateRetention(memory, new Date());
    
    return {
      ...memory,
      relevanceScore,
      retentionScore,
      finalScore: relevanceScore * retentionScore
    };
  });
  
  // 4. Sort by final score, return top results
  return scored
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);
}
```

**The key insight:** Two memories can have **identical semantic relevance** but rank completely differently based on recency, importance, and access patterns.

**Example:**

Memory A: "Beach day is Thursday, confirmed reservation"
- Semantic relevance: 0.92
- Retention: 0.97 (1 day old, high importance, accessed twice)
- **Final score: 0.89**

Memory B: "We should go to the beach on Thursday"
- Semantic relevance: 0.91 (nearly identical!)
- Retention: 0.45 (21 days old, low importance, never accessed)
- **Final score: 0.41**

**Result:** Memory A ranks 2.2x higher despite virtually the same semantic match. The difference? Recency, importance, and retrieval strengthening.

This is what standard RAG misses: **relevance alone can't distinguish a confirmed plan from a passing thought.** Human recall doesn't work that way. Neither should AI memory.

### Associative Linking

Memories retrieved together get linked:

```typescript
interface MemoryLink {
  sourceId: string;
  targetId: string;
  strength: number;  // 0.0-1.0
}

// When retrieving memories in a session
async function retrieveWithAssociations(
  query: string,
  limit: number
): Promise<Memory[]> {
  // Get primary memories
  const primary = await retrieve(query, limit);
  
  // For each primary memory, get associated memories
  const associations = await getLinkedMemories(
    primary.map(m => m.id),
    minStrength: 0.3
  );
  
  // Return combined set
  return [...primary, ...associations];
}

// After retrieval, strengthen links
async function strengthenLinks(memoryIds: string[]) {
  for (const sourceId of memoryIds) {
    for (const targetId of memoryIds) {
      if (sourceId === targetId) continue;
      
      await strengthenLink(sourceId, targetId, increment: 0.1);
    }
  }
}
```

### Consolidation

Background job runs daily to maintain memory health:

```typescript
async function consolidate(userId: string): Promise<void> {
  // 1. Find fading memories (retention < 0.2)
  const fading = await getFadingMemories(userId);
  
  // 2. Group by topic similarity
  const groups = clusterBySimilarity(fading, { threshold: 0.85 });
  
  // 3. Compress clusters of 5+ memories
  for (const group of groups) {
    if (group.length >= 5) {
      const summary = await summarizeMemories(group);
      
      // Create compressed memory
      await createMemory({
        content: summary,
        importance: Math.max(...group.map(m => m.importance)),
        memoryType: 'semantic',  // Compressed memories become semantic
        metadata: {
          consolidated: true,
          sourceIds: group.map(m => m.id)
        }
      });
      
      // Mark originals as superseded
      await markSuperseded(group);
    }
  }
  
  // 4. Soft delete memories with very low retention (<0.05 for 30+ days)
  await deleteStaleMemories(userId);
}
```

## Implementation

The full system is open source: [github.com/bhekanik/cognitive-memory-skill](https://github.com/bhekanik/cognitive-memory-skill)

We're also publishing an npm package for easy integration:

```bash
npm install @blah-chat/cognitive-memory
```

Usage:

```typescript
import { CognitiveMemory, ConvexAdapter } from '@blah-chat/cognitive-memory';

const memory = new CognitiveMemory({
  adapter: new ConvexAdapter(convexClient),
  embeddingProvider: openai.embeddings,
  userId: 'user-123'
});

// Store memory
await memory.store({
  content: "User prefers dark mode and hates light backgrounds",
  memoryType: 'semantic',
  importance: 0.7
});

// Retrieve with decay weighting
const relevant = await memory.retrieve({
  query: "What are the user's UI preferences?",
  limit: 5
});

// Run consolidation (background job)
await memory.consolidate();
```

## Why This Matters

**Better Recall**: Important memories persist. Trivial details fade. No manual pruning needed.

**Natural Conversations**: Context builds organically over time. The AI remembers what matters when it matters.

**Automatic Cleanup**: No database bloat. Old memories compress or fade naturally.

**Emergent Associations**: Related memories surface together without explicit tagging.

**Mirrors Human Experience**: The system behaves how *you* remember, making interactions feel more natural.

## Comparison to Prior Work

We're not the first to think about AI memory this way. The [Stanford Generative Agents paper](https://arxiv.org/abs/2304.03442) (Park et al., 2023) pioneered many concepts:

- Memory streams with importance scoring
- Reflection and summarization
- Retrieval based on recency + relevance

Our contribution builds on their foundation:

- **Explicit Ebbinghaus decay curves** (they used recency scoring)
- **Retrieval strengthening** via spaced repetition mechanics
- **Associative memory graph** with link strengthening
- **Production-ready implementation** for real apps

Other systems:
- **MemGPT**: Manages context windows (different problem)
- **ChatGPT Memory**: Static fact lists (no decay)
- **RAG systems**: Dump everything (no cognitive model)

### Neuroscience Foundation

Our approach is grounded in cognitive science research:

- **Ebbinghaus, H. (1885).** *Memory: A Contribution to Experimental Psychology.* The original research on forgetting curves.

- **Popov, V., Marevic, I., Rummel, J., & Reder, L. M. (2019).** *"Forgetting Is a Feature, Not a Bug: Intentionally Forgetting Some Things Helps Us Remember Others by Freeing Up Working Memory Resources."* Psychological Science. Shows that forgetting frees cognitive resources for new information.

- **Richards, B. A., & Frankland, P. W. (2017).** *"The Persistence and Transience of Memory."* Neuron. Argues that memory's goal is intelligent decision-making, not perfect recall.

The neuroscience consensus: **forgetting helps the brain adapt to changing environments and prioritize relevant information.** Our system implements these principles in code.

## What's Next

We're implementing this in [blah.chat](https://blah.chat) as the first chat app with genuine cognitive memory.

The SDK will support:
- Multiple database adapters (Postgres, MongoDB, Convex)
- Pluggable embedding providers
- Custom decay curves
- Hosted SaaS option for easy deployment

We're also considering a research paper to formalize the approach and share evaluation results.

## Try It

**Use blah.chat**: [blah.chat](https://blah.chat) (cognitive memory rolling out soon)

**Use the SDK**: `npm install @blah-chat/cognitive-memory` (launching this month)

**Read the code**: [github.com/bhekanik/cognitive-memory-skill](https://github.com/bhekanik/cognitive-memory-skill)

**Contribute**: Issues and PRs welcome!

---

Building AI that remembers like humans means building AI that forgets like humans. The innovation isn't in perfect recall — it's in knowing what to keep and what to let go.

That's cognitive memory.
