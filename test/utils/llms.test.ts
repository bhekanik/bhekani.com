import { describe, expect, it } from "vitest"
import { cleanMdxContent } from "../../src/utils/llms"

describe("cleanMdxContent", () => {
  it("uses the MDX syntax tree while preserving code verbatim", () => {
    const source = [
      'import Quote from "../../components/Quote.astro"',
      "import {",
      "  Example,",
      '} from "./example"',
      "",
      "<Quote quote={`Line one\\nLine two`} reference=\"Author\" />",
      "",
      "<iframe src=\"https://www.youtube.com/embed/abc123\" title=\"A video\" />",
      "",
      "```html",
      '<script src="https://giscus.app/client.js"></script>',
      "```",
      "",
      "```ts",
      "const render = <T extends { label: string }>(item: T) => <Quote />",
      "```",
      "",
      "Use `<span>inline HTML</span>` and café.",
    ].join("\n")

    expect(cleanMdxContent(source)).toBe([
      "> Line one",
      "> Line two",
      "> — Author",
      "",
      "[A video](https://www.youtube.com/embed/abc123)",
      "",
      "```html",
      '<script src="https://giscus.app/client.js"></script>',
      "```",
      "",
      "```ts",
      "const render = <T extends { label: string }>(item: T) => <Quote />",
      "```",
      "",
      "Use `<span>inline HTML</span>` and café.",
    ].join("\n"))
  })

  it("preserves consecutive blank lines inside code literals", () => {
    const fencedCode = ["```text", "first", "", "", "last", "```"].join("\n")
    const inlineCode = ["Use `first", "", "", "last` exactly."].join("\n")

    expect(cleanMdxContent(fencedCode)).toBe(fencedCode)
    expect(cleanMdxContent(inlineCode)).toBe(inlineCode)
  })

  it("does not convert non-web YouTube URLs", () => {
    expect(cleanMdxContent('<iframe src="ftp://youtube.com/embed/abc123" title="A video" />')).toBe("")
  })

  it("removes actual MDX wrappers while retaining their authored content", () => {
    expect(cleanMdxContent("<Callout tone=\"note\">Keep this text.</Callout>")).toBe(
      "Keep this text.",
    )
  })

  it("converts known nested components without losing their surrounding content", () => {
    expect(cleanMdxContent('<Callout><Quote quote="Keep this quote." /></Callout>')).toBe(
      "> Keep this quote.",
    )
  })

  it("leaves malformed legacy Markdown intact instead of regex-stripping it", () => {
    expect(cleanMdxContent("A deterministic check runs in <1ms.")).toBe(
      "A deterministic check runs in <1ms.",
    )
  })
})
