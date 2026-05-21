import { getCollection } from "astro:content"
import { getBookOgOptions } from "../../constants/og-image"
import { createOgImageRoute } from "../../utils/og"

const collectionEntries = await getCollection("books")

const pages = Object.fromEntries(
  collectionEntries.map(({ id, data }) => [id, data]),
)

export const { getStaticPaths, GET } = await createOgImageRoute({
  pages: pages,
  param: "route",

  getImageOptions: (_path, page: any) =>
    getBookOgOptions(page.title, page.author),
})
