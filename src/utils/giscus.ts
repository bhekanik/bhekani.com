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

function appendGiscus(container: HTMLElement) {
  container.replaceChildren()

  const script = container.ownerDocument.createElement("script")
  const theme = container.ownerDocument.documentElement.classList.contains("dark") ? "dark" : "light"

  for (const [key, value] of Object.entries({
    ...giscusAttributes,
    "data-theme": theme,
  })) {
    script.setAttribute(key, value)
  }

  script.async = true
  container.append(script)
}

export function initializeGiscus(root: Document = document) {
  const containers = Array.from(root.querySelectorAll<HTMLElement>("[data-giscus-container]"))

  containers.forEach(appendGiscus)

  return () => {
    containers.forEach((container) => container.replaceChildren())
  }
}
