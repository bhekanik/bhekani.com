import { OGImageRoute } from "astro-og-canvas"
import { getCollection } from "astro:content"

const collectionEntries = await getCollection("posts")

// Map the array of content collection entries to create an object.
// Converts [{ id: 'post.md', data: { title: 'Example', description: '' } }]
// to { 'post.md': { title: 'Example', description: '' } }
const pages = Object.fromEntries(
  collectionEntries.map(({ slug, data }) => [slug, data]),
)

export const { getStaticPaths, GET } = OGImageRoute({
  pages: pages,
  param: "route",

  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
  }),
})
