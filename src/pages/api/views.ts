import type { APIRoute } from "astro"
import { db, eq, sql, Views } from "astro:db"
import { viewsRateLimiter } from "../../utils/rateLimiter"
import * as Sentry from "@sentry/astro"

export const prerender = false

type RateLimitResult = Awaited<ReturnType<typeof viewsRateLimiter.checkLimit>>

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  })

const rateLimitHeaders = (result: RateLimitResult, remaining = result.remaining) => ({
  "X-RateLimit-Limit": viewsRateLimiter.maxRequestsLimit.toString(),
  "X-RateLimit-Remaining": remaining.toString(),
  "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
})

/**
 * Runs the limiter for one client. Returns a 429 response when the client is
 * over the limit, otherwise the limiter result to echo back in headers.
 * A limiter failure (e.g. store unreachable) fails open so views keep working.
 */
async function checkRateLimit(ip: string): Promise<{ response: Response } | { result: RateLimitResult }> {
  let result: RateLimitResult
  try {
    result = await viewsRateLimiter.checkLimit(ip)
  } catch {
    result = {
      allowed: true,
      remaining: viewsRateLimiter.maxRequestsLimit,
      resetTime: Date.now() + 60000,
    }
  }

  if (result.allowed) return { result }

  return {
    response: json({ error: "Too many requests. Please try again later." }, 429, {
      ...rateLimitHeaders(result, 0),
      "Retry-After": Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000)).toString(),
    }),
  }
}

const clientIp = (clientAddress: string | undefined) => clientAddress ?? `unknown-${Math.random()}`

export const POST: APIRoute = async ({ url, clientAddress }) => {
  const limit = await checkRateLimit(clientIp(clientAddress))
  if ("response" in limit) return limit.response

  const slug = url.searchParams.get("slug")
  if (!slug) return json({ error: "Slug is required" }, 400)

  let item
  try {
    item = await db
      .insert(Views)
      .values({ slug, count: 1 })
      .onConflictDoUpdate({
        target: Views.slug,
        set: { count: sql`count + 1` },
      })
      .returning({ slug: Views.slug, count: Views.count })
      .then((res) => res[0])
  } catch (error) {
    Sentry.captureException(error, { tags: { api: "views", method: "POST" }, extra: { slug } })
    item = { slug, count: 1 }
  }

  return json(item, 200, rateLimitHeaders(limit.result))
}

export const GET: APIRoute = async ({ url, clientAddress }) => {
  const limit = await checkRateLimit(clientIp(clientAddress))
  if ("response" in limit) return limit.response

  const slug = url.searchParams.get("slug")
  if (!slug) return json({ error: "Slug is required" }, 400)

  let item
  try {
    item = await db
      .select({ count: Views.count })
      .from(Views)
      .where(eq(Views.slug, slug))
      .then((res) => res[0])
  } catch (error) {
    Sentry.captureException(error, { tags: { api: "views", method: "GET" }, extra: { slug } })
    item = { slug, count: 1 }
  }

  return json(item, 200, rateLimitHeaders(limit.result))
}
