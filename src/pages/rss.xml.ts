import rss from "@astrojs/rss"
import { getCollection } from "astro:content"
import { createRssItems } from "../utils/rss"

export async function GET(context: any) {
  const posts = await getCollection("posts")

  return rss({
    title: "Bhekani.com | Blog",
    description: "Random things I learn",
    site: context.site,
    items: createRssItems(posts),
    customData: `<language>en-us</language>`,
  })
}
