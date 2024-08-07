import { z, type SchemaContext } from "astro:content"

export const postSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string().optional(),
    published: z.boolean(),
    author: z.string(),
    image: image().optional(),
    tags: z.array(z.string()),
    // tags: z.enum([
    //   "advice",
    //   "events",
    //   "technical",
    //   "learning",
    //   "musings",
    //   "personal",
    //   "work",
    //   "meta",
    // ]),
  })
