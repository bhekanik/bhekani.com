import { fireEvent, getByRole, getByText, queryByText } from "@testing-library/dom"
import { mount, tick, unmount } from "svelte"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import Search from "../../src/components/Search.svelte"

type Deferred = {
  promise: Promise<Response>
  resolve: (response: Response) => void
}

function deferredResponse(): Deferred {
  let resolve!: (response: Response) => void
  return { promise: new Promise((done) => { resolve = done }), resolve }
}

const originalFetch = globalThis.fetch

describe("Search dialog", () => {
  let target: HTMLDivElement
  let trigger: HTMLButtonElement
  let component: ReturnType<typeof mount>

  beforeEach(async () => {
    vi.useFakeTimers()
    HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute("open", "") }
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open")
      this.dispatchEvent(new Event("close"))
    }
    target = document.createElement("div")
    trigger = document.createElement("button")
    trigger.type = "button"
    trigger.className = "search-trigger"
    trigger.textContent = "Search"
    document.body.append(trigger, target)
    component = mount(Search, { target })
    await tick()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    unmount(component)
    target.remove()
    trigger.remove()
    vi.useRealTimers()
  })

  async function open() {
    trigger.focus()
    fireEvent.click(trigger)
    await tick()
    await tick()
    const dialog = target.querySelector("dialog")
    if (!dialog) throw new Error("Search dialog was not rendered")
    return dialog
  }

  async function settle() {
    await Promise.resolve()
    await vi.advanceTimersByTimeAsync(0)
    await tick()
  }

  it("opens a labelled native dialog, focuses the input, and restores focus on Escape", async () => {
    const dialog = await open()
    const input = getByRole(dialog, "searchbox", { name: /search published/i })
    expect(dialog).toHaveAttribute("open")
    expect(input).toHaveFocus()

    fireEvent.keyDown(dialog, { key: "Escape" })
    await tick()
    expect(dialog).not.toHaveAttribute("open")
    expect(trigger).toHaveFocus()
  })

  it("renders real anchors for successful results", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      results: [{ id: "book-1", type: "book", title: "Warbreaker", slug: "/books/warbreaker-warbreaker-1/", score: 1 }],
    }), { status: 200 }))
    const dialog = await open()
    const input = getByRole(dialog, "searchbox")
    fireEvent.input(input, { target: { value: "Warbreaker" } })
    await vi.advanceTimersByTimeAsync(250)
    await tick()

    const result = getByRole(dialog, "link", { name: /warbreaker/i })
    expect(result).toHaveAttribute("href", "/books/warbreaker-warbreaker-1/")
  })

  it("does not submit punctuation-only input", async () => {
    const fetchMock = vi.fn()
    globalThis.fetch = fetchMock
    const dialog = await open()
    const input = getByRole(dialog, "searchbox")

    fireEvent.input(input, { target: { value: "—?!" } })
    await vi.advanceTimersByTimeAsync(250)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(getByText(dialog, /at least 2 letters or numbers/i)).toBeInTheDocument()
  })

  it("keeps an old response from replacing a newer query or clearing its state", async () => {
    const oldRequest = deferredResponse()
    const currentRequest = deferredResponse()
    globalThis.fetch = vi.fn()
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(currentRequest.promise)
    const dialog = await open()
    const input = getByRole(dialog, "searchbox")

    fireEvent.input(input, { target: { value: "Warbreaker" } })
    await vi.advanceTimersByTimeAsync(250)
    fireEvent.input(input, { target: { value: "mxr" } })
    await vi.advanceTimersByTimeAsync(250)

    currentRequest.resolve(new Response(JSON.stringify({
      results: [{ id: "project-mxr", type: "project", title: "mxr", slug: "https://mxr.sh", score: 1 }],
    }), { status: 200 }))
    await settle()
    oldRequest.resolve(new Response(JSON.stringify({
      results: [{ id: "book-1", type: "book", title: "Warbreaker", slug: "/books/warbreaker-warbreaker-1/", score: 1 }],
    }), { status: 200 }))
    await settle()

    expect(getByRole(dialog, "link", { name: /mxr/i })).toHaveAttribute("href", "https://mxr.sh")
    expect(queryByText(dialog, "Warbreaker")).not.toBeInTheDocument()
  })

  it("keeps true empty, rate-limit, and retryable failure states distinct", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "rate_limited" }), { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "search_unavailable" }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ results: [] }), { status: 200 }))
    globalThis.fetch = fetchMock
    const dialog = await open()
    const input = getByRole(dialog, "searchbox")

    fireEvent.input(input, { target: { value: "none" } })
    await vi.advanceTimersByTimeAsync(250)
    await tick()
    expect(getByText(dialog, /no results for/i)).toBeInTheDocument()

    fireEvent.input(input, { target: { value: "rate" } })
    await vi.advanceTimersByTimeAsync(250)
    await tick()
    expect(getByText(dialog, /taking a short break/i)).toBeInTheDocument()
    fireEvent.click(getByRole(dialog, "button", { name: /try again/i }))
    await settle()
    expect(getByText(dialog, /index could not be reached/i)).toBeInTheDocument()
    expect(getByRole(dialog, "button", { name: /try again/i })).toBeInTheDocument()
  })

  it("aborts a pending request on close and starts cleanly after reopening", async () => {
    let signal: AbortSignal | undefined
    globalThis.fetch = vi.fn((_url: RequestInfo | URL, options?: RequestInit) => {
      signal = options?.signal ?? undefined
      return new Promise<Response>(() => undefined)
    })
    const dialog = await open()
    const input = getByRole(dialog, "searchbox")
    fireEvent.input(input, { target: { value: "Warbreaker" } })
    await vi.advanceTimersByTimeAsync(250)
    fireEvent.click(getByRole(dialog, "button", { name: /close search/i }))
    expect(signal?.aborted).toBe(true)

    const reopened = await open()
    expect(getByRole(reopened, "searchbox")).toHaveValue("")
    expect(getByText(reopened, /search across all published content/i)).toBeInTheDocument()
  })
})
