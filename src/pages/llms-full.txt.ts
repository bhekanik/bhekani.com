import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { cleanMdxContent, formatDate } from "../utils/llms"

export const GET: APIRoute = async () => {
  const posts = await getCollection("posts")

  const publishedPosts = posts
    .filter((p) => p.data.published)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())

  const header = [
    "# Bhekani.com — Full Blog Content",
    "",
    "> All published blog posts from bhekani.com, formatted as markdown for LLM consumption.",
    "",
  ].join("\n")

  const postSections = publishedPosts.map((post) => {
    const meta = [
      `## ${post.data.title}`,
      "",
      `- **Date**: ${formatDate(post.data.pubDate)}`,
      post.data.description ? `- **Summary**: ${post.data.description}` : null,
      post.data.tags.length > 0
        ? `- **Tags**: ${post.data.tags.join(", ")}`
        : null,
      `- **URL**: https://bhekani.com/posts/${post.slug}/`,
      "",
    ]
      .filter((line): line is string => line !== null)
      .join("\n")

    const body = cleanMdxContent(post.body || "")

    return `${meta}\n${body}`
  })

  const content = header + postSections.join("\n\n---\n\n") + "\n"

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
