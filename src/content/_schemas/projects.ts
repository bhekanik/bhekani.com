import { z, type SchemaContext } from "astro:content";

export const projectSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string().optional(),
    url: z.string().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    published: z.boolean(),
    image: image().optional(),
    tech: z.array(z.string()),
  });
