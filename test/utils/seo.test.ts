import { describe, expect, it } from "vitest"
import { getDocumentTitle } from "../../src/constants/seo"

describe("document titles", () => {
  it("preserves the existing effective browser title used for Giscus identity", () => {
    expect(getDocumentTitle("Add commenting to Astro blog with Giscus")).toBe(
      "Add commenting to Astro blog with Giscus | Bhekani.com",
    )
    expect(getDocumentTitle("Writing is Thinking")).toBe(
      "Writing is Thinking | Bhekani.com",
    )
  })
})
