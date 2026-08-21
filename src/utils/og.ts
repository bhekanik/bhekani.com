import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import stringWidth from "string-width"

type RGBColor = [number, number, number]

type FontStyle = {
  color: RGBColor
  size: number
  weight: number
  lineHeight: number
}

export type OgImageOptions = {
  title: string
  description?: string
  /** Caption box text, e.g. "Blog", "Book". Defaults to the domain. */
  caption?: string
  font?: {
    title?: Partial<FontStyle>
    description?: Partial<FontStyle>
  }
}

type OgImageRouteOptions<Page> = {
  pages: Record<string, Page>
  param: string
  getImageOptions: (path: string, page: Page) => OgImageOptions
}

const WIDTH = 1200
const HEIGHT = 630

// The panel: a comic frame inset on black paper, white ink, hard offset shadow
const FRAME = { x: 44, y: 44, w: 1112, h: 542, stroke: 5, shadow: 12 }
const PADDING_X = FRAME.x + 56
const CAPTION_HEIGHT = 44
const TITLE_TOP = FRAME.y + CAPTION_HEIGHT + 52
const TITLE_BOTTOM = 400
const DESCRIPTION_TOP = 420
const DESCRIPTION_BOTTOM = 520
const MAX_TEXT_WIDTH = FRAME.w - 56 * 2 - 60
const DESCRIPTION_WIDTH = 860

const INK = "#f4f4f6"
const PAPER = "#0b0b0f"
const RED = "#e0201b"
const YELLOW = "#ffd400"

const COLORS = {
  fg: [244, 244, 246] as RGBColor,
  muted: [180, 180, 192] as RGBColor,
}

