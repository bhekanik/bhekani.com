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
```

## Conventions

- Bun only; don't use npm/pnpm/yarn/npx.
- Husky runs lint-staged on pre-commit.
- Lint and build need `ASTRO_DATABASE_FILE=./db.sqlite`; the scripts don't set it.
- Content frontmatter schemas live in `src/content/_schemas/`.
