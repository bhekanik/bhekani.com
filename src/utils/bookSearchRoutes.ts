export interface BookSearchEntry {
  id: string
  data: {
    id: number
  }
}

interface SearchResultWithDestination {
  id: string
  type: string
  slug: string
}

export function createBookSearchRoutes(entries: Iterable<BookSearchEntry>): Map<string, string> {
  const routes = new Map<string, string>()
  const ambiguousIds = new Set<string>()

  for (const entry of entries) {
    const searchId = `book-${entry.data.id}`

    if (ambiguousIds.has(searchId)) continue

    if (routes.has(searchId)) {
      routes.delete(searchId)
      ambiguousIds.add(searchId)
      continue
    }

    routes.set(searchId, `/books/${entry.id}/`)
  }

  return routes
}

export function canonicalizeBookSearchResults<T extends SearchResultWithDestination>(
  results: T[],
  bookRoutes: ReadonlyMap<string, string>,
): T[] {
  return results.map((result) => {
    if (result.type !== "book") return result

    return { ...result, slug: bookRoutes.get(result.id) ?? "" }
  })
}
