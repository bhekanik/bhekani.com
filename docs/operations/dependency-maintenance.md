# Dependency maintenance

Verify the committed dependency graph before release:

```sh
bun install --frozen-lockfile --ignore-scripts
bun run verify:offline
bun audit --json
```

Direct dependencies are exact pins. Do not hand-edit `bun.lock`, force an incompatible major, or add an audit ignore. The current manifest has no overrides.

## Dependabot requires the Bun ecosystem

Inspect updater failures with:

```sh
gh run list --workflow 'Dependabot Updates' --limit 10
gh run view <run-id> --log
```

The root update entry in `.github/dependabot.yml` uses `package-ecosystem: "bun"` to update `package.json` and `bun.lock`. The npm ecosystem rejects this repository's Bun-only lockfile, as recorded in [the failed Astro update](https://github.com/bhekanik/bhekani.com/actions/runs/41247563443). Both Bun and GitHub Actions updates have a seven-day cooldown for version updates.

## Deliberate fresh resolution

`bun install` does not refresh versions already recorded in an existing lockfile. Use a fresh resolution only to investigate a verified compatible security patch, and do it in an isolated worktree so no unrelated work is removed:

```sh
git worktree add ../bhekani-resolution <commit>
cd ../bhekani-resolution
backup="$TMPDIR/bhekani-bun.lock"
mv bun.lock "$backup"
bun install --ignore-scripts --minimum-release-age=0
git diff -- package.json bun.lock
bun install --frozen-lockfile --ignore-scripts
bun run verify:offline
```

`--minimum-release-age=0` is a narrow exception used after confirming the affected registry patch and every parent range; keep Bun's normal minimum-release-age policy for ordinary maintenance. Review the lockfile diff before retaining it, then remove the isolated worktree. Keep the backup outside the repository and never commit it.

A fresh Bun resolution may select different fixed patches for different accepted major ranges. For example, it can resolve nanoid 5 and 3, or picomatch 4 and 2, at the same time. Prefer that behavior to a global override. Use an override only when every installed parent accepts it, and remove it when an ordinary fresh resolution selects the fixed version.

## Runtime contract

`package.json` declares Node `>=22.19.0 <23`, the minimum required by the resolved `undici@8.12.3`. `bun run verify:node-runtime` prints the local Node version and whether it satisfies that contract, then fails outside it; both `build` and `verify:offline` run this gate first.

Vercel supports only Node 22.x and 24.x, honors a valid `engines.node` semver range, and rolls out minor/patch updates within an available major. The `<23` upper bound therefore constrains Vercel to its Node 22 line without changing Project Settings. Check the deployment build log before release to confirm the exact Node minor; this repository does not expose it publicly.

