import { readdirSync, readFileSync } from "node:fs"
import { extname, join, parse } from "node:path"
import { z, type output, type ZodType } from "astro/zod"
import matter from "gray-matter"
import { describe, expect, it } from "vitest"
import { keywordSearch } from "../../src/utils/search"
import { createSearchProjection, type SearchCollections } from "../../src/utils/searchProjection"

const postDataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  published: z.boolean(),
  tags: z.array(z.string()),
})
const microDataSchema = z.object({ title: z.string(), published: z.boolean() })
const projectDataSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  published: z.boolean(),
  tech: z.array(z.string()),
  url: z.string().optional(),
})
const bookDataSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
})

type ProjectData = output<typeof projectDataSchema>
type Entry<T> = { id: string; body: string; data: T }
type MetadataFixture = readonly [id: string, title: string, slug: string, description?: string]
type QueryFixture = readonly [query: string, id: string, slug: string]

const contentRoot = join(process.cwd(), "src/content")

function astroContentId(file: string): string {
  // This source-fixture adapter mirrors Astro's current entry-ID normalization.
  // Emitted static routes are verified separately by the deployment checks.
  return parse(file).name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
}

function markdownEntries<T>(collection: string, dataSchema: ZodType<T>): Entry<T>[] {
  const directory = join(contentRoot, collection)
  return readdirSync(directory)
    .filter((file) => [".md", ".mdx"].includes(extname(file)))
    .map((file) => {
      const source = readFileSync(join(directory, file), "utf8")
      const parsed = matter(source)
      return { id: astroContentId(file), body: parsed.content, data: dataSchema.parse(parsed.data) }
    })
}

function projectEntries(): Entry<ProjectData>[] {
  const directory = join(contentRoot, "projects")
  return readdirSync(directory)
    .filter((file) => extname(file) === ".json")
    .map((file) => ({
      id: astroContentId(file),
      body: "",
      data: projectDataSchema.parse(JSON.parse(readFileSync(join(directory, file), "utf8"))),
    }))
}

const collections: SearchCollections = {
  posts: markdownEntries("posts", postDataSchema),
  micro: markdownEntries("micro", microDataSchema),
  projects: projectEntries(),
  books: markdownEntries("books", bookDataSchema),
}
const projection = createSearchProjection(collections)

