import type { OGImageOptions } from "astro-og-canvas"

const FONTS = [
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf",
]

const COLORS = {
  fg: [255, 255, 255] as [number, number, number],
  accent: [217, 147, 43] as [number, number, number],
  muted: [180, 170, 155] as [number, number, number],
}

const baseOptions = {
  fonts: FONTS,
  bgImage: {
    path: "./src/images/og-background.png",
    fit: "cover" as const,
  },
  padding: 80,
  font: {
    title: {
      color: COLORS.fg,
      size: 72,
      families: ["Inter"],
      lineHeight: 1.15,
    },
    description: {
      color: COLORS.muted,
      size: 34,
      families: ["Inter"],
      weight: "Normal" as const,
    },
  },
} satisfies Partial<OGImageOptions>

export function getPostOgOptions(
  title: string,
  description?: string,
): OGImageOptions {
  return {
    ...baseOptions,
    title,
    description,
  }
}

export function getBookOgOptions(
  title: string,
  author: string,
): OGImageOptions {
  return {
    ...baseOptions,
    title,
    description: `by ${author}`,
  }
}

export function getMicroOgOptions(title: string): OGImageOptions {
  return {
    ...baseOptions,
    title: title || "Micro Post",
    font: {
      ...baseOptions.font,
      title: {
        ...baseOptions.font.title,
        size: 56,
      },
    },
  }
}

export function getHomepageOgOptions(): OGImageOptions {
  return {
    ...baseOptions,
    title: "Bhekani Khumalo",
    description: "Software Engineer \u00b7 AI Products \u00b7 Tech Writing",
    font: {
      ...baseOptions.font,
      description: {
        color: COLORS.accent,
        size: 36,
        families: ["Inter"],
        weight: "SemiBold" as const,
      },
    },
  }
}
