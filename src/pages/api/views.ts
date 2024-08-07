import type { APIRoute } from "astro"
import { db, eq, sql, Views } from "astro:db"

export const prerender = false

export const POST: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get("slug")

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  let item
  try {
    await db
      .select({
        count: Views.count,
      })
      .from(Views)
      .where(eq(Views.slug, slug))

    item = await db
      .insert(Views)
      .values({
        slug: slug,
        count: 1,
      })
      .onConflictDoUpdate({
        target: Views.slug,
        set: {
          count: sql`count + 1`,
        },
      })
      .returning({
        slug: Views.slug,
        count: Views.count,
      })
      .then((res) => res[0])
  } catch (error) {
    console.log("error:", error)
    item = { slug, count: 1 }
  }

  return new Response(JSON.stringify(item), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  })
}

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get("slug")

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  let item
  try {
    item = await db
      .select({
        count: Views.count,
      })
      .from(Views)
      .where(eq(Views.slug, slug))
      .then((res) => res[0])
  } catch (error) {
    console.log("error:", error)
    item = { slug, count: 1 }
  }

  return new Response(JSON.stringify(item), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  })
}
