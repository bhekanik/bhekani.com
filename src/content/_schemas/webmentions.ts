import { z } from "astro:content";

export const webmentionSchema = () =>
  z.array(
    z.object({
      "wm-id": z.number(),
      "wm-source": z.string(),
      "wm-target": z.string(),
      "wm-received": z.string().datetime(),
      "wm-protocol": z.string().optional(),
      "wm-property": z.string().optional(),
      "wm-private": z.boolean().optional(),
      "in-reply-to": z.string().optional(),
      name: z.string().optional(),
      content: z
        .object({
          html: z.string().optional(),
          text: z.string().optional(),
        })
        .optional(),
      published: z.string().datetime().nullable(),
      author: z.object({
        type: z.string(),
        name: z.string(),
        url: z.string().optional(),
        photo: z.string().optional(),
      }),
      inReplyTo: z.string().optional(),
      url: z.string().optional(),
      type: z.literal("entry"),
    })
  );
