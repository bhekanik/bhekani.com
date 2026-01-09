import * as fs from "fs"
import matter from "gray-matter"
import * as path from "path"

const CONTENT_DIR = path.join(process.cwd(), "src/content")
const OUTPUT_PATH = path.join(process.cwd(), "public/search-index.json")

interface SearchIndexItem {
  id: string
  type: "post" | "book" | "micro" | "project"
  title: string
  slug: string
  description?: string
  searchText: string
}

async function generateSearchIndex(): Promise<SearchIndexItem[]> {
  const items: SearchIndexItem[] = []

  // Posts
  const postsDir = path.join(CONTENT_DIR, "posts")
  if (fs.existsSync(postsDir)) {
    const postFiles = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    for (const file of postFiles) {
      const content = fs.readFileSync(path.join(postsDir, file), "utf-8")
      const { data, content: body } = matter(content)
      if (data.published) {
        const slug = file.replace(/\.mdx?$/, "")
        const searchText = `${data.title || ""} ${data.description || ""} ${(data.tags || []).join(" ")} ${body}`
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        items.push({
          id: `post-${slug}`,
          type: "post",
          title: data.title || slug,
          slug: `/posts/${slug}`,
          description: data.description,
          searchText,
        })
      }
    }
  }

  // Books
  const booksDir = path.join(CONTENT_DIR, "books")
  if (fs.existsSync(booksDir)) {
    const bookFiles = fs.readdirSync(booksDir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    for (const file of bookFiles) {
      const content = fs.readFileSync(path.join(booksDir, file), "utf-8")
      const { data } = matter(content)
      const slug = file.replace(/\.mdx?$/, "")
      const searchText = `${data.title || ""} ${data.author || ""} ${(data.tags || []).join(" ")}`
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
      items.push({
        id: `book-${data.id || slug}`,
        type: "book",
        title: data.title || slug,
        slug: `/books/${slug}`,
        description: `by ${data.author || "Unknown"}`,
        searchText,
      })
    }
  }

  // Micro posts
  const microDir = path.join(CONTENT_DIR, "micro")
  if (fs.existsSync(microDir)) {
    const microFiles = fs.readdirSync(microDir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    for (const file of microFiles) {
      const content = fs.readFileSync(path.join(microDir, file), "utf-8")
      const { data, content: body } = matter(content)
      if (data.published) {
        const slug = file.replace(/\.mdx?$/, "")
        const searchText = `${data.title || ""} ${body}`
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        items.push({
          id: `micro-${slug}`,
          type: "micro",
          title: data.title || slug,
          slug: `/micro/${slug}`,
          description: body.slice(0, 100) + (body.length > 100 ? "..." : ""),
          searchText,
        })
      }
    }
  }

  // Projects (JSON files)
  const projectsDir = path.join(CONTENT_DIR, "projects")
  if (fs.existsSync(projectsDir)) {
    const projectFiles = fs.readdirSync(projectsDir).filter((f) => f.endsWith(".json"))
    for (const file of projectFiles) {
      const content = fs.readFileSync(path.join(projectsDir, file), "utf-8")
      const data = JSON.parse(content)
      if (data.published) {
        const slug = file.replace(/\.json$/, "")
        const searchText = `${data.title || ""} ${data.description || ""} ${(data.tech || []).join(" ")}`
          .toLowerCase()
          .replace(/[^\w\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
        items.push({
          id: `project-${slug}`,
          type: "project",
          title: data.title || slug,
          slug: data.url || `/projects`,
          description: data.description,
          searchText,
        })
      }
    }
  }

  return items
}

async function main() {
  console.log("Generating search index...")
  const items = await generateSearchIndex()

  // Ensure public directory exists
  const publicDir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2))
  console.log(`Generated search index with ${items.length} items at ${OUTPUT_PATH}`)
}

main().catch(console.error)
