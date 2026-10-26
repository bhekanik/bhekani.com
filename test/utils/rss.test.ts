import { describe, expect, it } from "vitest"
import rss from "@astrojs/rss"
import { createPostDescription, createRssItems } from "../../src/utils/rss"
import { historicalRssGuids } from "../fixtures/rss-history"

const makePost = (
  overrides: Record<string, any> = {},
  topLevel: Record<string, any> = {},
) =>
  ({
    id: "example-post",
    body: "# Heading\n\nThis is body content with **markdown** and [a link](https://example.com).",
    ...topLevel,
    data: {
      title: "Example Post",
      pubDate: new Date("2026-03-10T10:00:00.000Z"),
      description: undefined,
      published: true,
      ...overrides,
    },
  }) as any

describe("rss utils", () => {
  it("prefers explicit post descriptions", () => {
    const post = makePost({ description: "Custom description" })
    expect(createPostDescription(post)).toBe("Custom description")
  })

  it("builds descriptions from markdown body when missing", () => {
    const post = makePost()
    expect(createPostDescription(post)).toContain("This is body content")
    expect(createPostDescription(post)).not.toContain("[")
  })

  it("strips HTML/JSX tags and MDX imports from body descriptions", () => {
    const mdxBody = [
      'import Quote from "../components/Quote.astro";',
      "",
      "This is MDX content that should appear in the description.",
      "",
      "<Quote />",
      "<iframe src='https://example.com'></iframe>",
    ].join("\n")

    const post = makePost({}, { body: mdxBody })
    const description = createPostDescription(post)

    expect(description).toContain("This is MDX content that should appear in the description.")
    expect(description).not.toContain("import ")
    expect(description).not.toContain("<Quote")
    expect(description).not.toContain("<iframe")
  })

  it("creates rss items from published posts sorted newest first", () => {
    const newest = makePost(
      { title: "Newest", pubDate: new Date("2026-03-11T10:00:00.000Z") },
      { id: "newest-post" },
    )
    const older = makePost(
      { title: "Older", pubDate: new Date("2026-03-01T10:00:00.000Z") },
      { id: "older-post" },
    )
    const draft = makePost({ title: "Draft", published: false }, { id: "draft-post" })

    const items = createRssItems([older, draft, newest])

    expect(items).toHaveLength(2)
    expect(items[0]!.title).toBe("Newest")
    expect(items[0]!.link).toBe("/posts/newest-post/")
    expect(items[0]!.customData).toContain("https://bhekani.com/posts/newest-post/")
    expect(items[1]!.link).toBe("/posts/older-post/")
  })

  it("keeps historical GUIDs while publishing navigable links on www", async () => {
    const posts = historicalRssGuids.map((guid, index) =>
      makePost(
        { pubDate: new Date(`2026-01-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`) },
        { id: guid.split("/").at(-2) },
      ),
    )
    const response = await rss({
      title: "Bhekani.com | Blog",
      description: "Random things I learn",
      site: "https://www.bhekani.com",
      items: createRssItems(posts),
    })
    const document = new DOMParser().parseFromString(await response.text(), "application/xml")

    expect(Array.from(document.querySelectorAll("item > link"), (link) => link.textContent)).toEqual(
      posts
        .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
        .map((post) => `https://www.bhekani.com/posts/${post.id}/`),
    )
    expect(Array.from(document.querySelectorAll("item > guid"), (guid) => guid.textContent)).toEqual(
      [...historicalRssGuids].reverse(),
    )
  })
})
