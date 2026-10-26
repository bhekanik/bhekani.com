# AGENTS.md

## Project

Personal website and blog built with Astro. Static generation, Vercel deployment.

## Commands

```bash
bun run dev      # Dev server
bun run build    # Authorized deployment only: prebuild may publish embeddings; remote DB build
bun run preview  # Preview an existing build; not an on-demand server for Vercel functions
ASTRO_DATABASE_FILE=.astro/verify.db bun run lint # Astro checks after local verification
bun run test     # Vitest
bun run verify:offline # Credential-free tests, checks, sync and local static build
```

## Conventions

- Bun only; don't use npm/pnpm/yarn/npx.
- Husky runs lint-staged on pre-commit.
- Standalone lint needs a deliberate local database target, for example `ASTRO_DATABASE_FILE=.astro/verify.db bun run lint` after verification. Deployment builds use the established remote DB configuration.
- Content frontmatter schemas live in `src/content/_schemas/`.
- Use `bun run verify:offline` for local verification. It writes ignored `.astro/` output (including `.astro/verify.db`), `dist/`, and `.vercel/` output; it disables build telemetry and Sentry for that build, and does not run the embedding publisher or require provider credentials.
- The pre-push hook runs `bun run verify:offline`; do not replace it with `bun run build`.
- `bun run build` is the deployment command: its prebuild step clears the Astro content cache and can publish embeddings when credentials are present. It does not generate a public search index. Do not use it as a local check.
- Before changing comments, exports, search, privacy or OG images, read the relevant guide in `docs/operations/README.md` and verify it against the implementation.
