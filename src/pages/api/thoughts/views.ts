import type { APIRoute } from "astro"
import { prisma } from "../../../utils/db"

const hashIp = async (ip?: string) => {
  const preEncoded = ip ?? new Date().toString()
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(preEncoded),
  )
  const hash = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return hash
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const slug = request.headers.get("x-slug")

    if (!slug) {
      return new Response(JSON.stringify({ error: "Missing slug", views: 0 }))
    }

    const data = await prisma.views.findFirst({
      where: {
        slug,
      },
    })

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
      const data = await prisma.views.findFirst({
        where: {
          slug,
        },
      })

      return new Response(
        JSON.stringify({ views: data?.count ? data.count : 0 }),
      )
    }

    const ipHash = await hashIp(ip)

    const existingView = await prisma.iPHashes.findUnique({
      where: {
        ipHash_slug: {
          ipHash,
          slug,
        },
        updatedAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
      },
      select: {
        view: {
          select: {
            count: true,
          },
        },
      },
    })

    if (existingView) {
      return new Response(JSON.stringify({ views: existingView.view.count }))
    }

    const data = await prisma.views.upsert({
      where: {
        slug,
      },
      update: {
        count: {
          increment: 1,
        },
        IPHashes: {
          upsert: {
            where: {
              ipHash_slug: {
                ipHash,
                slug,
              },
              slug,
            },
            update: {
              updatedAt: new Date(),
            },
            create: {
              ipHash,
              updatedAt: new Date(),
            },
          },
        },
      },
      create: {
        slug,
        count: 1,
        IPHashes: {
          create: {
            ipHash,
            updatedAt: new Date(),
          },
        },
      },
    })

    return new Response(JSON.stringify({ views: data.count ? data.count : 0 }))
  } catch (error) {
    console.log("error>>>>>>>>:", error)
    return new Response(JSON.stringify({ error: (error as Error).message }))
  }
}
