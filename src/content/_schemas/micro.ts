import { z } from "astro:content";

export const microSchema = () =>
  z.object({
    title: z.string(),
    date: z.date(),
    published: z.boolean(),
  });
