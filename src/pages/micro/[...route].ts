import { OGImageRoute } from "astro-og-canvas"
import { getCollection } from "astro:content"
import { getMicroOgOptions } from "../../constants/og-image"

const collectionEntries = await getCollection("micro")

const pages = Object.fromEntries(
  collectionEntries.map(({ slug, data }) => [slug, data]),
)

export const { getStaticPaths, GET } = await OGImageRoute({
  pages: pages,
  param: "route",

  getImageOptions: (_path, page) => getMicroOgOptions(page.title),
})
