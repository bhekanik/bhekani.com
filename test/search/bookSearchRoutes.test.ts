import { describe, expect, it } from "vitest"
import { canonicalizeBookSearchResults, createBookSearchRoutes } from "../../src/utils/bookSearchRoutes"

describe("book search routes", () => {
  const routes = createBookSearchRoutes([
    { id: "warbreaker-warbreaker-1", data: { id: 42 } },
    { id: "cien-anos-de-soledad", data: { id: 43 } },
  ])

  it("uses the Astro entry ID for keyword and stale vector book results", () => {
    const keywordResult = {
      id: "book-42",
      type: "book" as const,
      title: "Warbreaker",
      slug: "/books/warbreaker-warbreaker 1",
      score: 1,
    }
    const vectorResult = {
      id: "book-43",
      type: "book" as const,
      title: "Cien anos de soledad",
      slug: "/books/cien años de soledad",
      score: 0.93,
    }

    expect(canonicalizeBookSearchResults([keywordResult], routes)).toEqual([
      { ...keywordResult, slug: "/books/warbreaker-warbreaker-1/" },
    ])
    expect(canonicalizeBookSearchResults([vectorResult], routes)).toEqual([
      { ...vectorResult, slug: "/books/cien-anos-de-soledad/" },
    ])
  })

  it("preserves non-book results, ranking fields, and result order", () => {
    const results = [
      { id: "project-mxr", type: "project" as const, title: "mxr", slug: "https://mxr.sh", score: 1 },
      { id: "book-42", type: "book" as const, title: "Warbreaker", slug: "/books/old", score: 0.5 },
    ]

    expect(canonicalizeBookSearchResults(results, routes)).toEqual([
      results[0],
      { ...results[1], slug: "/books/warbreaker-warbreaker-1/" },
    ])
  })

  it("does not navigate unknown or ambiguous book identities to provider supplied URLs", () => {
    const duplicateRoutes = createBookSearchRoutes([
      { id: "one", data: { id: 99 } },
      { id: "two", data: { id: 99 } },
    ])
    const results = [
      { id: "constructor", type: "book" as const, title: "Unknown", slug: "https://example.invalid", score: 1 },
      { id: "book-99", type: "book" as const, title: "Duplicate", slug: "/books/one", score: 0.5 },
    ]

    expect(duplicateRoutes).toEqual(new Map())
    expect(canonicalizeBookSearchResults(results, routes)).toEqual([
      { ...results[0], slug: "" },
      { ...results[1], slug: "" },
    ])
  })
})
