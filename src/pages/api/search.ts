import type { APIRoute } from "astro"
import { Index } from "@upstash/vector"
import OpenAI from "openai"
import * as Sentry from "@sentry/astro"
import { RateLimiter } from "../../utils/rateLimiter"

export const prerender = false

interface SearchIndexItem {
  id: string
  type: "post" | "book" | "micro" | "project"
  title: string
  slug: string
  description?: string
  searchText: string
}

interface SearchResult {
  id: string
  type: "post" | "book" | "micro" | "project"
  title: string
  slug: string
  description?: string
  score: number
}

// Search-specific rate limiter: 30 requests per minute
const searchRateLimiter = new RateLimiter(30, 60000)

// Cache the search index in memory
let searchIndex: SearchIndexItem[] | null = null

async function loadSearchIndex(): Promise<SearchIndexItem[]> {
  if (searchIndex) return searchIndex

  try {
    const response = await fetch(new URL("/search-index.json", import.meta.env.SITE || "http://localhost:4321"))
    if (response.ok) {
      searchIndex = await response.json()
      return searchIndex || []
    }
  } catch {
    // Fall through to empty array
  }
  return []
}

function keywordSearch(query: string, index: SearchIndexItem[]): SearchResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []

  const results: SearchResult[] = []

  for (const item of index) {
    let matchCount = 0
    for (const term of terms) {
      if (item.searchText.includes(term)) {
        matchCount++
      }
    }
    if (matchCount > 0) {
      results.push({
        id: item.id,
        type: item.type,
        title: item.title,
        slug: item.slug,
        description: item.description,
        score: matchCount / terms.length,
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

// Reciprocal Rank Fusion
function fuseResults(vectorResults: SearchResult[], keywordResults: SearchResult[], k = 60): SearchResult[] {
  const scores = new Map<string, { score: number; item: SearchResult }>()

  // Add vector search scores
  vectorResults.forEach((item, rank) => {
    const rrfScore = 1 / (k + rank + 1)
    scores.set(item.id, { score: rrfScore, item })
  })

  // Add keyword search scores
  keywordResults.forEach((item, rank) => {
    const rrfScore = 1 / (k + rank + 1)
    const existing = scores.get(item.id)
    if (existing) {
      existing.score += rrfScore
    } else {
      scores.set(item.id, { score: rrfScore, item })
    }
  })

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ ...item, score }))
}

export const GET: APIRoute = async ({ url, clientAddress }) => {
  const ip = clientAddress ?? `unknown-${crypto.randomUUID()}`

  let rateLimitResult
  try {
    rateLimitResult = await searchRateLimiter.checkLimit(ip)
  } catch {
    rateLimitResult = {
      allowed: true,
      remaining: searchRateLimiter.maxRequestsLimit,
      resetTime: Date.now() + 60000,
    }
  }

  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": searchRateLimiter.maxRequestsLimit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          "Retry-After": Math.max(1, Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)).toString(),
        },
      }
    )
  }

  const query = url.searchParams.get("q")?.trim()

  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ error: "Query must be at least 2 characters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    // Load keyword search index
    const index = await loadSearchIndex()
    const keywordResults = keywordSearch(query, index)

    // Try vector search if configured
    let vectorResults: SearchResult[] = []
    const upstashUrl = import.meta.env.UPSTASH_VECTOR_REST_URL
    const upstashToken = import.meta.env.UPSTASH_VECTOR_REST_TOKEN
    const openaiKey = import.meta.env.OPENAI_API_KEY

    if (upstashUrl && upstashToken && openaiKey) {
      try {
        const vectorIndex = new Index({
          url: upstashUrl,
          token: upstashToken,
        })

        const openai = new OpenAI({ apiKey: openaiKey })

        // Generate query embedding
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: query,
        })
        const queryEmbedding = embeddingResponse.data[0]?.embedding

        if (queryEmbedding) {
          // Vector search
          const vectorHits = await vectorIndex.query({
            vector: queryEmbedding,
            topK: 20,
            includeMetadata: true,
          })

          vectorResults = vectorHits.map((hit, idx) => ({
            id: hit.id as string,
            type: (hit.metadata?.type as SearchResult["type"]) || "post",
            title: (hit.metadata?.title as string) || hit.id as string,
            slug: (hit.metadata?.slug as string) || "",
            description: (hit.metadata?.description as string) || undefined,
            score: hit.score || 1 - idx * 0.01,
          }))
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { api: "search", component: "vector" },
          extra: { query },
        })
        // Fall through to keyword-only results
      }
    }

    // Fuse results using RRF
    const results = vectorResults.length > 0 ? fuseResults(vectorResults, keywordResults) : keywordResults

    // Return top 10
    return new Response(
      JSON.stringify({
        results: results.slice(0, 10),
        total: results.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": searchRateLimiter.maxRequestsLimit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
        },
      }
    )
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: "search", method: "GET" },
      extra: { query },
    })

    return new Response(JSON.stringify({ error: "Search failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
