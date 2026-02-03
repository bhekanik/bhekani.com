import { Index } from "@upstash/vector"
import * as fs from "fs"
import matter from "gray-matter"
import OpenAI from "openai"
import * as path from "path"

const CONTENT_DIR = path.join(process.cwd(), "src/content")

interface ContentItem {
  id: string
  type: "post" | "book" | "micro" | "project"
  title: string
  slug: string
  text: string
  metadata: Record<string, unknown>
}

async function getAllContent(): Promise<ContentItem[]> {
  const items: ContentItem[] = []

  // Posts
  const postsDir = path.join(CONTENT_DIR, "posts")
  if (fs.existsSync(postsDir)) {
    const postFiles = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    for (const file of postFiles) {
      const content = fs.readFileSync(path.join(postsDir, file), "utf-8")
      const { data, content: body } = matter(content)
      if (data.published) {
        const slug = file.replace(/\.mdx?$/, "")
        items.push({
          id: `post-${slug}`,
          type: "post",
          title: data.title || slug,
          slug: `/posts/${slug}`,
          text: `${data.title || ""} ${data.description || ""} ${body}`.trim(),
          metadata: {
            title: data.title,
            description: data.description,
            tags: data.tags || [],
            pubDate: data.pubDate?.toISOString?.() || data.pubDate,
          },
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
      items.push({
        id: `book-${data.id || slug}`,
        type: "book",
        title: data.title || slug,
        slug: `/books/${slug}`,
        text: `${data.title || ""} by ${data.author || ""}`.trim(),
        metadata: {
          title: data.title,
          author: data.author,
          myRating: data.myRating,
          tags: data.tags || [],
        },
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
        items.push({
          id: `micro-${slug}`,
          type: "micro",
          title: data.title || slug,
          slug: `/micro/${slug}`,
          text: `${data.title || ""} ${body}`.trim(),
          metadata: {
            title: data.title,
            date: data.date?.toISOString?.() || data.date,
          },
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
        items.push({
          id: `project-${slug}`,
          type: "project",
          title: data.title || slug,
          slug: data.url || `/projects`,
          text: `${data.title || ""} ${data.description || ""} ${(data.tech || []).join(" ")}`.trim(),
          metadata: {
            title: data.title,
            description: data.description,
            tech: data.tech || [],
            url: data.url,
          },
        })
      }
    }
  }

  return items
}

async function generateEmbeddings(texts: string[], openai: OpenAI): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  })
  return response.data.map((d) => d.embedding)
}

async function main() {
  const upstashUrl = process.env.UPSTASH_VECTOR_REST_URL
  const upstashToken = process.env.UPSTASH_VECTOR_REST_TOKEN
  const openaiKey = process.env.OPENAI_API_KEY

  if (!upstashUrl || !upstashToken) {
    console.log("Skipping embeddings: UPSTASH_VECTOR_REST_URL or UPSTASH_VECTOR_REST_TOKEN not set")
    process.exit(0)
  }

  if (!openaiKey) {
    console.log("Skipping embeddings: OPENAI_API_KEY not set")
    process.exit(0)
  }

  const index = new Index({
    url: upstashUrl,
    token: upstashToken,
  })

  const openai = new OpenAI({ apiKey: openaiKey })

  console.log("Loading content...")
  const items = await getAllContent()
  console.log(`Found ${items.length} items to index`)

  if (items.length === 0) {
    console.log("No items to index")
    return
  }

  // Generate embeddings in batches
  const BATCH_SIZE = 100
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)}...`)

    const texts = batch.map((item) => item.text.slice(0, 8000)) // Truncate to 8k characters (conservative vs model token limit)
    const embeddings = await generateEmbeddings(texts, openai)

    // Upsert to Upstash Vector
    const vectors = batch.map((item, idx) => ({
      id: item.id,
      vector: embeddings[idx]!,
      metadata: {
        type: item.type,
        title: item.title,
        slug: item.slug,
        ...item.metadata,
      },
    }))

    await index.upsert(vectors)
  }

  console.log(`Successfully indexed ${items.length} items`)
}

main().catch(console.error)
