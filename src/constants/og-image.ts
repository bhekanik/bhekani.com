import type { OgImageOptions } from "../utils/og"

const COLORS = {
  fg: [244, 244, 246] as [number, number, number],
  accent: [255, 59, 53] as [number, number, number],
  muted: [180, 180, 192] as [number, number, number],
}

const baseFont = {
  title: {
    color: COLORS.fg,
    size: 88,
    weight: 400,
    lineHeight: 1.0,
  },
  description: {
    color: COLORS.muted,
    size: 30,
    weight: 400,
    lineHeight: 1.35,
  },
}

const baseOptions: Partial<OgImageOptions> = {
  font: baseFont,
}

export function getPostOgOptions(
  title: string,
  description?: string,
): OgImageOptions {
  return {
    ...baseOptions,
    caption: "Blog",
    title,
    description,
  }
}

export function getBookOgOptions(
  title: string,
  author: string,
): OgImageOptions {
  return {
    ...baseOptions,
    caption: "Book",
    title,
    description: `by ${author}`,
  }
}

export function getMicroOgOptions(title: string): OgImageOptions {
  return {
    ...baseOptions,
    caption: "Micro",
    title: title || "Micro post",
    font: {
      ...baseFont,
      title: {
        ...baseFont.title,
        size: 72,
      },
    },
  }
}

export function getHomepageOgOptions(): OgImageOptions {
  return {
    ...baseOptions,
    caption: "Meanwhile, in London\u2026",
    title: "Bhekani Khumalo",
    description: "Software engineer \u00b7 AI and distributed systems",
    font: {
      ...baseFont,
      title: { ...baseFont.title, size: 120 },
      description: {
        color: COLORS.accent,
        size: 34,
        weight: 700,
        lineHeight: 1.2,
      },
    },
  }
}
