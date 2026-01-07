import { defineCollection } from "astro:content"
import { bookSchema } from "./_schemas/book"
import { microSchema } from "./_schemas/micro"
import { postSchema } from "./_schemas/posts"
import { projectSchema } from "./_schemas/projects"
import { webmentionSchema } from "./_schemas/webmentions"

const posts = defineCollection({
  type: "content",
  schema: postSchema,
})

const micro = defineCollection({
  type: "content",
  schema: microSchema,
})

const projects = defineCollection({
  type: "data",
  schema: projectSchema,
})

const webmentions = defineCollection({
  type: "data",
  schema: webmentionSchema,
})

const books = defineCollection({
  type: "content",
  schema: bookSchema,
})

export const collections = {
  posts,
  projects,
  webmentions,
  books,
  micro,
}
