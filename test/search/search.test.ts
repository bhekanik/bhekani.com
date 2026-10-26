import { describe, expect, it } from "vitest"
import { canonicalizeSearchResults, keywordSearch, normalizeSearchText, searchTerms, type SearchIndexItem } from "../../src/utils/search"
import { createSearchProjection } from "../../src/utils/searchProjection"

const index: SearchIndexItem[] = [
  { id: "book-1", type: "book", title: "Warbreaker", slug: "/books/warbreaker-warbreaker-1/", description: "by Brandon Sanderson", searchText: "Warbreaker Brandon Sanderson fantasy" },
  { id: "project-mxr", type: "project", title: "mxr", slug: "https://mxr.sh", description: "Local-first email", searchText: "mxr agent first local first email Rust" },
  { id: "project-blah", type: "project", title: "blah.chat", slug: "https://blah.chat", description: "Chat", searchText: "blah chat project" },
  { id: "post-next", type: "post", title: "Next.js without ceremony", slug: "/posts/next-js", description: "A guide", searchText: "Next.js guide JavaScript" },
  { id: "post-cafe", type: "post", title: "Café notes", slug: "/posts/cafe", description: "Accents", searchText: "Café notes résumé" },
]

describe("search normalization and ranking", () => {
  it.each([
    ["Next.js", "next js"], ["blah.chat", "blah chat"], ["Café", "cafe"], ["reader's notes", "reader s notes"],
    ["well-being", "well being"], ["  many\nspaces  ", "many spaces"], ["！！！", ""],
  ])("normalizes %j", (value, expected) => expect(normalizeSearchText(value)).toBe(expected))

  it("does not make punctuation-only input meaningful", () => expect(searchTerms("—?!")).toEqual([]))

  it("keeps exact title matches ahead of vague matches and breaks ties by identity", () => {
    const results = keywordSearch("Warbreaker", [...index, { id: "post-warbreaker", type: "post", title: "A Warbreaker note", slug: "/posts/warbreaker", searchText: "Warbreaker" }])
    expect(results.map((result) => result.id).slice(0, 2)).toEqual(["book-1", "post-warbreaker"])
  })

  it.each([
    ["warbreaker", "book-1", "/books/warbreaker-warbreaker-1/"], ["brandon", "book-1", "/books/warbreaker-warbreaker-1/"],
    ["fantasy", "book-1", "/books/warbreaker-warbreaker-1/"], ["mxr", "project-mxr", "https://mxr.sh"],
    ["agent", "project-mxr", "https://mxr.sh"], ["email", "project-mxr", "https://mxr.sh"], ["rust", "project-mxr", "https://mxr.sh"],
    ["blah.chat", "project-blah", "https://blah.chat"], ["blah", "project-blah", "https://blah.chat"], ["chat", "project-blah", "https://blah.chat"],
    ["Next.js", "post-next", "/posts/next-js"], ["javascript", "post-next", "/posts/next-js"], ["guide", "post-next", "/posts/next-js"],
    ["café", "post-cafe", "/posts/cafe"], ["resume", "post-cafe", "/posts/cafe"], ["notes", "post-cafe", "/posts/cafe"],
    ["local first", "project-mxr", "https://mxr.sh"], ["agent first", "project-mxr", "https://mxr.sh"],
    ["Brandon Sanderson", "book-1", "/books/warbreaker-warbreaker-1/"], ["no-match", undefined, undefined],
  ])("returns the reviewed fixture destination for %s", (query, id, slug) => {
    const result = keywordSearch(query, index)[0]
    expect(result?.id).toBe(id)
    expect(result?.slug).toBe(slug)
  })

  it("replaces stale provider metadata with local published identities and drops unknown hits", () => {
    expect(canonicalizeSearchResults([
      { id: "book-1", type: "book", title: "Old title", slug: "https://attacker.invalid", score: 0.9 },
      { id: "book-deleted", type: "book", title: "Deleted", slug: "/books/deleted", score: 0.8 },
      { id: "project-mxr", type: "post", title: "Wrong type", slug: "javascript:alert(1)", score: 0.7 },
    ], index)).toEqual([
      { id: "book-1", type: "book", title: "Warbreaker", slug: "/books/warbreaker-warbreaker-1/", description: "by Brandon Sanderson", score: 0.9 },
      { id: "project-mxr", type: "project", title: "mxr", slug: "https://mxr.sh", description: "Local-first email", score: 0.7 },
    ])
  })
})

describe("Astro search projection", () => {
  it("uses actual entry identities, excludes drafts and book bodies, and only permits http(s) project URLs", () => {
    const projection = createSearchProjection({
      posts: [{ id: "published-post", body: "Searchable public post body", data: { title: "Published", description: "Summary", published: true, tags: ["Writing"] } }, { id: "draft-post", body: "Must not appear", data: { title: "Draft", published: false, tags: [] } }],
      micro: [{ id: "published-micro", body: "A short public thought", data: { title: "Micro", published: true } }],
      projects: [{ id: "mxr", data: { title: "mxr", description: "Mail", published: true, tech: ["Rust"], url: "https://mxr.sh" } }, { id: "unsafe", data: { title: "Unsafe", published: true, tech: [], url: "javascript:alert(1)" } }],
      books: [{ id: "warbreaker-warbreaker-1", body: "PRIVATE NOTE: never index", data: { id: 1, title: "Warbreaker", author: "Brandon Sanderson", tags: ["fantasy"] } }],
    })
    expect(projection.index.map((item) => item.id)).toEqual(["book-1", "micro-published-micro", "post-published-post", "project-mxr", "project-unsafe"])
    expect(projection.index.find((item) => item.id === "book-1")).toMatchObject({ slug: "/books/warbreaker-warbreaker-1/" })
    expect(projection.index.find((item) => item.id === "book-1")?.searchText).not.toContain("private")
    expect(projection.index.find((item) => item.id === "project-unsafe")).toMatchObject({ slug: "/projects" })
    expect(projection.revision).toMatch(/^search-[a-f0-9]{8}$/)
  })
})
