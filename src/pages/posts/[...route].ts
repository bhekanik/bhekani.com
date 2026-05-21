import { getCollection } from "astro:content"
import { getPostOgOptions } from "../../constants/og-image"
import { createOgImageRoute } from "../../utils/og"

const collectionEntries = await getCollection("posts")

const pages = Object.fromEntries(
  collectionEntries.map(({ id, data }) => [id, data]),
)

export const { getStaticPaths, GET } = await createOgImageRoute({
  pages: pages,
  param: "route",

  getImageOptions: (_path, page: any) =>
    getPostOgOptions(page.title, page.description),
})
