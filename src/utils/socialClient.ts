import { z } from "zod"

const browserKey = "bk:social:browser"
const receiptPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const browserPattern = /^[a-z0-9-]{16,80}$/

const commentSchema = z.object({
  id: z.string().regex(receiptPattern),
  displayName: z.string(),
  body: z.string(),
  createdAt: z.string().datetime(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
})
const feedSchema = z.object({ likeCount: z.number().int().nonnegative(), comments: z.array(commentSchema) })
const likeSchema = z.object({ likeCount: z.number().int().nonnegative(), liked: z.boolean() })
const likeStatusSchema = z.object({ liked: z.boolean() })
const pendingCommentSchema = commentSchema.extend({ status: z.enum(["pending", "approved", "rejected"]) })
const receiptSchema = z.object({ comment: pendingCommentSchema })
const formSchema = z.object({ displayName: z.string(), body: z.string() })

type Comment = z.infer<typeof commentSchema>
type PendingComment = z.infer<typeof receiptSchema>["comment"]
type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">

let fallbackBrowserId: string | undefined
const fallbackPending = new Map<string, PendingComment[]>()
const cleanups = new WeakMap<HTMLElement, () => void>()

function localStorage(): StorageLike | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function read(storage: StorageLike | undefined, key: string): string | undefined {
  try {
    return storage?.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}

function write(storage: StorageLike | undefined, key: string, value: string) {
  try {
    storage?.setItem(key, value)
  } catch {}
}

function browserId(storage: StorageLike | undefined): string {
  if (fallbackBrowserId) return fallbackBrowserId
  const saved = read(storage, browserKey)
  fallbackBrowserId = saved && browserPattern.test(saved) ? saved : crypto.randomUUID().toLowerCase()
  write(storage, browserKey, fallbackBrowserId)
  return fallbackBrowserId
}

function pendingKey(contentType: string, contentId: string) {
  return `bk:social:pending:${contentType}:${contentId}`
}

function pendingComments(storage: StorageLike | undefined, contentType: string, contentId: string): PendingComment[] {
  const key = pendingKey(contentType, contentId)
  const stored = read(storage, key)
  if (stored) {
    try {
      const parsed = z.array(pendingCommentSchema).safeParse(JSON.parse(stored))
      if (parsed.success) return parsed.data.slice(-10)
    } catch {}
  }
  return fallbackPending.get(key) ?? []
}

function savePending(storage: StorageLike | undefined, contentType: string, contentId: string, comments: PendingComment[]) {
  const key = pendingKey(contentType, contentId)
  const bounded = comments.slice(-10)
  fallbackPending.set(key, bounded)
  write(storage, key, JSON.stringify(bounded))
}

function renderComment(comment: Comment, privateStatus?: string) {
  const article = document.createElement("article")
  article.className = "social-comment"
  const byline = document.createElement("p")
  const name = document.createElement("strong")
  name.textContent = comment.displayName
  byline.append(name)
  if (privateStatus) {
    const status = document.createElement("span")
    status.className = "social-comment-status"
    status.textContent = ` ${privateStatus}`
    byline.append(status)
  }
  const body = document.createElement("p")
  body.textContent = comment.body
  article.append(byline, body)
  return article
}

async function request<T>(input: RequestInfo, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(input, init)
  if (!response.ok) throw new Error(`Social request failed (${response.status})`)
  return schema.parse(await response.json())
}

function setDisabled(element: HTMLButtonElement | HTMLFieldSetElement | undefined, disabled: boolean) {
  if (element) element.disabled = disabled
}

export function initializeSocialInteractions(root: HTMLElement): () => void {
  const existing = cleanups.get(root)
  if (existing) return existing

  const contentType = root.dataset.contentType
  const contentId = root.dataset.contentId
  const heart = root.querySelector<HTMLButtonElement>("[data-social-heart]")
  const heartLabel = root.querySelector<HTMLElement>("[data-social-heart-label]")
  const likes = root.querySelector<HTMLElement>("[data-social-like-count]")
  const comments = root.querySelector<HTMLElement>("[data-social-comment-list]")
  const commentCount = root.querySelector<HTMLElement>("[data-social-comment-count]")
  const form = root.querySelector<HTMLFormElement>("[data-social-comment-form]")
  const formInputs = root.querySelector<HTMLFieldSetElement>("[data-social-inputs]")
  const formStatus = root.querySelector<HTMLElement>("[data-social-form-status]")
  const status = root.querySelector<HTMLElement>("[data-social-status]")
  const retry = root.querySelector<HTMLButtonElement>("[data-social-retry]")
  if (!contentType || !contentId || !heart || !heartLabel || !likes || !comments || !commentCount || !form || !formInputs || !formStatus || !status || !retry) return () => undefined

  const storage = localStorage()
  const id = browserId(storage)
  const controller = new AbortController()
  let active = true
  let revision = 0
  let ready = false
  let publicComments: Comment[] = []
  let localComments = pendingComments(storage, contentType, contentId)
  let liked = false

  const render = () => {
    comments.replaceChildren(...publicComments.map((comment) => renderComment(comment)))
    const publicIds = new Set(publicComments.map((comment) => comment.id))
    localComments = localComments.filter((comment) => !publicIds.has(comment.id))
    savePending(storage, contentType, contentId, localComments)
    for (const comment of localComments) comments.append(renderComment(comment, comment.status === "approved" ? "approved" : "private · pending review"))
    commentCount.textContent = String(publicComments.length)
    heart.setAttribute("aria-pressed", String(liked))
    heart.setAttribute("aria-label", liked ? "Remove heart" : "Heart this note")
    heartLabel.textContent = liked ? "Remove heart" : "Heart this note"
  }

  const setReady = (value: boolean) => {
    ready = value
    setDisabled(heart, !value)
    setDisabled(formInputs, !value)
  }

  const load = async (showLoading = true) => {
    const loadRevision = revision
    setReady(false)
    if (showLoading) status.textContent = "Loading responses…"
    retry.hidden = true
    try {
      const [feed, heartStatus] = await Promise.all([
        request(`/api/social?${new URLSearchParams({ contentType, contentId })}`, { headers: { Accept: "application/json" }, signal: controller.signal }, feedSchema),
        request("/api/social", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "likeStatus", contentType, contentId, browserId: id }), signal: controller.signal }, likeStatusSchema),
      ])
      if (!active || loadRevision !== revision) return
      publicComments = feed.comments
      likes.textContent = String(feed.likeCount)
      liked = heartStatus.liked
      render()
      setReady(true)
      status.textContent = ""
      await reconcileReceipts()
    } catch {
      if (!active || loadRevision !== revision) return
      status.textContent = "Responses are unavailable. Try again."
      retry.hidden = false
    }
  }

  const reconcileReceipts = async () => {
    await Promise.all(localComments.map(async (comment) => {
      try {
        const current = await request("/api/social", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "receipt", contentType, contentId, browserId: id, receipt: comment.id }),
          signal: controller.signal,
        }, receiptSchema)
        if (!active) return
        if (current.comment.status === "rejected") {
          localComments = localComments.filter((candidate) => candidate.id !== current.comment.id)
          formStatus.textContent = "Your comment was not published."
        } else {
          localComments = localComments.map((candidate) => candidate.id === current.comment.id ? current.comment : candidate)
        }
      } catch {}
    }))
    if (active) render()
  }

  const onRetry = () => { void load() }
  const onHeart = async () => {
    if (!ready) return
    revision += 1
    const actionRevision = revision
    setDisabled(heart, true)
    try {
      const result = await request("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: liked ? "unlike" : "like", contentType, contentId, browserId: id }),
        signal: controller.signal,
      }, likeSchema)
      if (!active || actionRevision !== revision) return
      liked = result.liked
      likes.textContent = String(result.likeCount)
      render()
    } catch {
      if (active) status.textContent = "Your heart could not be saved. Try again."
    } finally {
      if (active && actionRevision === revision) setDisabled(heart, false)
    }
  }
  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    if (!ready) return
    const fields = formSchema.safeParse(Object.fromEntries(new FormData(form)))
    if (!fields.success) return
    const { displayName, body } = fields.data
    const submit = form.querySelector<HTMLButtonElement>("button[type=submit]")
    const receipt = form.dataset.receipt || crypto.randomUUID()
    form.dataset.receipt = receipt
    setDisabled(submit ?? undefined, true)
    formStatus.textContent = "Submitting for review…"
    try {
      const result = await request("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", contentType, contentId, browserId: id, receipt, displayName, body }),
        signal: controller.signal,
      }, receiptSchema)
      if (!active) return
      if (result.comment.status === "rejected") {
        localComments = localComments.filter((candidate) => candidate.id !== result.comment.id)
        formStatus.textContent = "Your comment was not published."
      } else {
        localComments = [...localComments.filter((candidate) => candidate.id !== result.comment.id), result.comment]
        form.reset()
        delete form.dataset.receipt
        formStatus.textContent = result.comment.status === "approved" ? "Your comment is published." : "Saved privately. It will appear publicly after review."
      }
      render()
      if (result.comment.status === "approved") void load(false)
    } catch {
      if (active) formStatus.textContent = "We could not confirm this submission. Retry to use the same private receipt."
    } finally {
      if (active) setDisabled(submit ?? undefined, false)
    }
  }

  heart.addEventListener("click", onHeart)
  retry.addEventListener("click", onRetry)
  form.addEventListener("submit", onSubmit)
  render()
  void load()

  const cleanup = () => {
    active = false
    controller.abort()
    heart.removeEventListener("click", onHeart)
    retry.removeEventListener("click", onRetry)
    form.removeEventListener("submit", onSubmit)
    cleanups.delete(root)
  }
  cleanups.set(root, cleanup)
  return cleanup
}

export function initializeAllSocialInteractions() {
  document.querySelectorAll<HTMLElement>("[data-social-interactions]").forEach(initializeSocialInteractions)
}

export function cleanupSocialInteractions() {
  document.querySelectorAll<HTMLElement>("[data-social-interactions]").forEach((root) => cleanups.get(root)?.())
}
