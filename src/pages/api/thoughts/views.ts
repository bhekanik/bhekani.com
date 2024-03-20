import type { APIRoute } from "astro"
import { IPHash, View, and, db, eq } from "astro:db"
import { hashIp } from "../../../utils/hashIp"
import { increment } from "../../../utils/increment"

export const GET: APIRoute = async ({ request }) => {
  try {
    const slug = request.headers.get("x-slug")

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug", views: 0 }))
    }

    // const data = await prisma.views.findFirst({
    //   where: {
    //     slug,
    //   },
    // })

    const [data] = await db
      .select()
      .from(View)
      .where(eq(View.slug, slug))
      .limit(1)
    console.log("data:", data)

    return new Response(JSON.stringify({ views: data?.count ? data.count : 0 }))
  } catch (error) {
    console.log("error>>>>>>>>:", error)
    return new Response(JSON.stringify({ error: (error as Error).message }))
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // if (!request.userActivation) {}

    const { ip, slug } = await request.json()
    console.log("{ ip, slug }:", { ip, slug })

    if (!process.env.COUNT_LOCAL_VIEWS && ip === "::1") {
      // const data = await prisma.views.findFirst({
      //   where: {
      //     slug,
      //   },
      // })

      const [data] = await db
        .select()
        .from(View)
        .where(eq(View.slug, slug))
        .limit(1)
      console.log("data:", data)

      return new Response(
        JSON.stringify({ views: data?.count ? data.count : 0 }),
      )
    }

    const ipHash = await hashIp(ip)

    // const existingView = await prisma.iPHashes.findUnique({
    //   where: {
    //     ipHash_slug: {
    //       ipHash,
    //       slug,
    //     },
    //     updatedAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    //   },
    //   select: {
    //     view: {
    //       select: {
    //         count: true,
    //       },
    //     },
    //   },
    // })

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
      .limit(1)

    if (existingView) {
      return new Response(JSON.stringify({ views: existingView.count }))
    }

    const da = await db
      .insert(View)
      .values({
        slug,
        count: increment(View.count),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [View.slug],
        set: {
          count: increment(View.count),
          updatedAt: new Date(),
        },
      })

    await db
      .insert(IPHash)
      .values({
        ipHash,
        slug,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [IPHash.ipHash, IPHash.slug],
        set: {
          updatedAt: new Date(),
        },
      })

    // const data = await prisma.views.upsert({
    //   where: {
    //     slug,
    //   },
    //   update: {
    //     count: {
    //       increment: 1,
    //     },
    //     IPHashes: {
    //       upsert: {
    //         where: {
    //           ipHash_slug: {
    //             ipHash,
    //             slug,
    //           },
    //           slug,
    //         },
    //         update: {
    //           updatedAt: new Date(),
    //         },
    //         create: {
    //           ipHash,
    //           updatedAt: new Date(),
    //         },
    //       },
    //     },
    //   },
    //   create: {
    //     slug,
    //     count: 1,
    //     IPHashes: {
    //       create: {
    //         ipHash,
    //         updatedAt: new Date(),
    //       },
    //     },
    //   },
    // })

    return new Response(JSON.stringify({ views: da.rows[0]?.count ?? 0 }))
  } catch (error) {
    console.log("error>>>>>>>>:", error)
    return new Response(JSON.stringify({ error: (error as Error).message }))
  }
}
