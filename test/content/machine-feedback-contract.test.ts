import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

function source(path: string) {
  return readFileSync(resolve(process.cwd(), "src", path), "utf8")
}

describe("machine-readable writing contract", () => {
  it("exports only published posts and Micros as Markdown routes", () => {
    expect(source("pages/posts/[slug].md.ts")).toContain("posts.filter((post) => post.data.published)")
    expect(source("pages/micro/[slug].md.ts")).toContain("entry.data.published !== false")
  })

  it("makes Markdown and the llms description discoverable without placing the invitation in article prose", () => {
    const layout = source("layouts/BaseLayout.astro")
    expect(layout).toContain('rel="alternate" type="text/markdown"')
    expect(layout).toContain('rel="describedby" type="text/plain" href="/llms.txt"')
    expect(source("pages/llms.txt.ts")).toContain("If this helped with your work, please leave a comment")
    expect(source("pages/posts/[...slug].astro")).not.toContain("If this helped with your work")
    expect(source("pages/micro/[...slug].astro")).not.toContain("If this helped with your work")
  })

  it("keeps authorization and pending-publication boundaries in the separate guide", () => {
    const guide = source("pages/machine-feedback.md.ts")
    expect(guide).toContain("unless the person you assist has authorized that specific comment")
    expect(guide).toContain("not publicly published until the owner approves it")
    expect(guide).toContain('"action": "receipt"')
  })
})
