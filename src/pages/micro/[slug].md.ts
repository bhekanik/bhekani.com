import type { GetStaticPaths } from "astro"
import { getCollection, type CollectionEntry } from "astro:content"
import { createMicroMarkdown } from "../../utils/markdownExports"

type Props = { micro: CollectionEntry<"micro"> }

export const getStaticPaths: GetStaticPaths = async () => {
  const micro = await getCollection("micro")
  return micro.filter((entry) => entry.data.published !== false).map((entry) => ({
    params: { slug: entry.id },
    props: { micro: entry },
  }))
}

export async function GET({ props }: { props: Props }) {
  return new Response(createMicroMarkdown(props.micro), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  })
}
