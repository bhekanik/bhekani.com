import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  buildTableOfContents,
  formatPostDateUtc,
  initializeArticleReading,
} from "../../src/utils/articleReading"

describe("article reading helpers", () => {
  it("formats publication dates in UTC regardless of the local timezone", () => {
    expect(formatPostDateUtc(new Date("2026-02-10T00:00:00.000Z"))).toBe(
      "February 10, 2026",
    )
  })

  it("keeps a leading h3 visible when an article has no preceding h2", () => {
    const toc = buildTableOfContents([
      { depth: 3, slug: "first-detail", text: "First detail" },
      { depth: 2, slug: "main-section", text: "Main section" },
      { depth: 3, slug: "nested-detail", text: "Nested detail" },
    ])

    expect(toc).toEqual([
      {
        depth: 3,
        slug: "first-detail",
        text: "First detail",
        subheadings: [],
      },
      {
        depth: 2,
        slug: "main-section",
        text: "Main section",
        subheadings: [
          {
            depth: 3,
            slug: "nested-detail",
            text: "Nested detail",
            subheadings: [],
          },
        ],
      },
    ])
  })
})

describe("article reading lifecycle", () => {
  const observe = vi.fn()
  const disconnect = vi.fn()

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="reading-progress"></div>
      <article data-article-reading>
        <details data-article-contents open><summary>Contents</summary><a class="toc-link" href="#first">First</a></details>
        <div class="prose"><h2 id="first">First</h2></div>
        <div data-giscus-container></div>
      </article>
    `
    observe.mockClear()
    disconnect.mockClear()
    class MockIntersectionObserver {
      observe = observe
      disconnect = disconnect
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
  })

  it("keeps a short article's progress bounded and cleans all page-owned work", () => {
    const article = document.querySelector<HTMLElement>("article")!
    const giscus = document.querySelector<HTMLElement>("[data-giscus-container]")!
    const append = vi.spyOn(giscus, "append").mockImplementation(() => giscus)
    vi.spyOn(article, "getBoundingClientRect").mockReturnValue({
      top: 0,
      height: 100,
    } as DOMRect)

    const cleanup = initializeArticleReading()
    const progress = document.getElementById("reading-progress")!

    expect(progress.style.width).toBe("0%")
    expect(observe).toHaveBeenCalledWith(document.getElementById("first"))
    expect(append).toHaveBeenCalledOnce()

    document.querySelector<HTMLAnchorElement>(".toc-link")!.click()
    expect(document.querySelector<HTMLDetailsElement>("details")!.open).toBe(false)

    cleanup()

    expect(disconnect).toHaveBeenCalledOnce()
    expect(giscus.childElementCount).toBe(0)
  })

  it("continues to initialize when IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined)
    const giscus = document.querySelector<HTMLElement>("[data-giscus-container]")!
    vi.spyOn(giscus, "append").mockImplementation(() => giscus)

    const cleanup = initializeArticleReading()

    expect(giscus.append).toHaveBeenCalledOnce()
    cleanup()
  })
})
