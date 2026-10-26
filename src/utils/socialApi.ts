import { z } from "zod"

export type SocialContentType = "micro" | "post"
export type CommentStatus = "pending" | "approved" | "rejected"

export type PublicComment = {
  id: string
  displayName: string
  body: string
  createdAt: string
}

export type PrivateComment = PublicComment & {
  status: CommentStatus
}

export type StoredPrivateComment = PrivateComment & {
  contentType: SocialContentType
  contentId: string
}

export interface SocialRateLimiter {
  maxRequestsLimit: number
  checkLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }>
}

export interface SocialApiDependencies {
  rateLimiters: {
    reads: SocialRateLimiter
    hearts: SocialRateLimiter
    comments: SocialRateLimiter
  }
  loadPublishedIds: () => Promise<{ micro: ReadonlySet<string>; post: ReadonlySet<string> }>
  getLikeCount: (contentType: SocialContentType, contentId: string) => Promise<number>
  isLiked: (contentType: SocialContentType, contentId: string, browserId: string) => Promise<boolean>
  like: (contentType: SocialContentType, contentId: string, browserId: string) => Promise<number>
  unlike: (contentType: SocialContentType, contentId: string, browserId: string) => Promise<number>
  getApprovedComments: (contentType: SocialContentType, contentId: string) => Promise<PublicComment[]>
  createComment: (comment: {
    id: string
    contentType: SocialContentType
    contentId: string
    browserId: string
    displayName: string
    body: string
    moderationFlags: string[]
  }) => Promise<StoredPrivateComment>
  getPrivateComment: (id: string, browserId: string) => Promise<StoredPrivateComment | undefined>
}

export interface SocialRequest {
  url: URL
  request?: Request
  clientAddress?: string
}

const MAX_CONTENT_ID_LENGTH = 160
const MAX_BODY_BYTES = 2_048
const MAX_COMMENT_BODY_LENGTH = 1_000
const MAX_DISPLAY_NAME_LENGTH = 60
const CONTENT_ID = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?(?:\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?)*$/
const BROWSER_ID = /^[a-z0-9-]{16,80}$/
const RECEIPT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PROFANITY = ["asshole", "bastard", "bitch", "bullshit", "fuck", "motherfucker", "shit", "slut", "whore"]

const payloadSchema = z.object({
  action: z.string().optional(),
  contentType: z.string().optional(),
  contentId: z.string().optional(),
  browserId: z.string().optional(),
  receipt: z.string().optional(),
  displayName: z.string().optional(),
  body: z.string().optional(),
})

type Payload = z.infer<typeof payloadSchema>

const json = (body: Record<string, string | number | boolean | PublicComment[] | { id: string; displayName: string; body: string; createdAt: string; status: CommentStatus }>, status: number, headers: HeadersInit = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
    ...headers,
  },
})

const codePoints = (value: string) => Array.from(value).length

function isContentType(value: string): value is SocialContentType {
  return value === "micro" || value === "post"
}

function isValidContentId(value: string): boolean {
  return value.length <= MAX_CONTENT_ID_LENGTH && CONTENT_ID.test(value)
}

function isValidBrowserId(value: string): boolean {
  return BROWSER_ID.test(value)
}

function isValidReceipt(value: string): boolean {
  return RECEIPT_ID.test(value)
}

function flagLikelyProfanity(value: string): string[] {
  const normalized = value.toLowerCase()
    .replace(/0/g, "o")
    .replace(/@/g, "a")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z0-9]+/g, "")
  return PROFANITY.filter((word) => normalized.includes(word))
}

async function readText(request: Request): Promise<string | undefined> {
  const contentLength = Number(request.headers.get("content-length"))
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return undefined
  if (!request.body) return ""

  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
  try {
    reader = request.body.getReader()
    const decoder = new TextDecoder()
    let size = 0
    let text = ""
    while (true) {
      const chunk = await reader.read()
      if (chunk.done) return text + decoder.decode()
      size += chunk.value.byteLength
      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        return undefined
      }
      text += decoder.decode(chunk.value, { stream: true })
    }
  } catch {
    return undefined
  } finally {
    reader?.releaseLock()
  }
}

async function readPayload(request: Request): Promise<Payload | undefined> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return undefined
  try {
    const text = await readText(request)
    if (!text) return undefined
    return payloadSchema.safeParse(JSON.parse(text)).data
  } catch {
    return undefined
  }
}

async function checkRateLimit(rateLimiter: SocialRateLimiter, clientAddress: string | undefined): Promise<Response | undefined> {
  try {
    const result = await rateLimiter.checkLimit(clientAddress ?? "unknown")
    if (result.allowed) return undefined
    return json({ error: "Too many requests. Please try again later.", code: "rate_limited" }, 429, {
      "Retry-After": Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1_000)).toString(),
      "X-RateLimit-Limit": rateLimiter.maxRequestsLimit.toString(),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
    })
  } catch {
    return json({ error: "Comments and hearts are temporarily unavailable.", code: "social_unavailable" }, 503)
  }
}

async function validateContent(
  dependencies: SocialApiDependencies,
  contentType: string,
  contentId: string,
): Promise<{ contentType: SocialContentType; contentId: string } | Response> {
  if (!isContentType(contentType) || !isValidContentId(contentId)) {
    return json({ error: "Invalid published content identity.", code: "invalid_content" }, 400)
  }

  try {
    const published = await dependencies.loadPublishedIds()
    if (!published[contentType].has(contentId)) {
      return json({ error: "Published content not found.", code: "content_not_found" }, 404)
    }
  } catch {
    return json({ error: "Comments and hearts are temporarily unavailable.", code: "social_unavailable" }, 503)
  }

  return { contentType, contentId }
}

