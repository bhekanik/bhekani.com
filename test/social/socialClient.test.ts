import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanupSocialInteractions, initializeSocialInteractions } from "../../src/utils/socialClient"

const timestamp = "2026-10-26T12:00:00.000Z"
const receipt = "a9d735b0-2b3d-4307-9b6c-bcc2b9aafb9e"

function root(contentId = "back-to-vscode") {
  document.body.innerHTML = `<section data-social-interactions data-content-type="micro" data-content-id="${contentId}">
    <button data-social-heart disabled><span data-social-like-count>0</span><span data-social-heart-label></span></button>
    <div data-social-comment-list></div><span data-social-comment-count>0</span>
    <form data-social-comment-form action="/api/social" method="post"><fieldset data-social-inputs disabled><input name="displayName"><textarea name="body"></textarea><button type="submit">Submit</button></fieldset></form>
    <p data-social-form-status></p><p data-social-status></p><button data-social-retry hidden>Retry</button>
  </section>`
  return document.querySelector<HTMLElement>("[data-social-interactions]")!
}

type TestResponse = {
  comment?: { id: string; displayName: string; body: string; createdAt: string; status: "pending" | "approved" | "rejected" }
  comments?: []
  likeCount?: number | string
  liked?: boolean
}

function response(body: TestResponse) {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }))
}

afterEach(() => {
  cleanupSocialInteractions()
  vi.unstubAllGlobals()
  document.body.innerHTML = ""
})

describe("social interaction client", () => {
  it("keeps one in-memory marker when storage getter, getItem, or setItem is denied", async () => {
    let calls: RequestInit[] = []
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo, init: RequestInit) => {
      calls.push(init)
      return String(input).startsWith("/api/social?")
        ? response({ likeCount: 0, comments: [] })
        : response({ liked: false })
    }))
    let denyGetter = true
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        if (denyGetter) {
          denyGetter = false
          throw new Error("Storage denied")
        }
        return { getItem: () => { throw new Error("Storage denied") }, setItem: () => { throw new Error("Storage denied") } }
      },
    })

    expect(() => initializeSocialInteractions(root())).not.toThrow()
    await vi.waitFor(() => expect(calls).toHaveLength(2))
    initializeSocialInteractions(root("another-note"))
    await vi.waitFor(() => expect(calls).toHaveLength(4))

    const markers = calls
      .filter((call) => call.body)
      .map((call) => JSON.parse(String(call.body)).browserId)
    expect(markers).toHaveLength(2)
    expect(new Set(markers).size).toBe(1)
  })

  it("does not permit a heart mutation before delayed initial responses settle", async () => {
    let resolveFeed: (value: Response) => void = () => undefined
    let resolveStatus: (value: Response) => void = () => undefined
    const fetch = vi.fn((input: RequestInfo, init: RequestInit) => {
      if (String(input).startsWith("/api/social?")) return new Promise<Response>((resolve) => { resolveFeed = resolve })
      const action = JSON.parse(String(init.body)).action
      if (action === "likeStatus") return new Promise<Response>((resolve) => { resolveStatus = resolve })
      return response({ likeCount: 1, liked: true })
    })
    vi.stubGlobal("fetch", fetch)
    const element = root()
    initializeSocialInteractions(element)
    const heart = element.querySelector<HTMLButtonElement>("[data-social-heart]")!
    heart.removeAttribute("disabled")
    heart.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    expect(fetch).toHaveBeenCalledTimes(2)

    resolveFeed(new Response(JSON.stringify({ likeCount: 0, comments: [] })))
    resolveStatus(new Response(JSON.stringify({ liked: false })))
    await vi.waitFor(() => expect(heart.disabled).toBe(false))
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(heart.getAttribute("aria-pressed")).toBe("false")
    expect(element.querySelector("[data-social-like-count]")?.textContent).toBe("0")
  })

  it("does not start duplicate initial work when Astro mounts the same root twice", async () => {
    const fetch = vi.fn((input: RequestInfo) => String(input).startsWith("/api/social?")
      ? response({ likeCount: 0, comments: [] })
      : response({ liked: false }))
    vi.stubGlobal("fetch", fetch)
    const element = root()
    initializeSocialInteractions(element)
    initializeSocialInteractions(element)
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
  })

  it("keeps the form disabled on malformed/unavailable responses and offers a visible retry", async () => {
    vi.stubGlobal("fetch", vi.fn(() => response({ likeCount: "bad", comments: [] })))
    const element = root()
    initializeSocialInteractions(element)
    await vi.waitFor(() => expect(element.querySelector<HTMLButtonElement>("[data-social-retry]")?.hidden).toBe(false))
    expect(element.querySelector<HTMLFieldSetElement>("[data-social-inputs]")?.disabled).toBe(true)
    expect(element.querySelector<HTMLButtonElement>("[data-social-retry]")?.hidden).toBe(false)
    expect(element.querySelector("[data-social-status]")?.textContent).toContain("unavailable")
  })

  it("restores a successful private receipt, then removes it after a rejected receipt check", async () => {
    let receiptCheck = false
    vi.stubGlobal("fetch", vi.fn((input: RequestInfo, init: RequestInit) => {
      if (String(input).startsWith("/api/social?")) return response({ likeCount: 0, comments: [] })
      const action = JSON.parse(String(init.body)).action
      if (action === "likeStatus") return response({ liked: false })
      if (action === "comment") return response({ comment: { id: receipt, displayName: "Reader", body: "Private", createdAt: timestamp, status: "pending" } })
      return response({ comment: { id: receipt, displayName: "Reader", body: "Private", createdAt: timestamp, status: receiptCheck ? "rejected" : "pending" } })
    }))
    const element = root()
    initializeSocialInteractions(element)
    await vi.waitFor(() => expect(element.querySelector<HTMLFieldSetElement>("[data-social-inputs]")?.disabled).toBe(false))
    const form = element.querySelector<HTMLFormElement>("form")!
    form.querySelector<HTMLInputElement>("input")!.value = "Reader"
    form.querySelector<HTMLTextAreaElement>("textarea")!.value = "Private"
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }))
    await vi.waitFor(() => expect(element.textContent).toContain("private · pending review"))
    expect(element.textContent).toContain("private · pending review")

    receiptCheck = true
    cleanupSocialInteractions()
    initializeSocialInteractions(element)
    await vi.waitFor(() => expect(element.textContent).toContain("not published"))
    expect(element.textContent).toContain("not published")
    expect(element.textContent).not.toContain("private · pending review")
  })
})
