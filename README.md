# bhekani.com

Personal site and blog. Astro 7, Tailwind CSS v4, a little Svelte for search and view counts. Hosted on Vercel. Comments via Giscus (GitHub Discussions), page views in Astro DB, semantic search on Upstash Vector.

Live at <https://bhekani.com>. The colophon at </colophon> covers the type, colour and sound choices.

## Run it

Bun only. No npm, pnpm, yarn or npx.

```bash
bun install
cp .env.example .env        # SENTRY_DSN, SENTRY_AUTH_TOKEN, OPENAI/Upstash keys for search
bun run dev                  # http://localhost:4321
```

Run the credential-free verification command before opening a PR:

```bash
bun install --frozen-lockfile
bun run verify:offline
```

`verify:offline` runs the non-watch Vitest suite, Astro checks, content sync, and a local static build. It uses the ignored `.astro/verify.db` database, disables build telemetry and Sentry for the verification build, and does not generate embeddings, publish to the vector index, or require provider credentials.

`bun run build` is the deployment build. Its `prebuild` step regenerates `public/search-index.json` and attempts embedding publication when provider credentials are present; it also runs `astro build --remote`. Do not use it for local verification.

## Where things live

- `src/styles/global.css`: design tokens (OKLCH, `light-dark()`), type scale, shared classes
- `src/scripts/feedback.ts`: click sound and haptics
- `src/content/{posts,micro,books,projects}`: content collections, schemas in `src/content/_schemas`
- `PRODUCT.md`: audience, voice and design principles

## Shipping

`main` is protected. Branch, open a PR, let the Vercel check pass, merge.

## Why `prebuild` deletes `node_modules/.astro`

Vercel restores `node_modules` from the previous deploy, and Astro's content layer caches rendered markdown in `node_modules/.astro`. Expressive Code names its stylesheet by a hash of its CSS, so after a dependency bump the cached HTML pointed at `ec.<old>.css` while the build emitted `ec.<new>.css`, and every code block lost its highlighting in production. Clearing the cache before each build keeps the two in step.
