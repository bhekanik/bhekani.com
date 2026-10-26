import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { db, eq, sql, Views } from "astro:db"
import * as Sentry from "@sentry/astro"
import { viewsRateLimiter } from "../../utils/rateLimiter"
import { createViewsHandlers } from "../../utils/viewsApi"

export const prerender = false

let publishedPostIds: Promise<ReadonlySet<string>> | undefined

function loadPublishedPostIds(): Promise<ReadonlySet<string>> {
  if (!publishedPostIds) {
    publishedPostIds = getCollection("posts", ({ data }) => data.published)
      .then((posts) => new Set(posts.map(({ id }) => id)))
      .catch((error) => {
        publishedPostIds = undefined
        throw error
      })
  }

  return publishedPostIds
}

const handler = createViewsHandlers({
  rateLimiter: viewsRateLimiter,
  loadPublishedPostIds,
  async getCount(slug) {
    return db
      .select({ count: Views.count })
      .from(Views)
      .where(eq(Views.slug, slug))
      .then((rows) => rows[0]?.count)
  },
  async incrementCount(slug) {
    const item = await db
      .insert(Views)
      .values({ slug, count: 1 })
      .onConflictDoUpdate({
        target: Views.slug,
        set: { count: sql`count + 1` },
      })
      .returning({ count: Views.count })
      .then((rows) => rows[0])

    if (!item) throw new Error("View increment did not return a count")
    return item.count
  },
  onUnavailable(diagnostic) {
    Sentry.captureMessage("View count unavailable", {
      level: "warning",
      tags: { api: "views", ...diagnostic },
    })
  },
})

export const GET: APIRoute = ({ url, clientAddress }) => handler.GET({ url, clientAddress })
export const POST: APIRoute = ({ url, clientAddress }) => handler.POST({ url, clientAddress })
