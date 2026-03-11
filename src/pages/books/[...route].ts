import { OGImageRoute } from "astro-og-canvas"
import { getCollection } from "astro:content"
import { getBookOgOptions } from "../../constants/og-image"

const collectionEntries = await getCollection("books")

const pages = Object.fromEntries(
  collectionEntries.map(({ id, data }) => [id, data]),
)

export const { getStaticPaths, GET } = await OGImageRoute({
  pages: pages,
  param: "route",

  getImageOptions: (_path, page: any) =>
    getBookOgOptions(page.title, page.author),
})
