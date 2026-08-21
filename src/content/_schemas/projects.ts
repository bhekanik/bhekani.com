import { z, type SchemaContext } from "astro:content";

export const projectSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string().optional(),
    url: z.string().optional(),
    appStoreUrl: z.string().url().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    published: z.boolean(),
    featured: z.boolean().default(false),
    image: image().optional(),
    tech: z.array(z.string()),
  });
