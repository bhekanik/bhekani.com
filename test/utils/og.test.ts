import sharp from "sharp"
import { describe, expect, it } from "vitest"
import {
  createOgImageRoute,
  generateOgImage,
  getOgFontProof,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from "../../src/utils/og"
import {
  getBookOgOptions,
  getMicroOgOptions,
  getPostOgOptions,
} from "../../src/constants/og-image"

describe("Open Graph image renderer", () => {
  it("renders a valid 1200×630 PNG with the bundled Panels typefaces", async () => {
    const image = await generateOgImage(
      getPostOgOptions(
        "<AI & agents> should support “real” Unicode",
        "An authored description with XML-sensitive punctuation.",
      ),
    )

    expect(Buffer.from(image).subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
    await expect(sharp(Buffer.from(image)).metadata()).resolves.toMatchObject({
      format: "png",
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
    })
  })

  it("uses distinct bundled Anton and Public Sans glyph metrics", async () => {
    const proof = await getOgFontProof()

    expect(proof.families).toEqual(expect.arrayContaining(["Anton", "Public Sans"]))
    expect(proof.antonWidth).not.toBe(proof.publicSansWidth)
  })

  it("keeps long book titles and titleless Micros inside the shared route contract", async () => {
    const longBook = getBookOgOptions(
      "The Book You Wish Your Parents Had Read and Your Children Will Be Glad That You Did",
      "Philippa Perry",
    )
    const titlelessMicro = getMicroOgOptions(undefined, new Date("2026-10-26T00:00:00Z"))
    const route = await createOgImageRoute({
      pages: { "long-book": longBook, "titleless-micro": titlelessMicro },
      param: "route",
      getImageOptions: (_path, page) => page,
    })

    expect(route.getStaticPaths()).toEqual([
      expect.objectContaining({ params: { route: "long-book.png" } }),
      expect.objectContaining({ params: { route: "titleless-micro.png" } }),
    ])
    expect(longBook.kind).toBe("BOOK")
    expect(titlelessMicro.title).toContain("Micro note")
    await expect(generateOgImage(longBook)).resolves.toBeInstanceOf(ArrayBuffer)
  })
})
