import type { CollectionEntry } from "astro:content"

const MAX_DESCRIPTION_LENGTH = 240

const stripMarkdown = (text: string): string =>
  text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
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
        guid: postPath,
      }
    })