describe("published site search projection", () => {
  it("preserves routes for a representative set of actual published titles, authors, and projects", () => {
    const expected: MetadataFixture[] = [
      ["post-building-an-llm-model-router-lessons-from-the-wild", "Building an LLM Model Router: Lessons From the Wild", "/posts/building-an-llm-model-router-lessons-from-the-wild"],
      ["post-mlops-vs-llmops", "What does it actually mean to run AI in production?", "/posts/mlops-vs-llmops"],
      ["post-writing-is-thinking", "Writing is Thinking", "/posts/writing-is-thinking"],
      ["post-useful-tools", "(Potentially) Useful tools", "/posts/useful-tools"],
      ["post-why-ai-needs-to-forget", "Why I Built AI That Forgets: A Tampa Trip Story", "/posts/why-ai-needs-to-forget"],
      ["micro-owning-my-own-reading-log", "Owning my own reading log", "/micro/owning-my-own-reading-log"],
      ["micro-1password-cli-for-secrets", "Using 1password CLI for secrets", "/micro/1password-cli-for-secrets"],
      ["micro-back-to-vscode", "I'm back on VSCode", "/micro/back-to-vscode"],
      ["micro-supabase-direct-url-with-connection-pooling", "Using connection pooled URL with Supabase and Prisma", "/micro/supabase-direct-url-with-connection-pooling"],
      ["project-mxr", "mxr", "https://mxr.sh"],
      ["project-blah-chat", "blah.chat", "https://blah.chat"],
      ["project-worthyourtime", "Worth Your Time", "https://worthyourtime.xyz"],
      ["project-reference-optimiser", "Reference Optimiser", "https://www.referenceoptimiser.com"],
      ["project-dealbase", "Dealbase Africa", "https://dealbase.africa"],
      ["project-spotuify", "spotuify", "https://spotuify.app"],
      ["book-1268479", "Warbreaker Warbreaker 1", "/books/warbreaker-warbreaker-1/", "by Brandon Sanderson"],
      ["book-106835", "The Intelligent Investor", "/books/the-intelligent-investor/", "by Benjamin Graham"],
      ["book-7165300", "The Black Prism Lightbringer 1", "/books/the-black-prism-lightbringer-1/", "by Brent Weeks"],
      ["book-20657436", "The 7 Habits of Highly Effective People Powerful Lessons in Personal Change", "/books/the-7-habits-of-highly-effective-people-powerful-lessons-in-personal-change/", "by Stephen R Covey"],
      ["book-26156469", "Never Split the Difference Negotiating As If Your Life Depended On It", "/books/never-split-the-difference-negotiating-as-if-your-life-depended-on-it/", "by Chris Voss"],
      ["book-1610908", "Thinking on Paper Refine Express and Actually Generate Ideas by Understanding the Processes of the Mind", "/books/thinking-on-paper-refine-express-and-actually-generate-ideas-by-understanding-the-processes-of-the-mind/", "by VA Howard"],
    ]

    for (const [id, title, slug, description] of expected) {
      const item = projection.index.find((candidate) => candidate.id === id)
      expect(item).toMatchObject({ title, slug })
      if (description) expect(item).toMatchObject({ description })
    }
  })

  it("returns reviewed source-backed queries within the ten-result API window", () => {
    const expected: QueryFixture[] = [
      ["building llm model router", "post-building-an-llm-model-router-lessons-from-the-wild", "/posts/building-an-llm-model-router-lessons-from-the-wild"],
      ["MLOps LLMOps", "post-mlops-vs-llmops", "/posts/mlops-vs-llmops"],
      ["writing thinking", "post-writing-is-thinking", "/posts/writing-is-thinking"],
      ["useful tools", "post-useful-tools", "/posts/useful-tools"],
      ["Tampa trip", "post-why-ai-needs-to-forget", "/posts/why-ai-needs-to-forget"],
      ["owning reading", "micro-owning-my-own-reading-log", "/micro/owning-my-own-reading-log"],
      ["1password secrets", "micro-1password-cli-for-secrets", "/micro/1password-cli-for-secrets"],
      ["VSCode", "micro-back-to-vscode", "/micro/back-to-vscode"],
      ["Supabase Prisma", "micro-supabase-direct-url-with-connection-pooling", "/micro/supabase-direct-url-with-connection-pooling"],
      ["mxr", "project-mxr", "https://mxr.sh"],
      ["Blah Chat", "project-blah-chat", "https://blah.chat"],
      ["Worth Your Time", "project-worthyourtime", "https://worthyourtime.xyz"],
      ["Reference Optimiser", "project-reference-optimiser", "https://www.referenceoptimiser.com"],
      ["Dealbase Africa", "project-dealbase", "https://dealbase.africa"],
      ["spotuify", "project-spotuify", "https://spotuify.app"],
      ["Brandon Sanderson", "book-1268479", "/books/warbreaker-warbreaker-1/"],
      ["Benjamin Graham", "book-106835", "/books/the-intelligent-investor/"],
      ["Brent Weeks", "book-7165300", "/books/the-black-prism-lightbringer-1/"],
      ["Stephen Covey", "book-20657436", "/books/the-7-habits-of-highly-effective-people-powerful-lessons-in-personal-change/"],
      ["Chris Voss", "book-26156469", "/books/never-split-the-difference-negotiating-as-if-your-life-depended-on-it/"],
      ["VA Howard", "book-1610908", "/books/thinking-on-paper-refine-express-and-actually-generate-ideas-by-understanding-the-processes-of-the-mind/"],
    ]

    for (const [query, id, slug] of expected) {
      expect(keywordSearch(query, projection.index).slice(0, 10)).toContainEqual(expect.objectContaining({ id, slug }))
    }
  })

  it("covers every current book identity through the handcrafted source-ID adapter", () => {
    const bookRoutes = new Map(
      collections.books.map((book) => [`book-${book.data.id}`, `/books/${book.id}/`]),
    )
    const projectedBookRoutes = new Map(
      projection.index
        .filter((item) => item.type === "book")
        .map((item) => [item.id, item.slug]),
    )

    expect(bookRoutes).toHaveLength(111)
    expect(projectedBookRoutes).toEqual(bookRoutes)
  })
})