Sources: [Vercel supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) and [Undici 8.12.3 package metadata](https://www.npmjs.com/package/undici/v/8.12.3).

## Direct pin transitions

These are the exact direct changes from `4b17255` to this maintenance line. Entries that only lost a caret were already at the pinned version.

| Package | Before | After |
| --- | --- | --- |
| `@astrojs/check` | `0.9.10` | `0.9.12` |
| `@astrojs/sitemap` | `3.7.3` | `3.7.4` |
| `@astrojs/vercel` | `11.0.7` | `11.0.16` |
| `@fontsource-variable/jetbrains-mono` | `^5.2.8` | `5.3.0` |
| `@fontsource-variable/source-serif-4` | `5.3.0` | `5.3.1` |
| `@sentry/astro` | `^10.43.0` | `10.76.2` |
| `@tailwindcss/vite` | `^4.1.18` | `4.3.3` |
| `@upstash/vector` | `^1.2.2` | `1.2.3` |
| `astro` | `7.3.1` | `7.3.3` |
| `astro-embed` | `^0.13.0` | `0.14.0` |
| `astro-expressive-code` | `^0.44.1` | `0.44.3` |
| `astro-og-canvas` | `^0.13.0` | `0.13.2` |
| `astro-robots-txt` | `^1.0.0` | `1.0.0` |
| `canvaskit-wasm` | `^0.42.0` | `0.42.0` |
| `case` | `^1.6.3` | `1.6.3` |
| `clsx` | `^2.1.1` | `2.1.1` |
| `date-fns` | `^4.1.0` | `4.4.0` |
| `gray-matter` | `^4.0.3` | `4.0.3` |
| `openai` | `^7.5.0` | `7.43.0` |
| `sharp` | `^0.35.1` | `0.35.5` |
| `string-width` | `^8.1.0` | `8.3.0` |
| `svelte` | `^5.46.1` | `5.57.2` |
| `tailwind-merge` | `^3.4.0` | `3.7.0` |
| `tailwindcss` | `^4.1.18` | `4.3.3` |
| `typescript` | `^6.0.3` | `6.0.3` |
| `wrap-ansi` | `^10.0.0` | `10.0.2` |
| `@sveltejs/vite-plugin-svelte` | `7.3.0` | `7.3.1` |
| `@tailwindcss/typography` | `^0.5.19` | `0.5.20` |
| `@testing-library/dom` | `^10.4.1` | `10.4.2` |
| `@testing-library/jest-dom` | `^7.0.1` | `7.0.1` |
| `@vitest/ui` | `^4.0.18` | `5.0.5` |
| `happy-dom` | `^20.0.11` | `21.0.4` |
| `husky` | `^9.1.7` | `9.1.7` |
| `lint-staged` | `^17.0.5` | `17.6.0` |
| `vitest` | `^4.0.18` | `5.0.5` |

## Held framework upgrades

- Astro 7.4.2, `@astrojs/mdx` 8.1.1, and `@astrojs/svelte` 9.1.1 require Node `>=22.23.4`. The project contract intentionally guarantees only `>=22.19.0 <23`, so keep this line until its higher Node floor is adopted deliberately and verified in a Vercel build.
- TypeScript 7.0.2 is held because the current Astro Svelte integration peers only `^5.3.3 || ^6.0.0`.
- Sentry remains at 10.76.2. Sentry 11 changes default data collection and needs separate privacy review.
- Astro's current v7 documentation removes `@astrojs/db`; replacing it is a migration, not dependency maintenance.

## Audit snapshot — 2026-10-26

A clean Bun resolution from the exact pins, with no overrides and `--minimum-release-age=0`, reduced the audit to **3 advisory-path entries across 3 packages**: 2 high and 1 moderate. The sanitized command output is retained at [`audits/2026-10-26-bun-audit.json`](audits/2026-10-26-bun-audit.json). Audit entries identify dependency paths, not proven reachability in the deployed site.

| Advisory | Resolved path and exposure | Fixed line and bounded next action |
| --- | --- | --- |
| [`path-to-regexp` GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j) | `@astrojs/vercel@11.0.16 → @vercel/routing-utils@6.6.0 → path-to-regexp@6.1.0`; Vercel adapter build/runtime dependency | `6.3.0` is fixed, but routing utilities declare `6.1.0` exactly (while separately aliasing fixed 6.3.0). Wait for an adapter/routing-utilities release; do not contradict the exact parent contract. |
| [`postcss-selector-parser` GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | `@tailwindcss/typography@0.5.20 → postcss-selector-parser@6.0.10`; development styling dependency | `7.1.6` is fixed, but the latest Typography package declares `6.0.10` exactly. Track a Typography release that adopts the fixed major. |
| [`zod` GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | `@astrojs/db` and RSS now resolve `zod@4.6.7`; the remaining path is `@astrojs/vercel → @vercel/functions → @vercel/cli-config@0.3.3 → zod@4.1.11`; adapter build/config dependency | `4.6.6` is fixed. Wait for the Vercel package to replace its exact 4.1.11 pin; a global Zod 4 override would also conflict with the installed Zod 3 parent. |

The fresh graph also resolves the previously held compatible patches without overrides: `nanoid@5.1.16` beside 3.3.20, `picomatch@4.0.7` beside 2.3.2, `ajv@8.20.0` beside 6.15.0, and `undici@8.12.3`. Their parent ranges accept those versions. Re-run the audit before release because advisory data changes independently of the lockfile.
