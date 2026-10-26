import { describe, expect, it, vi } from "vitest"
import { createSearchHandler, type SemanticSearchDiagnostic } from "../../src/utils/searchApi"
import type { SearchProjection } from "../../src/utils/searchProjection"

const projection: SearchProjection = {
  revision: "search-test",
  index: [
    { id: "book-1", type: "book", title: "Warbreaker", slug: "/books/warbreaker-warbreaker-1/", description: "by Brandon Sanderson", searchText: "warbreaker brandon sanderson" },
    { id: "project-mxr", type: "project", title: "mxr", slug: "https://mxr.sh", description: "Mail", searchText: "mxr mail" },
  ],
}

const rateLimiter = (allowed = true) => ({
  maxRequestsLimit: 30,
  checkLimit: vi.fn().mockResolvedValue({ allowed, remaining: allowed ? 29 : 0, resetTime: Date.now() + 60_000 }),
})

const request = (query: string) => ({ url: new URL(`https://example.test/api/search?q=${encodeURIComponent(query)}`), clientAddress: "127.0.0.1" })

describe("search API contract", () => {
  it("returns a local keyword result with the existing fields plus mode and revision", async () => {
    const handler = createSearchHandler({ rateLimiter: rateLimiter(), loadProjection: async () => projection })
    const response = await handler(request("Warbreaker"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      results: [{ id: "book-1", type: "book", title: "Warbreaker", slug: "/books/warbreaker-warbreaker-1/", description: "by Brandon Sanderson", score: 1 }],
      total: 1,
      mode: "keyword",
      revision: "search-test",
    })
  })

  it("returns a true empty result as a successful search", async () => {
    const handler = createSearchHandler({ rateLimiter: rateLimiter(), loadProjection: async () => projection })
    const response = await handler(request("nothing-here"))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ results: [], total: 0, mode: "keyword" })
  })

  it("rejects invalid bounds and punctuation-only input before the rate limiter or provider work", async () => {
    const limiter = rateLimiter()
    const loader = vi.fn().mockResolvedValue(projection)
    const semanticSearch = vi.fn()
    const handler = createSearchHandler({ rateLimiter: limiter, loadProjection: loader, semanticSearch })

    for (const query of ["", "x", "—?!", "x".repeat(201)]) {
      const response = await handler(request(query))
      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toMatchObject({ code: "invalid_query" })
    }
    expect(limiter.checkLimit).not.toHaveBeenCalled()
    expect(loader).not.toHaveBeenCalled()
    expect(semanticSearch).not.toHaveBeenCalled()
  })

  it("distinguishes rate limiting from search infrastructure failure", async () => {
    const limited = createSearchHandler({ rateLimiter: rateLimiter(false), loadProjection: async () => projection })
    const unavailable = createSearchHandler({ rateLimiter: rateLimiter(), loadProjection: async () => { throw new Error("missing snapshot") } })

    const limitedResponse = await limited(request("Warbreaker"))
    expect(limitedResponse.status).toBe(429)
    expect(limitedResponse.headers.get("Retry-After")).toBeTruthy()
    await expect(limitedResponse.json()).resolves.toMatchObject({ code: "rate_limited" })

    const unavailableResponse = await unavailable(request("Warbreaker"))
    expect(unavailableResponse.status).toBe(503)
    await expect(unavailableResponse.json()).resolves.toMatchObject({ code: "search_unavailable" })
  })

  it("falls back to keyword results without retaining provider errors in diagnostics", async () => {
    const privateQuery = "private-query-marker"
    const providerError = Object.assign(
      new Error(`provider echoed ${privateQuery}`, { cause: { query: privateQuery } }),
      { body: { query: privateQuery } },
    )
    let diagnostic: SemanticSearchDiagnostic | undefined
    const semanticError = vi.fn((candidate: SemanticSearchDiagnostic) => { diagnostic = candidate })
    const handler = createSearchHandler({
      rateLimiter: rateLimiter(),
      loadProjection: async () => projection,
      semanticSearch: async () => { throw providerError },
      onSemanticError: semanticError,
    })
    const response = await handler(request(privateQuery))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ mode: "keyword", results: [] })
    expect(semanticError).toHaveBeenCalledOnce()
    expect(semanticError).toHaveBeenCalledWith({
      message: "Semantic search failed",
      category: "provider_error",
      status: "fallback",
    })
    if (!diagnostic) throw new Error("Semantic fallback did not emit a diagnostic")
    expect(Object.getOwnPropertyNames(diagnostic)).toEqual(["message", "category", "status"])
    expect(Object.getOwnPropertySymbols(diagnostic)).toEqual([])
    expect(JSON.stringify(diagnostic)).not.toContain(privateQuery)
    expect(JSON.stringify(diagnostic)).not.toContain("body")
    expect(JSON.stringify(diagnostic)).not.toContain("cause")
  })

  it("allows only current local identities into hybrid results", async () => {
    const handler = createSearchHandler({
      rateLimiter: rateLimiter(),
      loadProjection: async () => projection,
      semanticSearch: async () => [
        { id: "book-1", type: "book", title: "Old title", slug: "https://invalid.test", score: 1 },
        { id: "book-stale", type: "book", title: "Deleted", slug: "/books/deleted", score: 0.9 },
      ],
    })
    const response = await handler(request("Warbreaker"))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      mode: "hybrid",
      results: [{ id: "book-1", title: "Warbreaker", slug: "/books/warbreaker-warbreaker-1/" }],
    })
  })
})
