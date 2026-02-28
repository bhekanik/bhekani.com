# CLAUDE.md

## Project

Personal website and blog built with Astro 5. Static generation, Vercel deployment.

## Commands

```bash
bun run dev      # Dev server
bun run build    # Lint, sync, and build (sets ASTRO_DATABASE_FILE)
bun run preview  # Preview production build
bun run lint     # Astro checks
```

## Conventions

- **Package manager**: Bun exclusively. Never npm/pnpm/yarn/npx.
- Git hooks via Husky run lint-staged on pre-commit
- Production site with active users — exercise caution with changes
- Build requires: `ASTRO_DATABASE_FILE=./db.sqlite`
- Content frontmatter schemas in `src/content/_schemas/`

## Session Completion

Work is NOT complete until `git push` succeeds. Always push before ending session.

```bash
git pull --rebase && bd sync && git push
```
