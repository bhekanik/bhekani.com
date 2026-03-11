import { glob } from "astro/loaders"
import { defineCollection } from "astro:content"
import { bookSchema } from "./content/_schemas/book"
import { microSchema } from "./content/_schemas/micro"
import { postSchema } from "./content/_schemas/posts"
import { projectSchema } from "./content/_schemas/projects"
import { webmentionSchema } from "./content/_schemas/webmentions"

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: postSchema,
})

const micro = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/micro" }),
  schema: microSchema,
})

const projects = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/projects" }),
  schema: projectSchema,
})

const webmentions = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/webmentions" }),
  schema: webmentionSchema,
})

const books = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/books" }),
  schema: bookSchema,
})

export const collections = {
  posts,
  projects,
  webmentions,
  books,
  micro,
}
