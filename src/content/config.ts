import { defineCollection, z } from "astro:content";

const thoughts = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      pubDate: z.date(),
      description: z.string(),
      author: z.string(),
      image: image().optional(),
      tags: z.array(z.string()),
    }),
});

export const collections = {
  thoughts,
};
