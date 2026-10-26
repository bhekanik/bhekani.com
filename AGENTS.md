# AGENTS.md

## Project

Personal website and blog built with Astro. Static generation, Vercel deployment.

## Commands

```bash
bun run dev      # Dev server
ASTRO_DATABASE_FILE=./db.sqlite bun run build  # Lint, search index, embeddings, astro build
bun run preview  # Preview production build
ASTRO_DATABASE_FILE=./db.sqlite bun run lint   # Astro checks
bun run test     # Vitest
bun run verify:offline # Credential-free tests, checks, sync and local static build
```

## Conventions

- Bun only; don't use npm/pnpm/yarn/npx.
- Husky runs lint-staged on pre-commit.
- Lint and build need `ASTRO_DATABASE_FILE=./db.sqlite`; the scripts don't set it.
- Content frontmatter schemas live in `src/content/_schemas/`.
- Use `bun run verify:offline` for local verification. It writes ignored `.astro/` output (including `.astro/verify.db`), `dist/`, and `.vercel/` output; it disables build telemetry and Sentry for that build, and does not run the embedding publisher or require provider credentials.
- The pre-push hook runs `bun run verify:offline`; do not replace it with `bun run build`.
- `bun run build` is the deployment command: its prebuild step clears the Astro content cache and can publish embeddings when credentials are present. It does not generate a public search index. Do not use it as a local check.
