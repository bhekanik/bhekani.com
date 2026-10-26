import {
  canonicalizeSearchResults,
  fuseResults,
  hasMeaningfulSearchText,
  keywordSearch,
  type SearchResult,
} from "./search"
import type { SearchProjection } from "./searchProjection"

export interface SearchRateLimiter {
  maxRequestsLimit: number
  checkLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }>
}

export interface SearchRequest {
  url: URL
  clientAddress?: string
}

export interface SearchApiDependencies {
  rateLimiter: SearchRateLimiter
  loadProjection: () => Promise<SearchProjection>
  semanticSearch?: (query: string) => Promise<SearchResult[]>
  onSemanticError?: (diagnostic: SemanticSearchDiagnostic) => void
}

export type SemanticSearchDiagnostic = {
  message: "Semantic search failed"
  category: "provider_error"
  status: "fallback"
}

type SearchSuccessResponse = {
  results: SearchResult[]
  total: number
  mode: "keyword" | "hybrid"
  revision: string
}

type SearchErrorResponse = {
  error: string
  code: "invalid_query" | "rate_limited" | "search_unavailable"
}

const json = (body: SearchSuccessResponse | SearchErrorResponse, status: number, headers: HeadersInit = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", ...headers },
})

const codePoints = (value: string) => Array.from(value).length

export function createSearchHandler(dependencies: SearchApiDependencies) {
  return async ({ url, clientAddress }: SearchRequest): Promise<Response> => {
    const query = url.searchParams.get("q")?.trim() ?? ""
    if (codePoints(query) > 200 || !hasMeaningfulSearchText(query)) {
      return json({
        error: "Query must be 2 to 200 characters with at least 2 letters or numbers.",
        code: "invalid_query",
      }, 400)
    }

    const ip = clientAddress ?? `unknown-${crypto.randomUUID()}`
    let rateLimitResult
    try {
      rateLimitResult = await dependencies.rateLimiter.checkLimit(ip)
    } catch {
      rateLimitResult = {
        allowed: true,
        remaining: dependencies.rateLimiter.maxRequestsLimit,
        resetTime: Date.now() + 60_000,
      }
    }

    if (!rateLimitResult.allowed) {
      return json({
        error: "Too many requests. Please try again later.",
        code: "rate_limited",
      }, 429, {
        "X-RateLimit-Limit": dependencies.rateLimiter.maxRequestsLimit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
        "Retry-After": Math.max(1, Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)).toString(),
      })
    }

    let projection: SearchProjection
    try {
      projection = await dependencies.loadProjection()
    } catch {
      return json({
        error: "Search is temporarily unavailable. Please try again.",
        code: "search_unavailable",
      }, 503, rateLimitHeaders(dependencies.rateLimiter, rateLimitResult))
    }

    const keywordResults = keywordSearch(query, projection.index)
    let results = keywordResults
    let mode: "keyword" | "hybrid" = "keyword"

    if (dependencies.semanticSearch) {
      try {
        const vectorResults = canonicalizeSearchResults(await dependencies.semanticSearch(query), projection.index)
        if (vectorResults.length > 0) {
          results = fuseResults(vectorResults, keywordResults)
          mode = "hybrid"
        }
      } catch {
        dependencies.onSemanticError?.({
          message: "Semantic search failed",
          category: "provider_error",
          status: "fallback",
        })
      }
    }

    const canonicalResults = canonicalizeSearchResults(results, projection.index)
    return json({
      results: canonicalResults.slice(0, 10),
      total: canonicalResults.length,
      mode,
      revision: projection.revision,
    }, 200, rateLimitHeaders(dependencies.rateLimiter, rateLimitResult))
  }
}

function rateLimitHeaders(
  rateLimiter: SearchRateLimiter,
  rateLimitResult: { remaining: number; resetTime: number },
): HeadersInit {
  return {
    "X-RateLimit-Limit": rateLimiter.maxRequestsLimit.toString(),
    "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
    "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
  }
}
