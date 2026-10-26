import { describe, expect, it, vi } from "vitest"
import { createSocialHandlers, type PrivateComment, type SocialApiDependencies } from "../../src/utils/socialApi"

const browserId = "7d6542fb-8d83-4f42-a968-fc6944d733b1"
const receipt = "a9d735b0-2b3d-4307-9b6c-bcc2b9aafb9e"
const content = { contentType: "micro", contentId: "back-to-vscode" } as const
type StoredComment = PrivateComment & typeof content & { browserId: string; moderationFlags: string[] }

type TestPayload = {
  action: string
  contentType: string
  contentId: string
  browserId?: string
  receipt?: string
  displayName?: string
  body?: string
}

function request(payload: TestPayload) {
  return {
    url: new URL("https://example.test/api/social"),
    clientAddress: "127.0.0.1",
    request: new Request("https://example.test/api/social", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  }
}

function dependencies(overrides: Partial<SocialApiDependencies> = {}) {
  const privateComments = new Map<string, StoredComment>()
  const likes = new Set<string>()
  const key = (type: string, id: string, browser: string) => `${type}:${id}:${browser}`
  return {
    rateLimiter: { maxRequestsLimit: 60, checkLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 59, resetTime: Date.UTC(2026, 9, 26, 12, 0, 0) }) },
    loadPublishedIds: vi.fn().mockResolvedValue({ micro: new Set([content.contentId]), post: new Set(["test"]) }),
    getLikeCount: vi.fn(async (type, id) => [...likes].filter((value) => value.startsWith(`${type}:${id}:`)).length),
    isLiked: vi.fn(async (type, id, browser) => likes.has(key(type, id, browser))),
    like: vi.fn(async (type, id, browser) => {
      likes.add(key(type, id, browser))
      return [...likes].filter((value) => value.startsWith(`${type}:${id}:`)).length
    }),
    unlike: vi.fn(async (type, id, browser) => {
      likes.delete(key(type, id, browser))
      return [...likes].filter((value) => value.startsWith(`${type}:${id}:`)).length
    }),
    getApprovedComments: vi.fn().mockResolvedValue([]),
    createComment: vi.fn(async (comment) => {
      const existing = privateComments.get(comment.id)
      if (existing) return existing
      const stored = { ...comment, status: "pending" as const, createdAt: "2026-10-26T12:00:00.000Z" }
      privateComments.set(comment.id, stored)
      return stored
    }),
    getPrivateComment: vi.fn(async (id, marker) => {
      const stored = privateComments.get(id)
      return stored?.browserId === marker ? stored : undefined
    }),
    ...overrides,
  } satisfies SocialApiDependencies
}

describe("social interaction API contract", () => {
  it("keeps concurrent and replayed hearts idempotent, then never returns a negative count after unlike", async () => {
    const services = dependencies()
    const handlers = createSocialHandlers(services)
    const payload = { action: "like", ...content, browserId }
    const responses = await Promise.all(Array.from({ length: 8 }, () => handlers.POST(request(payload))))

    await expect(responses[0]!.json()).resolves.toEqual({ likeCount: 1, liked: true })
    expect(await handlers.POST(request({ action: "unlike", ...content, browserId })).then((response) => response.json())).toEqual({ likeCount: 0, liked: false })
    expect(await handlers.POST(request({ action: "unlike", ...content, browserId })).then((response) => response.json())).toEqual({ likeCount: 0, liked: false })
  })

  it("only returns approved comments publicly and makes the unguessable receipt private to its browser marker", async () => {
    const services = dependencies({
      getApprovedComments: vi.fn().mockResolvedValue([{ id: "approved", displayName: "Reader", body: "Public", createdAt: "2026-10-26T12:00:00.000Z" }]),
    })
    const handlers = createSocialHandlers(services)
    const submitted = await handlers.POST(request({ action: "comment", ...content, browserId, receipt, displayName: "Private reader", body: "Pending text" }))
    expect(submitted.status).toBe(201)
    await expect(submitted.json()).resolves.toMatchObject({ comment: { id: receipt, status: "pending", body: "Pending text" } })

    const publicResponse = await handlers.GET({ url: new URL(`https://example.test/api/social?contentType=micro&contentId=${content.contentId}`), clientAddress: "127.0.0.1" })
    await expect(publicResponse.json()).resolves.toEqual({ likeCount: 0, comments: [{ id: "approved", displayName: "Reader", body: "Public", createdAt: "2026-10-26T12:00:00.000Z" }] })

    const otherBrowser = await handlers.POST(request({ action: "receipt", ...content, browserId: "6f6542fb-8d83-4f42-a968-fc6944d733b1", receipt }))
    expect(otherBrowser.status).toBe(404)
    expect(JSON.stringify(await otherBrowser.json())).not.toContain("Pending text")
  })

  it("flags likely obfuscated profanity for moderation while allowing a harmless false-positive control to remain pending", async () => {
    const flags: string[][] = []
    const services = dependencies({
      createComment: async (comment) => {
        flags.push(comment.moderationFlags)
        return { ...comment, status: "pending", createdAt: "2026-10-26T12:00:00.000Z" }
      },
    })
    const handlers = createSocialHandlers(services)
    await handlers.POST(request({ action: "comment", ...content, browserId, receipt, displayName: "Reader", body: "This is sh1t." }))
    expect(flags[0]).toContain("shit")

    await handlers.POST(request({ action: "comment", ...content, browserId, receipt: "b9d735b0-2b3d-4307-9b6c-bcc2b9aafb9e", displayName: "Class reader", body: "A classic example." }))
    expect(flags[1]).toEqual([])
  })

  it("rejects hostile identities, oversized/plainly wrong inputs, and cross-origin browser mutations before persistence", async () => {
    const services = dependencies()
    const handlers = createSocialHandlers(services)
    const crossOrigin = {
      url: new URL("https://example.test/api/social"),
      clientAddress: "127.0.0.1",
      // SAFETY: the handler reads only headers for this pre-persistence origin rejection test.
      request: { headers: { get: (name: string) => name.toLowerCase() === "origin" ? "https://attacker.test" : null } } as Request,
    }
    const attempts = [
      handlers.POST(request({ action: "like", contentType: "book", contentId: "secret", browserId })),
      handlers.POST(request({ action: "like", ...content, browserId: "short" })),
      handlers.POST(request({ action: "comment", ...content, browserId, receipt, displayName: "A", body: "x".repeat(1_001) })),
      handlers.POST(crossOrigin),
    ]
    const responses = await Promise.all(attempts)
    expect(responses.map((response) => response.status)).toEqual([400, 400, 400, 403])
    expect(services.like).not.toHaveBeenCalled()
    expect(services.createComment).not.toHaveBeenCalled()
  })

  it("rejects draft and unknown content before its limiter or persistence dependencies run", async () => {
    const services = dependencies()
    const response = await createSocialHandlers(services).POST(request({ action: "like", contentType: "micro", contentId: "draft-note", browserId }))
    expect(response.status).toBe(404)
    expect(services.rateLimiter.checkLimit).not.toHaveBeenCalled()
    expect(services.like).not.toHaveBeenCalled()
  })
})
