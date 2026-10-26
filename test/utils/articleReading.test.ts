import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  buildTableOfContents,
  formatPostDateUtc,
  initializeArticleReading,
} from "../../src/utils/articleReading"
import { initializeGiscus } from "../../src/utils/giscus"

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
  let triggerIntersection: ((target: Element) => void) | undefined

  beforeEach(() => {
    triggerIntersection = undefined
    document.body.innerHTML = `
      <div id="reading-progress"></div>
      <article data-article-reading>
        <details data-article-contents open><summary>Contents</summary><a class="toc-link" href="#first">Mobile First</a></details>
        <div data-reading-body class="prose"><h2 id="first">First</h2></div>
        <aside><a class="toc-link" href="#first">Rail First</a></aside>
      </article>
    `
    observe.mockClear()
    disconnect.mockClear()
    class MockIntersectionObserver implements IntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        triggerIntersection = (target) => {
          const bounds = new DOMRect()
          callback([{
            boundingClientRect: bounds,
            intersectionRatio: 1,
            intersectionRect: bounds,
            isIntersecting: true,
            rootBounds: null,
            target,
            time: 0,
          }], this)
        }
      }

      root = null
      rootMargin = "0px 0px 0px 0px"
      scrollMargin = "0px 0px 0px 0px"
      thresholds = []

      disconnect() {
        disconnect()
      }

      observe(target: Element) {
        observe(target)
      }

      takeRecords() {
        return []
      }

      unobserve() {}
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("keeps a short article's progress bounded and cleans all page-owned work", () => {
    const readingBody = document.querySelector<HTMLElement>("[data-reading-body]")!
    vi.spyOn(readingBody, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 0, 100))

    const cleanup = initializeArticleReading()
    const progress = document.getElementById("reading-progress")!

    expect(progress.style.width).toBe("0%")
    expect(observe).toHaveBeenCalledWith(document.getElementById("first"))

    document.querySelector<HTMLAnchorElement>(".toc-link")!.click()
    expect(document.querySelector<HTMLDetailsElement>("details")!.open).toBe(false)

    cleanup()

    expect(disconnect).toHaveBeenCalledOnce()
  })

  it("continues to initialize when IntersectionObserver is unavailable", () => {
    vi.stubGlobal("IntersectionObserver", undefined)

    const cleanup = initializeArticleReading()

    expect(document.getElementById("reading-progress")?.style.width).toBe("0%")
    cleanup()
  })

  it("marks duplicate narrow and wide table-of-contents links active together", () => {
    const cleanup = initializeArticleReading()

    triggerIntersection?.(document.getElementById("first")!)

    const tocLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".toc-link"))
    expect(tocLinks).toHaveLength(2)
    tocLinks.forEach((link) => {
      expect(link).toHaveClass("toc-active")
      expect(link).toHaveAttribute("aria-current", "location")
    })

    cleanup()
  })

  it("reaches completion at the end of reading body regardless of footer height", () => {
    const article = document.querySelector<HTMLElement>("article")!
    const readingBody = document.querySelector<HTMLElement>("[data-reading-body]")!
    vi.stubGlobal("innerHeight", 200)
    vi.stubGlobal("scrollY", 900)
    let footerHeight = 10000
    vi.spyOn(article, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, -800, 0, footerHeight))
    vi.spyOn(readingBody, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, 100 - window.scrollY, 0, 1000))

    const cleanup = initializeArticleReading()
    window.dispatchEvent(new Event("scroll"))

    expect(document.getElementById("reading-progress")?.style.width).toBe("100%")

    footerHeight = 100000
    window.dispatchEvent(new Event("scroll"))
    expect(document.getElementById("reading-progress")?.style.width).toBe("100%")

    cleanup()
  })
})

describe("Giscus lifecycle", () => {
  it("initializes a non-article consumer and cleans its mount", () => {
    document.body.innerHTML = '<main data-book-page><div data-giscus-container></div></main>'
    const container = document.querySelector<HTMLElement>("[data-giscus-container]")!
    const append = vi.spyOn(container, "append").mockImplementation(() => container)

    const cleanup = initializeGiscus()

    expect(append).toHaveBeenCalledOnce()
    container.replaceChildren(document.createElement("span"))
    cleanup()
    expect(container.childElementCount).toBe(0)
  })
})