const defaultFont = {
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

let assets: Promise<{ display: string; sans: string }> | undefined

export async function createOgImageRoute<Page>({
  pages,
  param,
  getImageOptions,
}: OgImageRouteOptions<Page>) {
  const paths = Object.entries(pages).map(([path, page]) => ({
    params: { [param]: `${path}.png` },
    props: { imageOptions: getImageOptions(path, page) },
  }))

  return {
    getStaticPaths: () => paths,
    GET: async ({ props }: { props: { imageOptions: OgImageOptions } }) =>
      new Response(await generateOgImage(props.imageOptions), {
        headers: { "Content-Type": "image/png" },
      }),
  }
}

async function generateOgImage(options: OgImageOptions) {
  const { display, sans } = await loadAssets()
  const titleFont = { ...defaultFont.title, ...options.font?.title }
  const descriptionFont = {
    ...defaultFont.description,
    ...options.font?.description,
  }

  const title = layoutText({
    text: options.title.toUpperCase(),
    font: titleFont,
    maxWidth: MAX_TEXT_WIDTH,
    maxHeight: TITLE_BOTTOM - TITLE_TOP,
    // Anton caps are narrow: roughly 0.47em per character
    widthRatio: 0.43,
    minSize: 56,
  })
  const description = layoutText({
    text: options.description ?? "",
    font: descriptionFont,
    maxWidth: DESCRIPTION_WIDTH,
    maxHeight: DESCRIPTION_BOTTOM - DESCRIPTION_TOP,
    widthRatio: 0.52,
    minSize: descriptionFont.size,
  })

  const caption = (options.caption ?? "bhekani.com").toUpperCase()
  const captionWidth = Math.round(caption.length * 15 + 40)

  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face { font-family: "Anton"; src: url("${display}") format("woff2"); font-weight: 400; }
          @font-face { font-family: "Public Sans"; src: url("${sans}") format("woff2"); font-weight: 100 900; }
          .display { font-family: "Anton", "Impact", sans-serif; }
          .sans { font-family: "Public Sans", system-ui, sans-serif; }
        </style>
        <pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.15" fill="${INK}" />
        </pattern>
        <linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.35" stop-color="white" stop-opacity="0" />
          <stop offset="1" stop-color="white" stop-opacity="0.45" />
        </linearGradient>
        <mask id="dotmask">
          <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="url(#fade)" />
        </mask>
      </defs>

      <rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}" />

      <rect x="${FRAME.x + FRAME.shadow}" y="${FRAME.y + FRAME.shadow}" width="${FRAME.w}" height="${FRAME.h}" fill="${INK}" />
      <rect x="${FRAME.x}" y="${FRAME.y}" width="${FRAME.w}" height="${FRAME.h}" fill="${PAPER}" stroke="${INK}" stroke-width="${FRAME.stroke}" />
      <rect x="${FRAME.x}" y="${FRAME.y}" width="${FRAME.w}" height="${FRAME.h}" fill="url(#dots)" mask="url(#dotmask)" />

      <rect x="${FRAME.x}" y="${FRAME.y}" width="${captionWidth}" height="${CAPTION_HEIGHT}" fill="${YELLOW}" stroke="${INK}" stroke-width="${FRAME.stroke}" />
      <text class="sans" x="${FRAME.x + 18}" y="${FRAME.y + 30}" font-size="20" font-weight="800" letter-spacing="2" fill="${PAPER}">${escapeXml(caption)}</text>

      ${renderText(title, PADDING_X, TITLE_TOP, "display")}
      ${renderText(description, PADDING_X, DESCRIPTION_TOP, "sans")}

      <g transform="translate(${FRAME.x + FRAME.w - 150} ${FRAME.y + FRAME.h - 96}) rotate(-3)">
        <rect x="6" y="6" width="78" height="50" fill="${INK}" />
        <rect x="0" y="0" width="78" height="50" fill="${RED}" stroke="${INK}" stroke-width="4" />
        <text class="display" x="39" y="38" text-anchor="middle" font-size="34" fill="#ffffff">BK</text>
      </g>
      <text class="sans" x="${FRAME.x + FRAME.w - 56}" y="${FRAME.y + FRAME.h - 30}" text-anchor="end" font-size="18" font-weight="700" letter-spacing="1" fill="${INK}">bhekani.com</text>
    </svg>
  `

  return toArrayBuffer(await sharp(Buffer.from(svg)).png().toBuffer())
}

async function loadAssets() {
  if (!assets) {
    assets = Promise.all([
      fs.readFile(
        path.join(process.cwd(), "node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2"),
      ),
      fs.readFile(
        path.join(
          process.cwd(),
          "node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2",
        ),
      ),
    ]).then(([display, sans]) => ({
      display: toDataUrl(display, "font/woff2"),
      sans: toDataUrl(sans, "font/woff2"),
    }))
  }

  return assets
}

function toDataUrl(buffer: Buffer, mime: string) {
  return `data:${mime};base64,${buffer.toString("base64")}`
}

function toArrayBuffer(buffer: Buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength)
  new Uint8Array(arrayBuffer).set(buffer)

  return arrayBuffer
}

function layoutText({
  text,
  font,
  maxWidth,
  maxHeight,
  widthRatio,
  minSize,
}: {
  text: string
  font: FontStyle
  maxWidth: number
  maxHeight: number
  widthRatio: number
  minSize: number
}) {
  const cleanText = text.replace(/\s+/g, " ").trim()
  const sizes = [font.size, 80, 72, 64, 58, 52, 46].filter(
    (size, index, list) =>
      size <= font.size && size >= minSize && list.indexOf(size) === index,
  )

  for (const size of sizes) {
    const lineHeight = Math.round(size * font.lineHeight)
    const maxLines = Math.floor(maxHeight / lineHeight)
    const maxUnits = Math.floor(maxWidth / (size * widthRatio))
    const lines = wrapText(cleanText, maxUnits)

    if (lines.length <= maxLines) {
      return { lines, font: { ...font, size }, lineHeight, maxUnits, maxLines }
    }
  }

  const size = sizes.at(-1) ?? font.size
  const lineHeight = Math.round(size * font.lineHeight)
  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight))
  const maxUnits = Math.floor(maxWidth / (size * widthRatio))
  const lines = clampLines(wrapText(cleanText, maxUnits), maxLines, maxUnits)

  return { lines, font: { ...font, size }, lineHeight, maxUnits, maxLines }
}

function renderText(
  layout: ReturnType<typeof layoutText>,
  x: number,
  top: number,
  className: "display" | "sans",
) {
  if (!layout.lines.length) return ""

  const [r, g, b] = layout.font.color
  const firstBaseline = top + layout.font.size * 0.9
  const lines = layout.lines
    .map(
      (line, index) =>
        `<tspan x="${x}" y="${index === 0 ? firstBaseline : firstBaseline + layout.lineHeight * index}">${escapeXml(line)}</tspan>`,
    )
    .join("")

  return `<text class="${className}" font-size="${layout.font.size}" font-weight="${layout.font.weight}" fill="rgb(${r}, ${g}, ${b})">${lines}</text>`
}

function wrapText(text: string, maxUnits: number) {
  if (!text) return []

  const lines: string[] = []
  let current = ""

  for (const word of text.split(" ")) {
    const candidate = current ? `${current} ${word}` : word

    if (stringWidth(candidate) <= maxUnits || !current) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)

  return lines
}

function clampLines(lines: string[], maxLines: number, maxUnits: number) {
  if (lines.length <= maxLines) return lines

  const nextLines = lines.slice(0, maxLines)
  nextLines[maxLines - 1] = truncateLine(nextLines[maxLines - 1] ?? "", maxUnits)

  return nextLines
}

function truncateLine(line: string, maxUnits: number) {
  const suffix = "..."
  let nextLine = line

  while (stringWidth(`${nextLine}${suffix}`) > maxUnits && nextLine.length > 0) {
    nextLine = nextLine.slice(0, -1).trimEnd()
  }

  return `${nextLine}${suffix}`
}

function escapeXml(text: string) {
  return text.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case "&":
        return "&amp;"
      case '"':
        return "&quot;"
      case "'":
        return "&apos;"
      default:
        return char
    }
  })
}
