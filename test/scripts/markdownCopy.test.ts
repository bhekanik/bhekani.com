import { afterEach, describe, expect, it, vi } from "vitest"
import { cancelMarkdownCopies, initializeMarkdownCopy } from "../../src/scripts/markdownCopy"

function render(url = "/posts/example.md") {
  document.body.innerHTML = `<div data-markdown-copy><button data-markdown-copy-button data-markdown-url="${url}">Copy</button><a href="${url}">Open Markdown</a><span data-markdown-copy-status></span></div>`
  return document.querySelector<HTMLButtonElement>("button")!
}

function clipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } })
  return writeText
}

afterEach(() => {
  cancelMarkdownCopies()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe("Markdown copy controls", () => {
  it("copies the exact successful export bytes", async () => {
    const writeText = clipboard()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("# Exact\n\n```ts\n<Code />\n```")))
    render().click()
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("# Exact\n\n```ts\n<Code />\n```"))
    expect(document.querySelector("[data-markdown-copy-status]")?.textContent).toBe("Markdown copied.")
  })

  it("keeps each pending button to one fetch even when clicked again", async () => {
    const writeText = clipboard()
    let release: (response: Response) => void = () => {}
    const fetch = vi.fn(() => new Promise<Response>((resolve) => { release = resolve }))
    vi.stubGlobal("fetch", fetch)
    const button = render()
    button.click()
    button.click()
    expect(fetch).toHaveBeenCalledTimes(1)
    release(new Response("one"))
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("one"))
  })

  it.each([
    ["fetch failure", () => Promise.reject(new Error("offline"))],
    ["clipboard denial", () => Promise.resolve(new Response("markdown"))],
  ])("shows the ordinary-link fallback after %s", async (label, response) => {
    const writeText = label === "clipboard denial" ? vi.fn().mockRejectedValue(new Error("denied")) : clipboard()
    if (label === "clipboard denial") clipboard(writeText)
    vi.stubGlobal("fetch", vi.fn(response))
    render().click()
    await vi.waitFor(() => expect(document.querySelector("[data-markdown-copy-status]")?.textContent).toContain("Open the Markdown file"))
  })

  it("shows the ordinary-link fallback when Clipboard is unavailable", () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined })
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    render().click()
    expect(fetch).not.toHaveBeenCalled()
    expect(document.querySelector("[data-markdown-copy-status]")?.textContent).toContain("Open the Markdown file")
  })

  it("aborts stale work on swap while a new control can copy", async () => {
    const writeText = clipboard()
    let releaseOld: (response: Response) => void = () => {}
    const fetch = vi.fn((url: string) => url === "/old.md"
      ? new Promise<Response>((resolve) => { releaseOld = resolve })
      : Promise.resolve(new Response("new")))
    vi.stubGlobal("fetch", fetch)
    render("/old.md").click()
    document.dispatchEvent(new Event("astro:before-swap"))
    const newButton = render("/new.md")
    newButton.click()
    releaseOld(new Response("old"))
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("new"))
    expect(writeText).toHaveBeenCalledTimes(1)
  })

  it("keeps one delegated handler through repeated initialization", async () => {
    const writeText = clipboard()
    const fetch = vi.fn().mockResolvedValue(new Response("one"))
    vi.stubGlobal("fetch", fetch)
    initializeMarkdownCopy()
    initializeMarkdownCopy()
    render().click()
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
