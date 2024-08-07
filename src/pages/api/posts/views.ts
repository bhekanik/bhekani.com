import type { APIRoute } from "astro"
// @ts-ignore
import { IPHash, View, and, db, eq } from "astro:db"
import { hashIp } from "../../../utils/hashIp"

export const GET: APIRoute = async ({ request }) => {
  try {
    const slug = request.headers.get("x-slug")

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug", views: 0 }))
    }

    const [data] = await db
      .select({ views: View.count })
      .from(View)
      .where(eq(View.slug, slug))
      .limit(1)

    const views = data?.views ?? 0

    return new Response(JSON.stringify({ views }))
  } catch (error) {
    console.error("error +++++++>>>>>>>>:", error)
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "" }),
    )
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // if (!request.userActivation) {}

    const body = await request.json()
    const { ip, slug } = body as any
    let views = 0

    if (!process.env.COUNT_LOCAL_VIEWS && ip === "::1") {
      console.log("Not counting local views")
      const [data] = await db
        .select()
        .from(View)
        .where(eq(View.slug, slug))
        .limit(1)

      views = data?.count ?? 0
    } else {
      const ipHash = await hashIp(ip)

      const [existingView] = await db
        .select({ count: View.count })
        .from(IPHash)
        .where(
          and(
            eq(IPHash.slug, slug),
            eq(IPHash.ipHash, ipHash),
            eq(IPHash.updatedAt, new Date(Date.now() - 1000 * 60 * 60 * 24)),
          ),
        )
        .innerJoin(View, eq(View.slug, IPHash.slug))
        .limit(1)

      if (existingView) {
        views = existingView.count
      }

      const [data] = await db
        .select({ count: View.count })
        .from(View)
        .where(eq(View.slug, slug))
        .limit(1)

      let view
      if (data?.count) {
        ;[view] = await db
          .update(View)
          .set({
            slug,
            count: data.count + 1,
            updatedAt: new Date(),
          })
          .where(eq(View.slug, slug))
          .returning({ count: View.count, slug: View.slug })
      } else {
        ;[view] = await db
          .insert(View)
          .values({
            slug,
            count: 1,
            updatedAt: new Date(),
          })
          .returning({ count: View.count, slug: View.slug })
      }

      await db
        .insert(IPHash)
        .values({
          ipHash,
          slug: view?.slug as string,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: IPHash.ipHash,
          set: {
            updatedAt: new Date(),
          },
          where: and(
            eq(IPHash.ipHash, ipHash),
            eq(IPHash.slug, view?.slug ?? ""),
          ),
        })

      if (view) {
        views = view?.count as number
      }
    }

    console.log("views:", views)
    return new Response(JSON.stringify({ views }))
  } catch (error) {
    console.error("error---->>>>>>>>:", error)
    return new Response(JSON.stringify({ error: (error as Error).message }))
  }
}
