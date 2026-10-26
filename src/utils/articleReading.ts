export type ArticleHeading = {
  depth: number
  slug: string
  text: string
}

export type TableOfContentsHeading = ArticleHeading & {
  subheadings: TableOfContentsHeading[]
}

const giscusAttributes = {
  src: "https://giscus.app/client.js",
  "data-repo": "bhekanik/bhekani.com",
  "data-repo-id": "R_kgDOLA66VA",
  "data-category": "Announcements",
  "data-category-id": "DIC_kwDOLA66VM4CcV11",
  "data-mapping": "title",
  "data-strict": "0",
  "data-reactions-enabled": "1",
  "data-emit-metadata": "1",
  "data-input-position": "top",
  "data-lang": "en",
  "data-loading": "lazy",
  crossorigin: "anonymous",
} as const

export function formatPostDateUtc(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(date)
}

export function buildTableOfContents(headings: ArticleHeading[]) {
  const tableOfContents: TableOfContentsHeading[] = []
  let currentSection: TableOfContentsHeading | undefined

  for (const sourceHeading of headings) {
    if (sourceHeading.depth < 2 || sourceHeading.depth > 3) continue

    const heading: TableOfContentsHeading = {
      ...sourceHeading,
      subheadings: [],
    }

    if (heading.depth === 2 || !currentSection) {
      tableOfContents.push(heading)
      currentSection = heading.depth === 2 ? heading : undefined
      continue
    }

    currentSection.subheadings.push(heading)
  }

  return tableOfContents
}

function appendGiscus(container: HTMLElement) {
  container.replaceChildren()

  const ownerDocument = container.ownerDocument
  const script = ownerDocument.createElement("script")
  const theme = ownerDocument.documentElement.classList.contains("dark") ? "dark" : "light"

  for (const [key, value] of Object.entries({
    ...giscusAttributes,
    "data-theme": theme,
  })) {
    script.setAttribute(key, value)
  }

  script.async = true
  container.append(script)
}

export function initializeArticleReading(root: Document = document) {
  const article = root.querySelector<HTMLElement>("[data-article-reading]")
  const progress = root.getElementById("reading-progress")
  const giscusContainer = root.querySelector<HTMLElement>("[data-giscus-container]")

  if (!article) return () => undefined

  giscusContainer && appendGiscus(giscusContainer)

  const tocLinksById = new Map<string, HTMLAnchorElement>()
  article.querySelectorAll<HTMLAnchorElement>(".toc-link").forEach((link) => {
    const id = link.hash.slice(1)
    if (id) tocLinksById.set(id, link)
  })

  const setActiveSection = (id: string) => {
    tocLinksById.forEach((link, linkId) => {
      const isActive = linkId === id
      link.classList.toggle("toc-active", isActive)
      if (isActive) {
        link.setAttribute("aria-current", "location")
      } else {
        link.removeAttribute("aria-current")
      }
    })
  }

  const IntersectionObserver = window.IntersectionObserver
  const observer = IntersectionObserver && new IntersectionObserver(
    (entries) => {
      const active = entries.find((entry) => entry.isIntersecting)
      const id = active?.target.id
      if (id) setActiveSection(id)
    },
    { rootMargin: "-20% 0% -60% 0%" },
  )

  article.querySelectorAll<HTMLElement>("h2[id], h3[id]").forEach((heading) => {
    observer?.observe(heading)
  })

  let animationFrame: number | undefined
  const updateProgress = () => {
    animationFrame = undefined
    if (!progress) return

    const articleBounds = article.getBoundingClientRect()
    const articleStart = window.scrollY + articleBounds.top
    const scrollableHeight = articleBounds.height - window.innerHeight
    const scrolled = window.scrollY - articleStart
    const percentage = scrollableHeight <= 0
      ? (scrolled > 0 ? 100 : 0)
      : Math.min(100, Math.max(0, (scrolled / scrollableHeight) * 100))

    progress.style.width = `${percentage}%`
  }

  const scheduleProgressUpdate = () => {
    if (animationFrame === undefined) {
      animationFrame = window.requestAnimationFrame(updateProgress)
    }
  }

  window.addEventListener("scroll", scheduleProgressUpdate, { passive: true })
  updateProgress()

  const closeContents = (event: Event) => {
    const target = event.target
    if (!(target instanceof Element) || !target.closest(".toc-link")) return
    article.querySelectorAll<HTMLDetailsElement>("details[data-article-contents]").forEach((details) => {
      details.open = false
    })
  }

  article.addEventListener("click", closeContents)

  return () => {
    window.removeEventListener("scroll", scheduleProgressUpdate)
    if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame)
    observer?.disconnect()
    article.removeEventListener("click", closeContents)
    giscusContainer?.replaceChildren()
  }
}
