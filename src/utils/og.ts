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
const PADDING_X = 80
const TITLE_TOP = 84
const TITLE_BOTTOM = 286
const DESCRIPTION_TOP = 352
const DESCRIPTION_BOTTOM = 520
const MAX_TEXT_WIDTH = WIDTH - PADDING_X * 2
const DESCRIPTION_WIDTH = 920

const COLORS = {
  fg: [255, 255, 255] as RGBColor,
  muted: [180, 170, 155] as RGBColor,
}

const defaultFont = {
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

let assets: Promise<{ background: string; font: string }> | undefined

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
  const { background, font } = await loadAssets()
  const titleFont = { ...defaultFont.title, ...options.font?.title }
  const descriptionFont = {
    ...defaultFont.description,
    ...options.font?.description,
  }

  const title = layoutText({
    text: options.title,
    font: titleFont,
    maxWidth: MAX_TEXT_WIDTH,
    maxHeight: TITLE_BOTTOM - TITLE_TOP,
    widthRatio: 0.52,
    minSize: 46,
  })
  const description = layoutText({
    text: options.description ?? "",
    font: descriptionFont,
    maxWidth: DESCRIPTION_WIDTH,
    maxHeight: DESCRIPTION_BOTTOM - DESCRIPTION_TOP,
    widthRatio: 0.48,
    minSize: descriptionFont.size,
  })

  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @font-face {
            font-family: "Inter";
            src: url("${font}") format("woff2");
            font-weight: 100 900;
          }
          text {
            font-family: "Inter", "Arial", sans-serif;
            letter-spacing: 0;
          }
        </style>
      </defs>
      <image href="${background}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="xMidYMid slice"/>
      ${renderText(title, PADDING_X, TITLE_TOP)}
      ${renderText(description, PADDING_X, DESCRIPTION_TOP)}
    </svg>
  `

  return toArrayBuffer(await sharp(Buffer.from(svg)).png().toBuffer())
}

async function loadAssets() {
  if (!assets) {
    assets = Promise.all([
      fs.readFile(path.join(process.cwd(), "src/images/og-background.png")),
      fs.readFile(
        path.join(
          process.cwd(),
          "node_modules/@fontsource-variable/inter/files/inter-latin-standard-normal.woff2",
        ),
      ),
    ]).then(([background, font]) => ({
      background: toDataUrl(background, "image/png"),
      font: toDataUrl(font, "font/woff2"),
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
  const sizes = [font.size, 64, 58, 52, 46].filter(
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

  return `<text font-size="${layout.font.size}" font-weight="${layout.font.weight}" fill="rgb(${r}, ${g}, ${b})">${lines}</text>`
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
