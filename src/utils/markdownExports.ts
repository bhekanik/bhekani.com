import { getSiteUrl } from "../constants/seo"
import { cleanMdxContent, formatDate } from "./llms"
import { getMicroLabel } from "./micro"

type PostForMarkdown = {
  id: string
  body?: string
  data: {
    author: string
    description?: string
    pubDate: Date
    tags: string[]
    title: string
  }
}

type MicroForMarkdown = {
  id: string
  body?: string
  data: {
    date: Date
    title?: string
  }
}

function metadata(lines: Array<string | undefined>) {
  return lines.filter((line): line is string => line !== undefined).join("\n")
}

export function createPostMarkdown(post: PostForMarkdown): string {
  const header = metadata([
    `# ${post.data.title}`,
    "",
    `- **Date**: ${formatDate(post.data.pubDate)}`,
    `- **Author**: ${post.data.author}`,
    post.data.description ? `- **Summary**: ${post.data.description}` : undefined,
    post.data.tags.length > 0 ? `- **Tags**: ${post.data.tags.join(", ")}` : undefined,
    `- **URL**: ${getSiteUrl(`/posts/${post.id}/`)}`,
    "",
    "---",
    "",
  ])

  return `${header}${cleanMdxContent(post.body ?? "")}\n`
}

export function createMicroMarkdown(micro: MicroForMarkdown): string {
  const header = metadata([
    `# ${getMicroLabel(micro.data.title, micro.data.date)}`,
    "",
    `- **Date**: ${formatDate(micro.data.date)}`,
    `- **URL**: ${getSiteUrl(`/micro/${micro.id}/`)}`,
    "",
    "---",
    "",
  ])

  return `${header}${cleanMdxContent(micro.body ?? "")}\n`
}
