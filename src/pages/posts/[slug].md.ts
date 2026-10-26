import type { GetStaticPaths } from "astro"
import { getCollection, type CollectionEntry } from "astro:content"
import { createPostMarkdown } from "../../utils/markdownExports"

type Props = { post: CollectionEntry<"posts"> }

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("posts")
  return posts.filter((post) => post.data.published).map((post) => ({
    params: { slug: post.id },
    props: { post },
  }))
}

export async function GET({ props }: { props: Props }) {
  return new Response(createPostMarkdown(props.post), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}
