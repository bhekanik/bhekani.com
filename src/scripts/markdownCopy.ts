import { bindPreferenceOnce } from "./preferences"

function setStatus(button: HTMLButtonElement, message: string) {
  const status = button.closest<HTMLElement>("[data-markdown-copy]")?.querySelector<HTMLElement>("[data-markdown-copy-status]")
  if (status) status.textContent = message
}

async function copyMarkdown(button: HTMLButtonElement) {
  const url = button.dataset.markdownUrl
  if (!url || !navigator.clipboard?.writeText) {
    setStatus(button, "Couldn’t copy Markdown. Open the Markdown file instead.")
    return
  }

  button.disabled = true
  setStatus(button, "Copying Markdown…")
  try {
    const response = await fetch(url, { headers: { Accept: "text/markdown" } })
    if (!response.ok) throw new Error(`Markdown request failed (${response.status})`)
    await navigator.clipboard.writeText(await response.text())
    setStatus(button, "Markdown copied.")
  } catch {
    setStatus(button, "Couldn’t copy Markdown. Open the Markdown file instead.")
  } finally {
    button.disabled = false
  }
}

if (typeof document !== "undefined") {
  bindPreferenceOnce("markdown-copy", () => document.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>("[data-markdown-copy-button]")
    if (!button) return
    void copyMarkdown(button)
  }))
}
