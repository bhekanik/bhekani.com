export const SEARCH_TYPES = ["post", "micro", "book", "project"] as const

export type SearchType = (typeof SEARCH_TYPES)[number]

export interface SearchIndexItem {
  id: string
  type: SearchType
  title: string
  slug: string
  description?: string
  searchText: string
}

export interface SearchResult extends Omit<SearchIndexItem, "searchText"> {
  score: number
}

/**
 * The same deliberately small tokenizer is used for the deployment-local
 * projection and every request.  It keeps letters and numbers from every
 * Unicode script while treating punctuation as a term boundary.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
}

export function searchTerms(value: string): string[] {
  const normalized = normalizeSearchText(value)
  return normalized === "" ? [] : normalized.split(" ")
}

export function hasMeaningfulSearchText(value: string): boolean {
  return Array.from(normalizeSearchText(value).replaceAll(" ", "")).length >= 2
}

export function keywordSearch(query: string, index: readonly SearchIndexItem[]): SearchResult[] {
  const terms = searchTerms(query)
  if (terms.length === 0) return []

  return index
    .map((item) => {
      const itemTerms = new Set(searchTerms(item.searchText))
      const titleTerms = new Set(searchTerms(item.title))
      const title = normalizeSearchText(item.title)
      const matchedTerms = terms.filter((term) => itemTerms.has(term)).length
      const matchedTitleTerms = terms.filter((term) => titleTerms.has(term)).length

      return {
        ...item,
        score: matchedTerms / terms.length,
        matchedTerms,
        matchedTitleTerms,
        exactTitle: title === terms.join(" "),
      }
    })
    .filter((result) => result.matchedTerms > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (Number(b.exactTitle) !== Number(a.exactTitle)) return Number(b.exactTitle) - Number(a.exactTitle)
      if (b.matchedTitleTerms !== a.matchedTitleTerms) return b.matchedTitleTerms - a.matchedTitleTerms
      return a.id.localeCompare(b.id)
    })
    .map(({ matchedTerms: _matchedTerms, matchedTitleTerms: _matchedTitleTerms, exactTitle: _exactTitle, ...result }) => result)
}

// Reciprocal Rank Fusion preserves the established hybrid ranking behavior.
export function fuseResults(vectorResults: readonly SearchResult[], keywordResults: readonly SearchResult[], k = 60): SearchResult[] {
  const scores = new Map<string, { score: number; item: SearchResult }>()

  for (const [rank, item] of vectorResults.entries()) {
    scores.set(item.id, { score: 1 / (k + rank + 1), item })
  }

  for (const [rank, item] of keywordResults.entries()) {
    const rrfScore = 1 / (k + rank + 1)
    const existing = scores.get(item.id)
    if (existing) {
      existing.score += rrfScore
    } else {
      scores.set(item.id, { score: rrfScore, item })
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .map(({ item, score }) => ({ ...item, score }))
}

/** A stable, non-secret revision for diagnostics and client state ownership. */
export function searchRevision(index: readonly SearchIndexItem[]): string {
  let hash = 0x811c9dc5
  const source = [...index]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((item) => [item.id, item.type, item.title, item.slug, item.description ?? "", item.searchText].join("\u0000"))
    .join("\u0001")

  for (const character of source) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 0x01000193)
  }

  return `search-${(hash >>> 0).toString(16).padStart(8, "0")}`
}

export function canonicalizeSearchResults(
  results: readonly SearchResult[],
  localIndex: readonly SearchIndexItem[],
): SearchResult[] {
  const localById = new Map(localIndex.map((item) => [item.id, item]))
  const seen = new Set<string>()
  const canonicalResults: SearchResult[] = []

  for (const result of results) {
    const local = localById.get(result.id)
    if (!local || seen.has(local.id)) continue

    seen.add(local.id)
    canonicalResults.push({
      id: local.id,
      type: local.type,
      title: local.title,
      slug: local.slug,
      description: local.description,
      score: result.score,
    })
  }

  return canonicalResults
}

export function isSafeExternalUrl(value: string | undefined): value is string {
  if (!value) return false

  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
