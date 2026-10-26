export interface ViewsRateLimiter {
  maxRequestsLimit: number
  checkLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }>
}

export interface ViewsRequest {
  url: URL
  clientAddress?: string
}

export type ViewsDiagnostic = {
  method: "GET" | "POST"
  category: "published_identity_unavailable" | "database_unavailable"
  status: "503"
}

export interface ViewsApiDependencies {
  rateLimiter: ViewsRateLimiter
  loadPublishedPostIds: () => Promise<ReadonlySet<string>>
  getCount: (slug: string) => Promise<number | undefined>
  incrementCount: (slug: string) => Promise<number>
  onUnavailable?: (diagnostic: ViewsDiagnostic) => void
}

const MAX_SLUG_LENGTH = 160
const POST_SLUG = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?(?:\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?)*$/
const PROTOTYPE_KEYS = new Set(["__proto__", "constructor", "prototype"])

type RateLimitResult = Awaited<ReturnType<ViewsRateLimiter["checkLimit"]>>

const json = <T extends object>(body: T, status: number, headers: HeadersInit = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    ...headers,
  },
})

const rateLimitHeaders = (rateLimiter: ViewsRateLimiter, result: RateLimitResult, remaining = result.remaining) => ({
  "X-RateLimit-Limit": rateLimiter.maxRequestsLimit.toString(),
  "X-RateLimit-Remaining": remaining.toString(),
  "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
})

export function isValidPublishedPostSlug(value: string | null): value is string {
  return value !== null && value.length <= MAX_SLUG_LENGTH && !PROTOTYPE_KEYS.has(value) && POST_SLUG.test(value)
}

export function createViewsHandlers(dependencies: ViewsApiDependencies) {
  async function request(method: "GET" | "POST", { url, clientAddress }: ViewsRequest): Promise<Response> {
    const slug = url.searchParams.get("slug")
    if (!isValidPublishedPostSlug(slug)) {
      return json({ error: "Invalid post slug.", code: "invalid_slug" }, 400)
    }

    let publishedPostIds: ReadonlySet<string>
    try {
      publishedPostIds = await dependencies.loadPublishedPostIds()
    } catch {
      dependencies.onUnavailable?.({ method, category: "published_identity_unavailable", status: "503" })
      return json({ error: "View counts are temporarily unavailable.", code: "views_unavailable" }, 503)
    }

    if (!publishedPostIds.has(slug)) {
      return json({ error: "Post not found.", code: "post_not_found" }, 404)
    }

    const ip = clientAddress ?? `unknown-${crypto.randomUUID()}`
    let limit: RateLimitResult
    try {
      limit = await dependencies.rateLimiter.checkLimit(ip)
    } catch {
      limit = {
        allowed: true,
        remaining: dependencies.rateLimiter.maxRequestsLimit,
        resetTime: Date.now() + 60_000,
      }
    }

    if (!limit.allowed) {
      return json({ error: "Too many requests. Please try again later.", code: "rate_limited" }, 429, {
        ...rateLimitHeaders(dependencies.rateLimiter, limit, 0),
        "Retry-After": Math.max(1, Math.ceil((limit.resetTime - Date.now()) / 1000)).toString(),
      })
    }

    try {
      const count = method === "POST"
        ? await dependencies.incrementCount(slug)
        : (await dependencies.getCount(slug)) ?? 0
      return json({ slug, count }, 200, rateLimitHeaders(dependencies.rateLimiter, limit))
    } catch {
      dependencies.onUnavailable?.({ method, category: "database_unavailable", status: "503" })
      return json({ error: "View counts are temporarily unavailable.", code: "views_unavailable" }, 503, rateLimitHeaders(dependencies.rateLimiter, limit))
    }
  }

  return {
    GET: (requestData: ViewsRequest) => request("GET", requestData),
    POST: (requestData: ViewsRequest) => request("POST", requestData),
  }
}
