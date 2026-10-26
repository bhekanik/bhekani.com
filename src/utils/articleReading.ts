export type ArticleHeading = {
  depth: number
  slug: string
  text: string
}

export type TableOfContentsHeading = ArticleHeading & {
  subheadings: TableOfContentsHeading[]
}

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

export function initializeArticleReading(root: Document = document) {
  const article = root.querySelector<HTMLElement>("[data-article-reading]")
  const readingBody = article?.querySelector<HTMLElement>("[data-reading-body]")
  const progress = root.getElementById("reading-progress")

  if (!article) return () => undefined

  const tocLinksById = new Map<string, HTMLAnchorElement[]>()
  article.querySelectorAll<HTMLAnchorElement>(".toc-link").forEach((link) => {
    const id = link.hash.slice(1)
    if (!id) return
    const links = tocLinksById.get(id) ?? []
    links.push(link)
    tocLinksById.set(id, links)
  })

  const setActiveSection = (id: string) => {
    tocLinksById.forEach((links, linkId) => {
      const isActive = linkId === id
      links.forEach((link) => {
        link.classList.toggle("toc-active", isActive)
        if (isActive) {
          link.setAttribute("aria-current", "location")
        } else {
          link.removeAttribute("aria-current")
        }
      })
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
    if (!progress || !readingBody) return

    const bodyBounds = readingBody.getBoundingClientRect()
    const bodyStart = window.scrollY + bodyBounds.top
    const scrollableHeight = bodyBounds.height - window.innerHeight
    const scrolled = window.scrollY - bodyStart
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
  }
}
