import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { formatDate } from "../utils/llms"

export const GET: APIRoute = async () => {
  const [posts, projects, micro, books] = await Promise.all([
    getCollection("posts"),
    getCollection("projects"),
    getCollection("micro"),
    getCollection("books"),
  ])

  const publishedPosts = posts
    .filter((p) => p.data.published)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())

  const publishedProjects = projects.filter((p) => p.data.published)

  const publishedMicro = micro
    .filter((m) => m.data.published !== false)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())

  const topBooks = books
    .filter((b) => b.data.myRating >= 5)
    .sort((a, b) => b.data.myRating - a.data.myRating)
    .slice(0, 10)

  const lines: string[] = [
    "# Bhekani.com",
    "",
    "> Personal website of Bhekani Khumalo. Writing about tech, productivity, life, and more.",
    "",
    `- [Full blog content](https://bhekani.com/llms-full.txt): All blog posts as markdown`,
    "",
    "## Blog Posts",
    ...publishedPosts.map((post) => {
      const desc = post.data.description
        ? `: ${post.data.description}`
        : ""
      return `- [${post.data.title}](https://bhekani.com/posts/${post.slug}.md)${desc}`
    }),
    "",
    "## Projects",
    ...publishedProjects.map((project) => {
      const url = project.data.url || `https://bhekani.com/projects/`
      const desc = project.data.description
        ? `: ${project.data.description}`
        : ""
      return `- [${project.data.title}](${url})${desc}`
    }),
    "",
    "## Micro Posts",
    ...publishedMicro.map(
      (m) =>
        `- [${m.data.title}](https://bhekani.com/micro/${m.slug}/): ${formatDate(m.data.date)}`
    ),
    "",
    "## Optional",
    "### Reading Log",
    `${books.length} books read. Full list at https://bhekani.com/books/.`,
    ...topBooks.map(
      (b) =>
        `- [${b.data.title}](https://bhekani.com/books/): by ${b.data.author} (${b.data.myRating}/5)`
    ),
    "",
  ]

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}
