import type { OGImageOptions } from "astro-og-canvas"

const FONTS = [
  "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf",
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
  "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf",
]

const COLORS = {
  bg: [31, 27, 23] as [number, number, number],
  bgDark: [23, 20, 17] as [number, number, number],
  fg: [232, 227, 219] as [number, number, number],
  accent: [217, 147, 43] as [number, number, number],
  muted: [163, 151, 133] as [number, number, number],
}

const baseOptions = {
  fonts: FONTS,
  bgGradient: [COLORS.bg, COLORS.bgDark],
  border: {
    color: COLORS.accent,
    width: 20,
    side: "inline-start" as const,
  },
  font: {
    title: {
      color: COLORS.fg,
      size: 64,
      families: ["Playfair Display"],
      lineHeight: 1.2,
    },
    description: {
      color: COLORS.muted,
      size: 32,
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
    border: {
      ...baseOptions.border,
      side: "block-end" as const,
    },
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
      title: {
        ...baseOptions.font.title,
        size: 72,
      },
      description: {
        color: COLORS.accent,
        size: 36,
        families: ["Inter"],
        weight: "SemiBold" as const,
      },
    },
  }
}
