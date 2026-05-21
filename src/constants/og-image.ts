import type { OgImageOptions } from "../utils/og"

const COLORS = {
  fg: [255, 255, 255] as [number, number, number],
  accent: [217, 147, 43] as [number, number, number],
  muted: [180, 170, 155] as [number, number, number],
}

const baseFont = {
  title: {
    color: COLORS.fg,
    size: 72,
    weight: 400,
    lineHeight: 1.15,
  },
  description: {
    color: COLORS.muted,
    size: 28,
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
    title,
    description: `by ${author}`,
  }
}

export function getMicroOgOptions(title: string): OgImageOptions {
  return {
    ...baseOptions,
    title: title || "Micro Post",
    font: {
      ...baseFont,
      title: {
        ...baseFont.title,
        size: 56,
      },
    },
  }
}

export function getHomepageOgOptions(): OgImageOptions {
  return {
    ...baseOptions,
    title: "Bhekani Khumalo",
    description: "Software Engineer \u00b7 AI Products \u00b7 Tech Writing",
    font: {
      ...baseFont,
      description: {
        color: COLORS.accent,
        size: 36,
        weight: 600,
        lineHeight: 1.2,
      },
    },
  }
}
