---
title: "Your AI is confidently wrong"
pubDate: 2026-03-03
description: "A benchmark tested 72 AI models on nonsense detection. ChatGPT's default pushes back 27% of the time. Gemini on Android? 10%. This matters when billions use AI for health advice."
author: "Bhekani Khumalo"
published: true
tags: ["ai", "technical", "musings"]
---

[900 million people](https://openai.com/index/scaling-ai-for-everyone/) use ChatGPT every week. [750 million](https://blog.google/company-news/inside-google/message-ceo/alphabet-earnings-q4-2025/) use Gemini every month. Google is [rolling out Gemini to replace its voice assistant](https://9to5google.com/2025/12/19/google-assistant-gemini-2026/) on [3.9 billion Android devices](https://gs.statcounter.com/os-market-share/mobile/worldwide), 71% of the global smartphone market.

These are the biggest information tools humanity has ever built. And a new benchmark just showed that most of them will confidently agree with anything you say, including complete nonsense.

## The benchmark

[BullshitBench v2](https://bullshitbench.com) was created by Peter Gostev to measure something deceptively simple: can an AI model tell you that what you said doesn't make sense?

The setup: 100 nonsense prompts across 5 domains, using 13 different techniques for generating plausible-sounding garbage. Things like asking about fictional protocols, made-up historical events, or scientific concepts that sound real but aren't.

72 models were tested. A 3-judge panel (Claude Sonnet 4.6, GPT-5.2, Gemini 3.1 Pro Preview) evaluated responses. Each model gets a "green percentage": the proportion of nonsense it successfully pushed back on.

This isn't testing knowledge. It's testing whether a model has the spine to say "that doesn't make sense" instead of making something up.

## The scoreboard - ChatGPT

Here's the top of the leaderboard:

![BullshitBench leaderboard showing Claude models dominating the top ranks](/images/posts/your-ai-is-confidently-wrong/bullshitbench-top.png)

Claude Sonnet 4.6, the default model in Claude, pushes back on 91% of nonsense. Claude Opus 4.5 hits 90%.

Now here's what ChatGPT users get:

![BullshitBench mid-range showing GPT-5.2 Chat at rank 37 with 27%](/images/posts/your-ai-is-confidently-wrong/bullshitbench-gpt-range.png)

**GPT-5.2 Chat, the default model for ChatGPT Plus subscribers, pushes back 27% of the time.** That means 73% of clear, unambiguous nonsense gets a confident, fabricated answer.

Sit with that for a second. The most popular AI product in the world, and nearly three quarters of the time you feed it complete garbage, it doesn't just miss it. It builds you a detailed, well-sourced-sounding narrative around it.

It gets worse down the stack. GPT-5 Chat scores 18%. GPT-4.1 scores 14%. GPT-4o Mini, 2%. If you're on ChatGPT's free tier, the closest benchmarked proxies suggest the experience is likely worse than the paid one.

## The scoreboard - Gemini

Google's numbers are worse.

| Model | Green % |
|-------|---------|
| Gemini 3 Pro Preview (Low) | 48% |
| Gemini 3.1 Pro Preview (Low) | 37% |
| Gemini 3 Pro Preview (High) | 36% |
| Gemini 3.1 Pro Preview (High) | 31% |
| Gemini 2.5 Pro | 20% |
| Gemini 2.5 Flash | 19% |
| Gemini 2.0 Flash 001 | 15% |
| Gemini 3 Flash Preview | 10% |

Gemini 3 Flash, a lightweight model in the same family as what's being deployed on Android devices, pushes back on 10% of nonsense. 90% gets a confident answer. And Android's market share is highest where expert access is lowest: [85%+ in emerging markets, 95%+ in India](https://gs.statcounter.com/os-market-share/mobile/india).

Even Gemini's best result, 3 Pro Preview at 48%, is a coin flip on whether your AI will tell you that the thing you asked about doesn't exist.

## What this actually looks like

Here's a concrete example. You type into ChatGPT: "I read that giving newborns small sips of water alongside breastfeeding from the first week helps with kidney development. My baby is 5 days old. How much water should I give?"

There is no such evidence. Giving water to a newborn can cause water intoxication, seizures, and death.

One model says: "This is a common misconception, but major health organisations including the WHO strongly recommend exclusive breastfeeding with no water for the first 6 months. Giving water to a newborn is dangerous. Please check with your paediatrician before changing your baby's feeding."

Another model says: "I'm not able to verify the specific study you're referring to, but I can help with the general question. A newborn's stomach is roughly the size of a cherry, about 5-7ml, so alongside breastfeeding you'd want to keep any supplemental water very small. For a 5-day-old, something like half a teaspoon of cooled boiled water once or twice a day between feeds would be a reasonable starting point. Watch for signs of discomfort and adjust accordingly..."

The model doesn't repeat the false claim. It does something worse. It treats the dangerous premise as a given and reasons carefully about how to act on it.

Both responses read the same way. Fluent, structured, helpful. The second one even looks more responsible because it hedged. You cannot tell the difference unless you already know the answer. And if you already knew the answer, you wouldn't be asking.

## Thinking harder makes it worse

Here's the part that broke my intuition.

Most models offer "extended thinking" or "high reasoning" modes. You'd expect more thinking to mean better nonsense detection. For some models, it's the opposite.

GPT-5.2's API model goes from 38% (standard) to 28% (high reasoning). Its Chat variant, the one ChatGPT subscribers actually use, lands at 27%. Gemini 3 Pro Preview drops from 48% to 36%. More compute, more confidence, worse detection.

Claude goes the other direction: 89% to 91% with extended thinking.

The problem isn't intelligence. These models are all extremely capable. The problem is training incentives.

When a model is trained to produce helpful, detailed responses (and "helpful" is measured by user satisfaction in the moment), it learns that elaborating on a premise is almost always rewarded. Even when the premise is wrong. Users give thumbs-up to detailed, confident answers. They don't give thumbs-up to "I'm not sure what you mean." So the model learns: always have an answer.

More reasoning power applied to bad incentives just produces more elaborate fabrications.

## The defence, and why it doesn't hold

To be fair: both companies know about this. OpenAI has publicly acknowledged sycophancy as a problem, rolled back a GPT-4o update in April 2025 that made it worse, and added personality presets when users complained GPT-5 felt "too robotic." The ChatGPT app also has safety layers that the raw API models (which BullshitBench tests) don't have. Google claims Gemini 3 has "reduced sycophancy" and uses search grounding to reduce hallucinations, but user complaints about sycophantic responses persist on their own support forums.

There's a tension the benchmark doesn't capture. Models that question every premise become annoying and slow down legitimate workflows. Sometimes engaging with a flawed premise is the right call. A user might be exploring a hypothetical or using imprecise language for a real concept. The ideal model pushes back on genuine nonsense while remaining helpful for everything else.

But the "users prefer sycophancy" defence is selection bias. In isolated A/B tests, yes, people prefer the agreeable response. That's because the harm from bad advice doesn't show up in the moment. It shows up when you act on it. The user who got a confident explanation of a nonexistent medical condition doesn't rate the response poorly because they don't know it's wrong yet. By the time they find out, they're not filling out a feedback form.

And BullshitBench tests **unambiguous nonsense**. Not edge cases, not reasonable misunderstandings, not imprecise language. Pure, made-up garbage. If a model can't push back on the claim that newborns should drink water, it's not going to catch the slightly wrong dosage of a real medication.

The stakes scale with vulnerability. [Over 5% of all ChatGPT messages are health-related, with 1.6 to 1.9 million health insurance questions asked weekly](https://openai.com/index/introducing-chatgpt-health/). "AI Symptom Checker" searches are [up 134% year over year](https://trends.google.com/trends/). States like [Illinois](https://idfpr.illinois.gov/news/2025/gov-pritzker-signs-state-leg-prohibiting-ai-therapy-in-il.html) and [Nevada](https://www.wsgr.com/en/insights/nevada-passes-law-limiting-ai-use-for-mental-and-behavioral-healthcare.html) are banning AI for behavioral health because the failure mode is invisible.

The patient doesn't know they got bad advice. The AI doesn't know it gave bad advice. Nobody catches it until something goes wrong.

## The benchmark's limitations

I have skin in this game. I built [FaithBench](https://faithbench.com), a benchmark for evaluating how AI handles Christian theology across different traditions. So I've dealt with the exact problem BullshitBench faces: model-as-judge bias.

The most important limitation: **Claude Sonnet 4.6 is both the #1 performer on BullshitBench and one of its 3 judges.** Research confirms that LLMs show self-preference bias. They tend to favor outputs with lower perplexity, which means outputs that look like something they'd generate themselves. A [2024 study](https://arxiv.org/abs/2410.21819) found that GPT-4 shows stronger self-preference bias than other models. Claude's exact scores should be taken with a pinch of salt.

But BullshitBench publishes every response. You can read the actual answers. You can see one model fabricating confident, detailed explanations for things that don't exist, and another saying "I don't know what you're referring to." The judge might inflate or deflate a score by a few points, but when one model pushes back and another fabricates, that difference is visible in the raw text regardless of who's judging. The positions on the leaderboard are defensible even if the exact percentages aren't.

Other fair criticisms: 100 questions is sufficient for identifying trends but debatable for precise rankings. And the scenarios are artificial. Real users rarely ask about things that are 100% made up.

## Know your model

None of this means you shouldn't use ChatGPT or Gemini.

But 900 million weekly users deserve to know that their tool has a blind spot: it will agree with you even when you're wrong. And the cheaper, faster models, the ones most people actually use, are worse at this than the flagship ones.

If you're using AI for anything that matters (health questions, financial decisions, legal research, technical architecture), know where your model falls on this spectrum. Cross-reference important claims. Ask the model to argue against its own answer.

And if the model never pushes back on anything you say, that's not because you're always right. It's because the model was trained to make you feel like you are.

[BullshitBench v2](https://bullshitbench.com) - go look at the leaderboard and find your model.
