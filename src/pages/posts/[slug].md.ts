import type { GetStaticPaths } from "astro"
import { getCollection } from "astro:content"
import { cleanMdxContent, formatDate } from "../../utils/llms"

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getCollection("posts")
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }))
}

export async function GET({ props }: { props: any }) {
  const { post } = props

  const meta = [
    `# ${post.data.title}`,
    "",
    `- **Date**: ${formatDate(post.data.pubDate)}`,
    `- **Author**: ${post.data.author}`,
    post.data.description ? `- **Summary**: ${post.data.description}` : null,
    post.data.tags.length > 0
      ? `- **Tags**: ${post.data.tags.join(", ")}`
      : null,
    `- **URL**: https://bhekani.com/posts/${post.slug}/`,
    "",
    "---",
    "",
  ]
    .filter((line): line is string => line !== null)
    .join("\n")

  const body = cleanMdxContent(post.body || "")

  return new Response(meta + body + "\n", {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  })
}
