import { bindPreferenceOnce } from "./preferences"

const pendingCopies = new Map<HTMLButtonElement, AbortController>()

function setStatus(button: HTMLButtonElement, message: string) {
  if (!button.isConnected) return
  const status = button.closest<HTMLElement>("[data-markdown-copy]")?.querySelector<HTMLElement>("[data-markdown-copy-status]")
  if (status) status.textContent = message
}

function ownsCopy(button: HTMLButtonElement, controller: AbortController) {
  return button.isConnected && !controller.signal.aborted && pendingCopies.get(button) === controller
}

async function copyMarkdown(button: HTMLButtonElement) {
  const url = button.dataset.markdownUrl
  if (!url || !navigator.clipboard?.writeText) {
    setStatus(button, "Couldn’t copy Markdown. Open the Markdown file instead.")
    return
  }

  if (pendingCopies.has(button)) return
  const controller = new AbortController()
  pendingCopies.set(button, controller)
  button.disabled = true
  setStatus(button, "Copying Markdown…")
  try {
    const response = await fetch(url, { headers: { Accept: "text/markdown" }, signal: controller.signal })
    if (!response.ok) throw new Error(`Markdown request failed (${response.status})`)
    const markdown = await response.text()
    if (!ownsCopy(button, controller)) return
    await navigator.clipboard.writeText(markdown)
    if (!ownsCopy(button, controller)) return
    setStatus(button, "Markdown copied.")
  } catch {
    if (ownsCopy(button, controller)) setStatus(button, "Couldn’t copy Markdown. Open the Markdown file instead.")
  } finally {
    if (pendingCopies.get(button) === controller) {
      pendingCopies.delete(button)
      if (button.isConnected) button.disabled = false
    }
  }
}

export function cancelMarkdownCopies() {
  for (const controller of pendingCopies.values()) controller.abort()
  pendingCopies.clear()
}

export function initializeMarkdownCopy() {
  bindPreferenceOnce("markdown-copy", () => {
    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return
      const button = event.target.closest<HTMLButtonElement>("[data-markdown-copy-button]")
      if (!button) return
      void copyMarkdown(button)
    })
    document.addEventListener("astro:before-swap", cancelMarkdownCopies)
  })
}

initializeMarkdownCopy()
