import { describe, expect, it, vi } from "vitest"
import { createViewsHandlers, isValidPublishedPostSlug, type ViewsApiDependencies } from "../../src/utils/viewsApi"

const publishedPostIds = new Set(["published-post", "nested/published-post"])

function dependencies(overrides: Partial<ViewsApiDependencies> = {}) {
  return {
    rateLimiter: {
      maxRequestsLimit: 10,
      checkLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetTime: Date.UTC(2026, 9, 26, 12, 0, 0) }),
    },
    loadPublishedPostIds: vi.fn().mockResolvedValue(publishedPostIds),
    getCount: vi.fn().mockResolvedValue(undefined),
    incrementCount: vi.fn().mockResolvedValue(1),
    ...overrides,
  }
}

function request(slug: string | null) {
  const url = new URL("https://example.test/api/views")
  if (slug !== null) url.searchParams.set("slug", slug)
  return { url, clientAddress: "127.0.0.1" }
}

describe("view API contract", () => {
  it("returns a defined zero for a published post with no count row", async () => {
    const services = dependencies()
    const response = await createViewsHandlers(services).GET(request("published-post"))

    expect(response.status).toBe(200)
    expect(response.headers.get("Cache-Control")).toBe("no-store")
    await expect(response.json()).resolves.toEqual({ slug: "published-post", count: 0 })
    expect(services.getCount).toHaveBeenCalledWith("published-post")
  })

  it("preserves the query-string POST contract and performs one atomic increment operation", async () => {
    const services = dependencies({ incrementCount: vi.fn().mockResolvedValue(12) })
    const response = await createViewsHandlers(services).POST(request("nested/published-post"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ slug: "nested/published-post", count: 12 })
    expect(services.incrementCount).toHaveBeenCalledOnce()
    expect(services.incrementCount).toHaveBeenCalledWith("nested/published-post")
    expect(services.getCount).not.toHaveBeenCalled()
  })

  it("rejects invalid identities before loading published metadata, rate policy, or database work", async () => {
    const services = dependencies()
    const handlers = createViewsHandlers(services)

    for (const slug of [null, "", " ", "post with spaces", "../published-post", "x".repeat(161)]) {
      const response = await handlers.POST(request(slug))
      expect(response.status).toBe(400)
      await expect(response.json()).resolves.toEqual({ error: "Invalid post slug.", code: "invalid_slug" })
    }

    expect(services.loadPublishedPostIds).not.toHaveBeenCalled()
    expect(services.rateLimiter.checkLimit).not.toHaveBeenCalled()
    expect(services.getCount).not.toHaveBeenCalled()
    expect(services.incrementCount).not.toHaveBeenCalled()
  })

  it("rejects unknown and draft-like IDs without rate or database work", async () => {
    const services = dependencies()
    const handlers = createViewsHandlers(services)

    for (const slug of ["draft-post", "unknown-post"]) {
      const response = await handlers.POST(request(slug))
      expect(response.status).toBe(404)
      await expect(response.json()).resolves.toEqual({ error: "Post not found.", code: "post_not_found" })
    }

    expect(services.loadPublishedPostIds).toHaveBeenCalledTimes(2)
    expect(services.rateLimiter.checkLimit).not.toHaveBeenCalled()
    expect(services.getCount).not.toHaveBeenCalled()
    expect(services.incrementCount).not.toHaveBeenCalled()
  })

  it("returns a truthful unavailable response and static diagnostic when the database fails", async () => {
    const privateError = new Error("database echoed a private slug", { cause: { slug: "private-slug" } })
    const onUnavailable = vi.fn()
    const services = dependencies({
      getCount: vi.fn().mockRejectedValue(privateError),
      onUnavailable,
    })

    const response = await createViewsHandlers(services).GET(request("published-post"))
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: "View counts are temporarily unavailable.", code: "views_unavailable" })
    expect(onUnavailable).toHaveBeenCalledWith({ method: "GET", category: "database_unavailable", status: "503" })
    expect(JSON.stringify(onUnavailable.mock.calls)).not.toContain("private-slug")
    expect(JSON.stringify(onUnavailable.mock.calls)).not.toContain("cause")
  })

  it("does no rate or database work when published identity loading is unavailable", async () => {
    const services = dependencies({ loadPublishedPostIds: vi.fn().mockRejectedValue(new Error("content unavailable")) })
    const response = await createViewsHandlers(services).GET(request("published-post"))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ error: "View counts are temporarily unavailable.", code: "views_unavailable" })
    expect(services.rateLimiter.checkLimit).not.toHaveBeenCalled()
    expect(services.getCount).not.toHaveBeenCalled()
  })
})

describe("published post slug validation", () => {
  it("accepts bounded route-shaped strings only", () => {
    expect(isValidPublishedPostSlug("nested/published-post")).toBe(true)
    expect(isValidPublishedPostSlug("published-post")).toBe(true)

    for (const candidate of [null, "__proto__", "prototype", "post//nested", ".post", "post."]) {
      expect(isValidPublishedPostSlug(candidate)).toBe(false)
    }
  })
})
