import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { and, asc, count, db, eq, SocialComments, SocialLikes } from "astro:db"
import { RateLimiter } from "../../utils/rateLimiter"
import { createSocialHandlers, type CommentStatus, type SocialContentType } from "../../utils/socialApi"

export const prerender = false

const socialRateLimiter = new RateLimiter(60, 60_000)
let publishedIds: Promise<{ micro: ReadonlySet<string>; post: ReadonlySet<string> }> | undefined

function loadPublishedIds(): Promise<{ micro: ReadonlySet<string>; post: ReadonlySet<string> }> {
  if (!publishedIds) {
    publishedIds = Promise.all([
      getCollection("micro", ({ data }) => data.published !== false),
      getCollection("posts", ({ data }) => data.published),
    ]).then(([micro, post]) => ({
      micro: new Set(micro.map(({ id }) => id)),
      post: new Set(post.map(({ id }) => id)),
    })).catch((error) => {
      publishedIds = undefined
      throw error
    })
  }
  return publishedIds
}

function likeId(contentType: SocialContentType, contentId: string, browserId: string) {
  return `${contentType}:${contentId}:${browserId}`
}

function asStatus(value: string): CommentStatus {
  if (value === "pending" || value === "approved" || value === "rejected") return value
  throw new Error("Invalid stored comment status")
}

function commentDate(value: Date) {
  return value.toISOString()
}

async function getLikeCount(contentType: SocialContentType, contentId: string) {
  const rows = await db.select({ value: count() }).from(SocialLikes).where(and(
    eq(SocialLikes.contentType, contentType),
    eq(SocialLikes.contentId, contentId),
  ))
  return rows[0]?.value ?? 0
}

async function getPrivateComment(id: string, browserId: string) {
  const rows = await db.select({
    id: SocialComments.id,
    contentType: SocialComments.contentType,
    contentId: SocialComments.contentId,
    browserId: SocialComments.browserId,
    displayName: SocialComments.displayName,
    body: SocialComments.body,
    status: SocialComments.status,
    createdAt: SocialComments.createdAt,
  }).from(SocialComments).where(and(eq(SocialComments.id, id), eq(SocialComments.browserId, browserId)))
  const row = rows[0]
  if (!row) return undefined
  return {
    id: row.id,
    // SAFETY: rows are written only by this route with the SocialContentType union.
    contentType: row.contentType as SocialContentType,
    contentId: row.contentId,
    displayName: row.displayName,
    body: row.body,
    status: asStatus(row.status),
    createdAt: commentDate(row.createdAt),
  }
}

const handler = createSocialHandlers({
  rateLimiter: socialRateLimiter,
  loadPublishedIds,
  getLikeCount,
  async isLiked(contentType, contentId, browserId) {
    const rows = await db.select({ id: SocialLikes.id }).from(SocialLikes).where(eq(
      SocialLikes.id,
      likeId(contentType, contentId, browserId),
    ))
    return rows.length > 0
  },
  async like(contentType, contentId, browserId) {
    await db.insert(SocialLikes).values({
      id: likeId(contentType, contentId, browserId),
      contentType,
      contentId,
      browserId,
      createdAt: new Date(),
    }).onConflictDoNothing()
    return getLikeCount(contentType, contentId)
  },
  async unlike(contentType, contentId, browserId) {
    await db.delete(SocialLikes).where(eq(SocialLikes.id, likeId(contentType, contentId, browserId)))
    return getLikeCount(contentType, contentId)
  },
  async getApprovedComments(contentType, contentId) {
    const rows = await db.select({
      id: SocialComments.id,
      displayName: SocialComments.displayName,
      body: SocialComments.body,
      createdAt: SocialComments.createdAt,
    }).from(SocialComments).where(and(
      eq(SocialComments.contentType, contentType),
      eq(SocialComments.contentId, contentId),
      eq(SocialComments.status, "approved"),
    )).orderBy(asc(SocialComments.createdAt))
    return rows.map((row) => ({ ...row, createdAt: commentDate(row.createdAt) }))
  },
  async createComment(comment) {
    await db.insert(SocialComments).values({
      ...comment,
      moderationFlags: comment.moderationFlags.join(",") || undefined,
      status: "pending",
      createdAt: new Date(),
    }).onConflictDoNothing()
    const stored = await getPrivateComment(comment.id, comment.browserId)
    if (!stored) throw new Error("Comment receipt was not stored")
    return stored
  },
  getPrivateComment,
})

export const GET: APIRoute = ({ url, clientAddress }) => handler.GET({ url, clientAddress })
export const POST: APIRoute = ({ url, request, clientAddress }) => handler.POST({ url, request, clientAddress })
