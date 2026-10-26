import { describe, expect, it } from "vitest"
import { createMicroMarkdown, createPostMarkdown } from "../../src/utils/markdownExports"

describe("Markdown exports", () => {
  it("preserves authored fences and canonical post identity while converting MDX", () => {
    const markdown = createPostMarkdown({
      id: "writing-is-thinking",
      body: [
        'import Quote from "../../components/Quote.astro"',
        "",
        '<Quote quote="Keep this." />',
        "",
        "```ts",
        "const literal = <Quote />",
        "```",
      ].join("\n"),
      data: {
        author: "Bhekani Khumalo",
        pubDate: new Date("2026-10-26T00:00:00.000Z"),
        tags: ["writing"],
        title: "Writing is thinking",
      },
    })

    expect(markdown).toContain("- **URL**: https://www.bhekani.com/posts/writing-is-thinking/")
    expect(markdown).toContain("> Keep this.")
    expect(markdown).toContain("const literal = <Quote />")
  })

  it("uses the established title fallback for a titleless Micro export", () => {
    const markdown = createMicroMarkdown({
      id: "titleless",
      body: "A short note.",
      data: { date: new Date("2026-10-26T00:00:00.000Z") },
    })

    expect(markdown).toContain("# Micro note — October 26, 2026")
    expect(markdown).toContain("- **URL**: https://www.bhekani.com/micro/titleless/")
    expect(markdown).toMatch(/A short note\.\n$/)
  })
})
