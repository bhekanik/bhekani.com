import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import * as Sentry from "@sentry/astro"
import { Index } from "@upstash/vector"
import OpenAI from "openai"
import { createSearchHandler } from "../../utils/searchApi"
import { createSearchProjection, type SearchProjection } from "../../utils/searchProjection"
import type { SearchResult } from "../../utils/search"
import { RateLimiter } from "../../utils/rateLimiter"

export const prerender = false

// Search-specific rate limiter: 30 requests per minute.
const searchRateLimiter = new RateLimiter(30, 60_000)
let projection: Promise<SearchProjection> | undefined

function loadSearchProjection(): Promise<SearchProjection> {
  if (!projection) {
    projection = Promise.all([
      getCollection("posts"),
      getCollection("micro"),
      getCollection("projects"),
      getCollection("books"),
    ])
      .then(([posts, micro, projects, books]) => createSearchProjection({ posts, micro, projects, books }))
      .catch((error) => {
        projection = undefined
        throw error
      })
  }

  return projection
}

async function semanticSearch(query: string): Promise<SearchResult[]> {
  const upstashUrl = import.meta.env.UPSTASH_VECTOR_REST_URL
  const upstashToken = import.meta.env.UPSTASH_VECTOR_REST_TOKEN
  const openaiKey = import.meta.env.OPENAI_API_KEY
  if (!upstashUrl || !upstashToken || !openaiKey) return []

  const vectorIndex = new Index({ url: upstashUrl, token: upstashToken })
  const openai = new OpenAI({ apiKey: openaiKey })
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  })
  const queryEmbedding = embeddingResponse.data[0]?.embedding
  if (!queryEmbedding) return []

  const vectorHits = await vectorIndex.query({
    vector: queryEmbedding,
    topK: 20,
    includeMetadata: true,
  })

  // Provider metadata is intentionally ignored. Search results are rebuilt
  // from the local projection before they reach the response.
  return vectorHits.map((hit, index) => ({
    id: String(hit.id),
    type: "post",
    title: String(hit.id),
    slug: "",
    score: hit.score ?? 1 - index * 0.01,
  }))
}

const handler = createSearchHandler({
  rateLimiter: searchRateLimiter,
  loadProjection: loadSearchProjection,
  semanticSearch,
  onSemanticError(diagnostic) {
    Sentry.captureMessage(diagnostic.message, {
      level: "warning",
      tags: {
        api: "search",
        component: "vector",
        category: diagnostic.category,
        status: diagnostic.status,
      },
    })
  },
})

export const GET: APIRoute = ({ url, clientAddress }) => handler({ url, clientAddress })
