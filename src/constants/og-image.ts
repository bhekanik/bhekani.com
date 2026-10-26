import type { OgImageOptions } from "../utils/og"
import { getMicroLabel } from "../utils/micro"

export function getPostOgOptions(
  title: string,
  description?: string,
): OgImageOptions {
  return {
    kind: "ARTICLE",
    title,
    description,
  }
}

export function getBookOgOptions(
  title: string,
  author: string,
): OgImageOptions {
  return {
    kind: "BOOK",
    title,
    description: `by ${author}`,
  }
}

export function getMicroOgOptions(title: string | undefined, date?: Date): OgImageOptions {
  return {
    kind: "MICRO NOTE",
    title: date ? getMicroLabel(title, date) : title?.trim() || "Micro note",
  }
}

export function getHomepageOgOptions(): OgImageOptions {
  return {
    kind: "BHEKANI.COM",
    title: "Bhekani Khumalo",
    description: "Software Engineer \u00b7 AI and distributed systems",
  }
}
