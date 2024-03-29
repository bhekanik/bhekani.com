import { defineCollection } from "astro:content";
import { bookSchema } from "./_schemas/book";
import { microSchema } from "./_schemas/micro";
import { projectSchema } from "./_schemas/projects";
import { thoughtSchema } from "./_schemas/thoughts";
import { webmentionSchema } from "./_schemas/webmentions";

const thoughts = defineCollection({
  type: "content",
  schema: thoughtSchema,
});

const micro = defineCollection({
  type: "content",
  schema: microSchema,
});

const projects = defineCollection({
  type: "data",
  schema: projectSchema,
});

const webmentions = defineCollection({
  type: "data",
  schema: webmentionSchema,
});

const books = defineCollection({
  type: "content",
  schema: bookSchema,
});

export const collections = {
  thoughts,
  projects,
  webmentions,
  books,
  micro,
};
