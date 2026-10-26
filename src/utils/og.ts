import fs from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import CanvasKitInit, {
  type Canvas,
  type CanvasKit,
  type FontMgr,
  type Paragraph,
} from "canvaskit-wasm/full"

type RGBColor = [number, number, number]

type PanelsPalette = {
  ink: RGBColor
  paper: RGBColor
  red: RGBColor
  yellow: RGBColor
  muted: RGBColor
}

export type OgImageOptions = {
  title: string
  description?: string
  kind?: string
}

type OgImageRouteOptions<Page> = {
  pages: Record<string, Page>
  param: string
  getImageOptions: (path: string, page: Page) => OgImageOptions
}

type LoadedAssets = {
  canvasKit: CanvasKit
  fontManager: FontMgr
  fontFamilies: string[]
}

const require = createRequire(import.meta.url)

export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

const COLORS: PanelsPalette = {
  ink: [11, 11, 15],
  paper: [255, 255, 255],
  red: [224, 32, 27],
  yellow: [255, 212, 0],
  muted: [74, 74, 84],
}

const FONT_PATHS = [
  path.join(process.cwd(), "src/assets/fonts/Anton-Regular.ttf"),
  path.join(process.cwd(), "src/assets/fonts/PublicSans-Variable.ttf"),
]

let assets: Promise<LoadedAssets> | undefined

export async function createOgImageRoute<Page>({
  pages,
  param,
  getImageOptions,
}: OgImageRouteOptions<Page>) {
  const paths = Object.entries(pages).map(([route, page]) => ({
    params: { [param]: `${route}.png` },
    props: { imageOptions: getImageOptions(route, page) },
  }))

  return {
    getStaticPaths: () => paths,
    GET: async ({ props }: { props: { imageOptions: OgImageOptions } }) =>
      new Response(await generateOgImage(props.imageOptions), {
        headers: { "Content-Type": "image/png" },
      }),
  }
}

/**
 * Draws the public Panels-light share card. The route never reads browser
 * preferences because crawlers have no stable visitor edition or theme.
 */
export async function generateOgImage(options: OgImageOptions) {
  const { canvasKit, fontManager } = await loadAssets()
  const surface = canvasKit.MakeSurface(OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT)

  if (!surface) throw new Error("CanvasKit could not create an Open Graph surface")

  try {
    const canvas = surface.getCanvas()
    drawPanelsFrame(canvasKit, canvas)

    const kind = cleanText(options.kind || "BHEKANI.COM")
    const label = makeParagraph(canvasKit, fontManager, kind, {
      color: COLORS.ink,
      families: ["Public Sans"],
      size: 22,
      weight: "Bold",
      lineHeight: 1,
    })
    canvas.drawParagraph(label, 72, 64)
    label.delete()

    const title = fitParagraph(canvasKit, fontManager, cleanText(options.title), {
      maxHeight: 270,
      maxWidth: 1016,
      family: "Anton",
      maxSize: 82,
      minSize: 36,
      lineHeight: 0.98,
      color: COLORS.ink,
    })
    canvas.drawParagraph(title, 72, 145)
    title.delete()

    const description = fitParagraph(
      canvasKit,
      fontManager,
      cleanText(options.description || "bhekani.com"),
      {
        maxHeight: 86,
        maxWidth: 912,
        family: "Public Sans",
        maxSize: 29,
        minSize: 20,
        lineHeight: 1.28,
        color: COLORS.muted,
      },
    )
    canvas.drawParagraph(description, 72, 470)
    description.delete()

    const domain = makeParagraph(canvasKit, fontManager, "bhekani.com", {
      color: COLORS.paper,
      families: ["Public Sans"],
      size: 24,
      weight: "Bold",
      lineHeight: 1,
    })
    canvas.drawParagraph(domain, 932, 556)
    domain.delete()

    const image = surface.makeImageSnapshot()
    const bytes = image.encodeToBytes(canvasKit.ImageFormat.PNG, 100)
    image.delete()

    if (!bytes) throw new Error("CanvasKit could not encode an Open Graph PNG")

    return toArrayBuffer(bytes)
  } finally {
    surface.delete()
  }
}

