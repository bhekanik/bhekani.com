import { defineCollection } from "astro:content";
import { projectsSchema } from "./_schemas/projects";
import { thoughtsSchema } from "./_schemas/thoughts";
import { webmentionSchema } from "./_schemas/webmentions";

const thoughts = defineCollection({
  type: "content",
  schema: thoughtsSchema,
});

const projects = defineCollection({
  type: "data",
  schema: projectsSchema,
});

const webmentions = defineCollection({
  type: "data",
  schema: webmentionSchema,
});

export const collections = {
  thoughts,
  projects,
  webmentions,
};
