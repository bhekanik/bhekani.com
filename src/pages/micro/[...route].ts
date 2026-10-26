import { getCollection } from "astro:content"
import { getMicroOgOptions } from "../../constants/og-image"
import { createOgImageRoute } from "../../utils/og"

const collectionEntries = await getCollection("micro")
type MicroOgPage = { title?: string; date: Date }

const pages = Object.fromEntries(
  collectionEntries.map(({ id, data }) => [id, data]),
)

export const { getStaticPaths, GET } = await createOgImageRoute({
  pages: pages,
  param: "route",

  getImageOptions: (_path, page: MicroOgPage) => getMicroOgOptions(page.title, page.date),
})
