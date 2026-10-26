# Open Graph image contract

## Purpose and boundary

The former share image used a dark textured background and Sharp's SVG text
path. Its embedded WOFF2 declaration did not establish the rendered typeface;
the production card showed generic sans glyphs. The smallest adequate repair is
one static **Panels light** card system for all existing image routes. It keeps
the public site's default identity without adding a crawler-specific theme,
visitor state, another image service, or new visual world.

Static crawlers cannot read a visitor's stored edition or theme. The card uses
white paper, near-black ink and frame, the existing red action block, and a
yellow caption field. Pages retain both interactive site editions unchanged.

## Routes and content

All image endpoints return `image/png` at **1200×630**:

- `/og/homepage.png` — Bhekani's existing home title and description.
- `/posts/<published-id>.png` — the authored post title and description.
- `/micro/<published-id>.png` — the authored title, or the shared dated
  `Micro note` fallback for titleless entries.
- `/books/<id>.png` — the existing title and `by <author>` description only.

Post and Micro endpoints use the same publication checks as their rendered
routes. The book endpoint preserves its existing detail-route set and does not
read or project a book body, review, or `privateNotes` value.

The raster may reduce its title size to fit the fixed card. It does not change
the canonical HTML title or any authored metadata.

## Renderer and fonts

`src/utils/og.ts` renders deterministic PNGs with the already-declared
`canvaskit-wasm` dependency. CanvasKit loads local TTF bytes into its font
manager and checks the parsed `Anton` and `Public Sans` family names before
drawing; it does not depend on Sharp's Fontconfig discovery or fetch a font at
build or request time.

Bundled sources are in `src/assets/fonts/`:

| Asset | Source | License |
| --- | --- | --- |
| `Anton-Regular.ttf` | `google/fonts` `e0a8124cf36bb7c32ca68e5d46d6acdbc3df866a`, `ofl/anton/Anton-Regular.ttf` | `Anton-OFL.txt` (SIL OFL-1.1) |
| `PublicSans-Variable.ttf` | `google/fonts` `e7db6ca603fd4862010383ff17ffd6cc4ffac1c0`, `ofl/publicsans/PublicSans[wght].ttf` | `PublicSans-OFL.txt` (SIL OFL-1.1) |

The focused renderer test asserts that CanvasKit reports both family names and
that a shared sample has different Anton and Public Sans measured widths. This
is a glyph-rendering check, not an SVG-source assertion.

## Generation, caching, and verification

The PNGs are generated during Astro's static build, with no remote font fetch,
provider account, or request-time image generation. CanvasKit keeps loaded font
bytes in process memory; it creates no persistent OG cache. Ordinary CDN and
social-network caches can retain an older preview after a deployment. This site
cannot invalidate third-party cards.

During changes, run:

```sh
VITEST=1 bun run test --run test/utils/og.test.ts
bun run verify:offline
```

After deployment, fetch the production image URLs and inspect their decoded PNG
dimensions, typeface rendering, title crops, and metadata references. This
confirms the Linux/Vercel renderer rather than assuming a local macOS result.
