import { createBookSearchRoutes, type BookSearchEntry } from "./bookSearchRoutes"
import {
  isSafeExternalUrl,
  normalizeSearchText,
  searchRevision,
  type SearchIndexItem,
} from "./search"

type Entry<T> = { id: string; body?: string; data: T }

type PostData = {
  title: string
  description?: string
  published: boolean
  tags: string[]
}

type MicroData = { title: string; published: boolean }

type ProjectData = {
  title: string
  description?: string
  published: boolean
  tech: string[]
  url?: string
}

type BookData = BookSearchEntry["data"] & {
  title: string
  author: string
  tags: string[]
}

export interface SearchProjection {
  index: SearchIndexItem[]
  revision: string
}

export interface SearchCollections {
  posts: readonly Entry<PostData>[]
  micro: readonly Entry<MicroData>[]
  projects: readonly Entry<ProjectData>[]
  books: readonly Entry<BookData>[]
}

function item(
  id: string,
  type: SearchIndexItem["type"],
  title: string,
  slug: string,
  description: string | undefined,
  searchParts: readonly (string | undefined)[],
): SearchIndexItem {
  return {
    id,
    type,
    title,
    slug,
    description,
    searchText: normalizeSearchText(searchParts.filter((part): part is string => Boolean(part)).join(" ")),
  }
}

/**
 * Builds the private server-side search projection from Astro's content
 * entries.  It intentionally never reads book bodies, which may contain
 * imported private notes.
 */
export function createSearchProjection(collections: SearchCollections): SearchProjection {
  const index: SearchIndexItem[] = []

  for (const post of collections.posts) {
    if (!post.data.published) continue
    index.push(item(
      `post-${post.id}`,
      "post",
      post.data.title,
      `/posts/${post.id}`,
      post.data.description,
      [post.data.title, post.data.description, ...post.data.tags, post.body],
    ))
  }

  for (const micro of collections.micro) {
    if (!micro.data.published) continue
    index.push(item(
      `micro-${micro.id}`,
      "micro",
      micro.data.title,
      `/micro/${micro.id}`,
      undefined,
      [micro.data.title, micro.body],
    ))
  }

  for (const project of collections.projects) {
    if (!project.data.published) continue
    index.push(item(
      `project-${project.id}`,
      "project",
      project.data.title,
      isSafeExternalUrl(project.data.url) ? project.data.url : "/projects",
      project.data.description,
      [project.data.title, project.data.description, ...project.data.tech],
    ))
  }

  const bookRoutes = createBookSearchRoutes(collections.books)
  for (const book of collections.books) {
    const id = `book-${book.data.id}`
    const slug = bookRoutes.get(id)
    if (!slug) continue
    index.push(item(
      id,
      "book",
      book.data.title,
      slug,
      `by ${book.data.author}`,
      [book.data.title, book.data.author, ...book.data.tags],
    ))
  }

  index.sort((a, b) => a.id.localeCompare(b.id))
  return { index, revision: searchRevision(index) }
}
