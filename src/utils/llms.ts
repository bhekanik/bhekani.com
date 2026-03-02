/**
 * Utilities for cleaning MDX/markdown content for llms.txt output.
 */

/** Strip import statements */
function stripImports(content: string): string {
  return content.replace(/^import\s+.*$/gm, "")
}

/** Convert <Quote quote="..." reference="..." /> to markdown blockquote */
function convertQuotes(content: string): string {
  // Handle quote="..." with optional reference="..."
  const quoteAttrPattern =
    /<Quote\s+quote="([^"]+)"(?:\s+reference="([^"]+)")?\s*\/>/gs
  content = content.replace(quoteAttrPattern, (_match, quote, reference) => {
    const lines = (quote as string)
      .split("\\n")
      .map((line: string) => `> ${line}`)
      .join("\n")
    if (reference) {
      return `${lines}\n> — ${reference}`
    }
    return lines
  })

  // Handle quote={`...`} with optional reference="..."
  const quoteTemplateLitPattern =
    /<Quote\s+quote=\{`([^`]+)`\}(?:\s+reference="([^"]+)")?\s*\/>/gs
  content = content.replace(
    quoteTemplateLitPattern,
    (_match, quote, reference) => {
      const lines = (quote as string)
        .split("\n")
        .map((line: string) => `> ${line.trim()}`)
        .filter((line: string) => line !== "> ")
        .join("\n")
      if (reference) {
        return `${lines}\n> — ${reference}`
      }
      return lines
    }
  )

  return content
}

/** Convert <iframe> YouTube embeds to markdown links */
function convertIframes(content: string): string {
  return content.replace(
    /<iframe[^>]*src="([^"]*youtube[^"]*)"[^>]*title="([^"]*)"[^>]*\/?\s*>/gi,
    (_match, url, title) => `[${title || "YouTube video"}](${url})`
  )
}

/** Strip any remaining HTML/JSX tags */
function stripHtmlTags(content: string): string {
  return content.replace(/<\/?[a-zA-Z][^>]*\/?>/g, "")
}

/** Clean MDX content to plain markdown */
export function cleanMdxContent(content: string): string {
  let cleaned = content
  cleaned = stripImports(cleaned)
  cleaned = convertQuotes(cleaned)
  cleaned = convertIframes(cleaned)
  cleaned = stripHtmlTags(cleaned)
  // Collapse 3+ consecutive blank lines to 2
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n")
  return cleaned.trim()
}

/** Format a date as YYYY-MM-DD */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0] as string
}
