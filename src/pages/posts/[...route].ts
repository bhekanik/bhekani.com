import { getCollection } from "astro:content"
import { getPostOgOptions } from "../../constants/og-image"
import { createOgImageRoute } from "../../utils/og"

const collectionEntries = (await getCollection("posts")).filter(
  (post) => post.data.published,
)

const pages = Object.fromEntries(
  collectionEntries.map(({ id, data }) => [id, data]),
)

export const { getStaticPaths, GET } = await createOgImageRoute({
  pages: pages,
  param: "route",

  getImageOptions: (_path, page) =>
    getPostOgOptions(page.title, page.description),
})