/** A focused proof for tests: the loaded display and UI fonts must differ. */
export async function getOgFontProof() {
  const { canvasKit, fontManager, fontFamilies } = await loadAssets()
  const sample = "BHEKANI KHUMALO"
  const anton = makeParagraph(canvasKit, fontManager, sample, {
    color: COLORS.ink,
    families: ["Anton"],
    size: 64,
    weight: "Normal",
    lineHeight: 1,
  })
  const publicSans = makeParagraph(canvasKit, fontManager, sample, {
    color: COLORS.ink,
    families: ["Public Sans"],
    size: 64,
    weight: "Normal",
    lineHeight: 1,
  })

  try {
    return {
      antonWidth: anton.getLongestLine(),
      families: fontFamilies,
      publicSansWidth: publicSans.getLongestLine(),
    }
  } finally {
    anton.delete()
    publicSans.delete()
  }
}

async function loadAssets(): Promise<LoadedAssets> {
  if (!assets) {
    assets = Promise.all([
      CanvasKitInit({
        locateFile: (file) =>
          require.resolve(`canvaskit-wasm/bin/full/${file}`),
      }),
      Promise.all(FONT_PATHS.map((fontPath) => fs.readFile(fontPath))),
    ]).then(([canvasKit, fonts]) => {
      const fontManager = canvasKit.FontMgr.FromData(
        ...fonts.map(toArrayBuffer),
      )

      if (!fontManager) throw new Error("CanvasKit could not load the bundled Open Graph fonts")

      const fontFamilies = Array.from(
        { length: fontManager.countFamilies() },
        (_, index) => fontManager.getFamilyName(index),
      )

      if (!fontFamilies.includes("Anton") || !fontFamilies.includes("Public Sans")) {
        throw new Error(`Open Graph fonts did not load: ${fontFamilies.join(", ")}`)
      }

      return { canvasKit, fontManager, fontFamilies }
    })
  }

  return assets
}

function drawPanelsFrame(canvasKit: CanvasKit, canvas: Canvas) {
  const fill = new canvasKit.Paint()

  fill.setColor(canvasKit.Color(...COLORS.ink))
  canvas.drawRect(canvasKit.XYWHRect(0, 0, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT), fill)
  fill.setColor(canvasKit.Color(...COLORS.paper))
  canvas.drawRect(canvasKit.XYWHRect(18, 18, 1164, 594), fill)
  fill.setColor(canvasKit.Color(...COLORS.yellow))
  canvas.drawRect(canvasKit.XYWHRect(54, 48, 270, 56), fill)
  fill.setColor(canvasKit.Color(...COLORS.red))
  canvas.drawRect(canvasKit.XYWHRect(900, 534, 282, 78), fill)
  fill.delete()
}

function fitParagraph(
  canvasKit: CanvasKit,
  fontManager: FontMgr,
  text: string,
  config: {
    maxHeight: number
    maxWidth: number
    family: string
    maxSize: number
    minSize: number
    lineHeight: number
    color: RGBColor
  },
) {
  for (let size = config.maxSize; size >= config.minSize; size -= 2) {
    const paragraph = makeParagraph(canvasKit, fontManager, text, {
      color: config.color,
      families: [config.family],
      size,
      weight: "Normal",
      lineHeight: config.lineHeight,
    }, config.maxWidth)

    if (paragraph.getHeight() <= config.maxHeight) return paragraph
    paragraph.delete()
  }

  const paragraph = makeParagraph(canvasKit, fontManager, text, {
    color: config.color,
    families: [config.family],
    size: config.minSize,
    weight: "Normal",
    lineHeight: config.lineHeight,
  }, config.maxWidth)

  return paragraph
}

function makeParagraph(
  canvasKit: CanvasKit,
  fontManager: FontMgr,
  text: string,
  style: {
    color: RGBColor
    families: string[]
    size: number
    weight: "Normal" | "Bold"
    lineHeight: number
  },
  maxWidth = OG_IMAGE_WIDTH,
): Paragraph {
  const textStyle = new canvasKit.TextStyle({
    color: canvasKit.Color(...style.color),
    fontFamilies: style.families,
    fontSize: style.size,
    fontStyle: { weight: canvasKit.FontWeight[style.weight] },
    heightMultiplier: style.lineHeight,
  })
  const builder = canvasKit.ParagraphBuilder.Make(
    new canvasKit.ParagraphStyle({ textStyle }),
    fontManager,
  )
  builder.addText(text)
  const paragraph = builder.build()
  paragraph.layout(maxWidth)
  builder.delete()

  return paragraph
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function toArrayBuffer(bytes: Uint8Array) {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(arrayBuffer).set(bytes)
  return arrayBuffer
}
