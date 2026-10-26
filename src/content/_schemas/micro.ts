import { z } from "astro:content";

export const microSchema = () =>
  z.object({
    title: z.string().trim().min(1).optional(),
    date: z.date(),
    published: z.boolean(),
  });
