import { defineCollection } from "astro:content";
import { projectsSchema } from "./schemas/projects";
import { thoughtsSchema } from "./schemas/thoughts";

const thoughts = defineCollection({
  type: "content",
  schema: thoughtsSchema,
});

const projects = defineCollection({
  type: "data",
  schema: projectsSchema,
});

export const collections = {
  thoughts,
  projects,
};
