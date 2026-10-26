import type { CollectionEntry } from "astro:content"
import { LEGACY_RSS_GUID_ORIGIN } from "../constants/seo"

const MAX_DESCRIPTION_LENGTH = 240

const stripMarkdown = (text: string): string =>
  text
    .replace(/^import\s+.+$/gm, " ")
    .replace(/^export\s+.+$/gm, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+\/?>/g, " ")
    .replace(/[>#*_~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export const createPostDescription = (post: CollectionEntry<"posts">): string => {
  const explicitDescription = post.data.description?.trim()
  if (explicitDescription) return explicitDescription

  const plainBody = stripMarkdown(post.body || "")
  if (!plainBody) return ""

  if (plainBody.length <= MAX_DESCRIPTION_LENGTH) {
    return plainBody
  }

  return `${plainBody.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd()}…`
}

export const createRssItems = (posts: CollectionEntry<"posts">[]) =>
  posts
    .filter((post) => post.data.published)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => {
      const postPath = `/posts/${post.id}/`
      return {
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: createPostDescription(post),
        link: postPath,
        // @astrojs/rss uses `link` as the GUID. Its custom XML is merged after
        // that default, allowing public links to use www without changing IDs.
        customData: `<guid isPermaLink="true">${new URL(postPath, LEGACY_RSS_GUID_ORIGIN).toString()}</guid>`,
      }
    })
