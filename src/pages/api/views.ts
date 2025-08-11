import type { APIRoute } from "astro"
import { db, eq, sql, Views } from "astro:db"
import { viewsRateLimiter } from "../../utils/rateLimiter"
import * as Sentry from "@sentry/astro"

export const prerender = false

export const POST: APIRoute = async ({ url, clientAddress }) => {
  const ip = clientAddress ?? `unknown-${Math.random()}`
  
  let rateLimitResult
  try {
    rateLimitResult = await viewsRateLimiter.checkLimit(ip)
  } catch (error) {
    rateLimitResult = { 
      allowed: true, 
      remaining: viewsRateLimiter.maxRequestsLimit, 
      resetTime: Date.now() + 60000 
    }
  }
  
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ 
        error: "Too many requests. Please try again later." 
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": viewsRateLimiter.maxRequestsLimit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          "Retry-After": Math.max(1, Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)).toString(),
        },
      }
    )
  }
  
  const slug = url.searchParams.get("slug")

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  let item
  try {
    await db
      .select({
        count: Views.count,
      })
      .from(Views)
      .where(eq(Views.slug, slug))

    item = await db
      .insert(Views)
      .values({
        slug: slug,
        count: 1,
      })
      .onConflictDoUpdate({
        target: Views.slug,
        set: {
          count: sql`count + 1`,
        },
      })
      .returning({
        slug: Views.slug,
        count: Views.count,
      })
      .then((res) => res[0])
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: "views", method: "POST" },
      extra: { slug }
    })
    item = { slug, count: 1 }
  }

  return new Response(JSON.stringify(item), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "X-RateLimit-Limit": viewsRateLimiter.maxRequestsLimit.toString(),
      "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
    },
  })
}

export const GET: APIRoute = async ({ url, clientAddress }) => {
  const ip = clientAddress ?? `unknown-${Math.random()}`
  
  let rateLimitResult
  try {
    rateLimitResult = await viewsRateLimiter.checkLimit(ip)
  } catch (error) {
    rateLimitResult = { 
      allowed: true, 
      remaining: viewsRateLimiter.maxRequestsLimit, 
      resetTime: Date.now() + 60000 
    }
  }
  
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ 
        error: "Too many requests. Please try again later." 
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": viewsRateLimiter.maxRequestsLimit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          "Retry-After": Math.max(1, Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)).toString(),
        },
      }
    )
  }
  
  const slug = url.searchParams.get("slug")

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  let item
  try {
    item = await db
      .select({
        count: Views.count,
      })
      .from(Views)
      .where(eq(Views.slug, slug))
      .then((res) => res[0])
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: "views", method: "GET" },
      extra: { slug }
    })
    item = { slug, count: 1 }
  }

  return new Response(JSON.stringify(item), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "X-RateLimit-Limit": viewsRateLimiter.maxRequestsLimit.toString(),
      "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
    },
  })
}