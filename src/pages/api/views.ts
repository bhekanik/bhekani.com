import type { APIRoute } from "astro"
import { db, eq, sql, Views } from "astro:db"

export const prerender = false

export const GET: APIRoute = async ({ url, params }) => {
  const slug = url.searchParams.get("slug")

  if (!slug) {
    return new Response(JSON.stringify({ error: "Slug is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  let item
  try {
    const views = await db
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
      "cache-control": "public, s-maxage=60, stale-while-revalidate=25",
    },
  })
}
