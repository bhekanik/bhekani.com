# bhekani.com

Personal site and blog. Astro 6, Tailwind CSS v4, a little Svelte for search and view counts. Hosted on Vercel. Comments via Giscus (GitHub Discussions), page views in Astro DB, semantic search on Upstash Vector.

Live at <https://bhekani.com>. The colophon at </colophon> covers the type, colour and sound choices.

## Run it

Bun only. No npm, pnpm, yarn or npx.

```bash
bun install
cp .env.example .env        # SENTRY_DSN, SENTRY_AUTH_TOKEN, OPENAI/Upstash keys for search
bun run dev                  # http://localhost:4321
```

Build and check:

```bash
ASTRO_DATABASE_FILE=./db.sqlite bun run lint    # astro check
ASTRO_DATABASE_FILE=./db.sqlite bun run build   # lint + search index + embeddings + astro build
```

The build mutates `db.sqlite`; `git checkout -- db.sqlite` afterwards.

## Where things live

- `src/styles/global.css`: design tokens (OKLCH, `light-dark()`), type scale, shared classes
- `src/scripts/feedback.ts`: click sound and haptics
- `src/content/{posts,micro,books,projects}`: content collections, schemas in `src/content/_schemas`
- `PRODUCT.md`: audience, voice and design principles

## Shipping

`main` is protected. Branch, open a PR, let the Vercel check pass, merge.