function isResponse(value: Response | { contentType: SocialContentType; contentId: string }): value is Response {
  return value instanceof Response
}

export function createSocialHandlers(dependencies: SocialApiDependencies) {
  return {
    async GET({ url, clientAddress }: SocialRequest): Promise<Response> {
      const content = await validateContent(dependencies, url.searchParams.get("contentType") ?? "", url.searchParams.get("contentId") ?? "")
      if (isResponse(content)) return content
      const limited = await checkRateLimit(dependencies.rateLimiters.reads, clientAddress)
      if (limited) return limited

      try {
        const [likeCount, comments] = await Promise.all([
          dependencies.getLikeCount(content.contentType, content.contentId),
          dependencies.getApprovedComments(content.contentType, content.contentId),
        ])
        return json({ likeCount, comments }, 200)
      } catch {
        return json({ error: "Comments and hearts are temporarily unavailable.", code: "social_unavailable" }, 503)
      }
    },

    async POST({ url, request, clientAddress }: SocialRequest): Promise<Response> {
      if (!request) return json({ error: "A JSON request is required.", code: "invalid_request" }, 400)
      const origin = request.headers.get("origin")
      if (origin && origin !== url.origin) return json({ error: "This request must come from the same site.", code: "invalid_origin" }, 403)

      const payload = await readPayload(request)
      if (!payload) return json({ error: "A bounded JSON request is required.", code: "invalid_request" }, 400)
      const content = await validateContent(dependencies, payload.contentType ?? "", payload.contentId ?? "")
      if (isResponse(content)) return content
      if (payload.action === "likeStatus" || payload.action === "like" || payload.action === "unlike") {
        const browserId = payload.browserId ?? ""
        if (!isValidBrowserId(browserId)) return json({ error: "Invalid anonymous browser marker.", code: "invalid_browser" }, 400)
        const limited = await checkRateLimit(
          payload.action === "likeStatus" ? dependencies.rateLimiters.reads : dependencies.rateLimiters.hearts,
          clientAddress,
        )
        if (limited) return limited
        try {
          if (payload.action === "likeStatus") {
            return json({ liked: await dependencies.isLiked(content.contentType, content.contentId, browserId) }, 200)
          }
          const likeCount = payload.action === "like"
            ? await dependencies.like(content.contentType, content.contentId, browserId)
            : await dependencies.unlike(content.contentType, content.contentId, browserId)
          return json({ likeCount, liked: payload.action === "like" }, 200)
        } catch {
          return json({ error: "Hearts are temporarily unavailable.", code: "social_unavailable" }, 503)
        }
      }

      if (payload.action === "receipt") {
        const receipt = payload.receipt ?? ""
        const browserId = payload.browserId ?? ""
        if (!isValidReceipt(receipt) || !isValidBrowserId(browserId)) {
          return json({ error: "Invalid private receipt.", code: "invalid_receipt" }, 400)
        }
        const limited = await checkRateLimit(dependencies.rateLimiters.reads, clientAddress)
        if (limited) return limited
        try {
          const comment = await dependencies.getPrivateComment(receipt, browserId)
          if (!comment || comment.contentType !== content.contentType || comment.contentId !== content.contentId) {
            return json({ error: "Comment receipt not found.", code: "receipt_not_found" }, 404)
          }
          return json({ comment: { id: comment.id, displayName: comment.displayName, body: comment.body, createdAt: comment.createdAt, status: comment.status } }, 200)
        } catch {
          return json({ error: "Comments are temporarily unavailable.", code: "social_unavailable" }, 503)
        }
      }

      if (payload.action !== "comment") return json({ error: "Unknown social action.", code: "invalid_action" }, 400)
      const receipt = payload.receipt ?? ""
      const browserId = payload.browserId ?? ""
      if (!isValidReceipt(receipt) || !isValidBrowserId(browserId)) {
        return json({ error: "Invalid comment receipt or browser marker.", code: "invalid_comment" }, 400)
      }
      const displayName = payload.displayName?.trim()
      const body = payload.body?.trim()
      if (!displayName || !body) {
        return json({ error: "A plain-text name and comment are required.", code: "invalid_comment" }, 400)
      }
      if (codePoints(displayName) > MAX_DISPLAY_NAME_LENGTH || codePoints(body) > MAX_COMMENT_BODY_LENGTH) {
        return json({ error: "Use a name up to 60 characters and a comment up to 1,000 characters.", code: "invalid_comment" }, 400)
      }

      try {
        const limited = await checkRateLimit(dependencies.rateLimiters.comments, clientAddress)
        if (limited) return limited
        const moderationFlags = [...new Set([...flagLikelyProfanity(displayName), ...flagLikelyProfanity(body)])]
        const comment = await dependencies.createComment({
          id: receipt,
          contentType: content.contentType,
          contentId: content.contentId,
          browserId,
          displayName,
          body,
          moderationFlags,
        })
        if (comment.contentType !== content.contentType || comment.contentId !== content.contentId) {
          return json({ error: "This private receipt belongs to a different submission.", code: "receipt_conflict" }, 409)
        }
        return json({ comment: { id: comment.id, displayName: comment.displayName, body: comment.body, createdAt: comment.createdAt, status: comment.status } }, comment.status === "pending" ? 201 : 200)
      } catch {
        return json({ error: "Comments are temporarily unavailable.", code: "social_unavailable" }, 503)
      }
    },
  }
}
