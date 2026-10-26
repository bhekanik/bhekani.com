# Dependency maintenance

## Update policy

This repository uses Bun and exact direct dependency versions. Refresh `bun.lock` with Bun, then run `bun run verify:offline`; do not use the deployment build as a local check because it may publish embeddings when credentials are present.

Use a transitive override only when **every** affected parent range accepts that version. Bun 1.3 does not support scoped/nested `overrides`, so a global override that would replace a different major or an exact dependency is not acceptable. Remove an override when a released parent update resolves the patched version naturally.

An audit count is an advisory-path count, not a count of unique vulnerable packages. Severity totals can therefore change when the resolved graph deduplicates or expands paths.

## Supported update line

The maintained compatible line is Astro 7.3.3, Svelte 5.57.2, Vitest 5.0.5, happy-dom 21.0.4, and Sharp 0.35.5. Vitest 5 requires Node `^22.12.0 || ^24.0.0 || >=26.0.0`; the project's Node 22 runtime satisfies that requirement.

The following in-range global overrides are intentional security fixes: `@babel/core`, `baseline-browser-mapping`, `brace-expansion`, `browserslist`, `devalue`, `fast-uri`, `http-cache-semantics`, `rollup`, `smol-toml`, `source-map-js`, `svgo`, `tar`, `vite`, and `ws`. They are within every installed parent range and are recorded in `package.json` so a fresh resolution cannot restore a known vulnerable patch.

## Held direct upgrades

- Astro 7.4.2, `@astrojs/mdx` 8.1.1, and `@astrojs/svelte` 9.1.1 require Node `>=22.23.4`. The declared runtime is Node 22 and the verified local runtime is 22.23.2, so these remain held until the deployed runtime is explicitly raised and verified.
- TypeScript 7.0.2 is held because the current Astro Svelte integration peers only `^5.3.3 || ^6.0.0`.
- Sentry remains at 10.76.2. Sentry 11 broadens default data collection and requires a separately reviewed restrictive privacy configuration; do not upgrade it as incidental dependency maintenance.
- Astro's current v7 documentation removes `@astrojs/db`, while this site still uses Astro DB. Replacing it is a separate migration, not a dependency-only change.

## Audit snapshot — 2026-10-26

`bun audit --json` after the compatible direct and global transitive updates reports **25 advisory-path entries across 7 package names**: 10 high, 12 moderate, and 3 low. This is reduced from the prior 90 entries across 22 names. The JSON evidence is retained with the work record; rerun the command before release because advisory data changes independently of the lockfile.

The table records package provenance, not a claim that each advisory is reachable in the deployed site.

| Package and advisory | Resolved path | Fixed line / why held | Exposure and smallest next action |
| --- | --- | --- | --- |
| `ajv` — [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) | `@astrojs/check → @astrojs/language-server → yaml-language-server → ajv@8.17.1`; Vercel routing utilities also retain `ajv@6.12.6` | 8.x is fixed at `8.18.0`; 6.x has no released `6.14.0` despite the advisory range. A global 8.x override would replace the Vercel path's 6.x major. | Local Astro-check and Vercel adapter dependency. Wait for `@astrojs/check`/language-server and Vercel routing releases that converge on a fixed line. |
| `nanoid` — [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv), [GHSA-xwg4-73v4-xw9w](https://github.com/advisories/GHSA-xwg4-73v4-xw9w) | `@astrojs/db@0.21.3 → nanoid@5.1.6` | Fixed at `5.1.16`; `@astrojs/db` permits it, but Bun cannot scope an override and other installed parents require nanoid 3.x. | Astro DB/build dependency. Update when `@astrojs/db` resolves the fixed patch naturally or Bun supports scoped overrides. |
| `path-to-regexp` — [GHSA-9wv6-86v2-598j](https://github.com/advisories/GHSA-9wv6-86v2-598j) | `@astrojs/vercel → @vercel/routing-utils@6.6.0 → path-to-regexp@6.1.0` | Fixed at `6.3.0`; the current routing utility declares the vulnerable `6.1.0` exactly (alongside its fixed alias). | Vercel adapter dependency. Wait for a routing-utilities/adapter release; do not override an exact upstream dependency. |
| `picomatch` — [GHSA-3v7f-55p6-f55p](https://github.com/advisories/GHSA-3v7f-55p6-f55p), [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) | `@vercel/nft → @rollup/pluginutils → picomatch@4.0.3`; `astro → unstorage → anymatch → picomatch@2.3.1` | Fixed at `4.0.4` and `2.3.2` respectively. A global override cannot safely satisfy both majors; Bun cannot scope it. | Build/dependency graph tooling. Wait for parents to refresh their patch ranges or scoped override support. |
| `postcss-selector-parser` — [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | `@tailwindcss/typography@0.5.20 → postcss-selector-parser@6.0.10` | Fixed at `7.1.6`; the latest typography release declares `6.0.10` exactly, so this is a major-range conflict. | Development styling tool. Track a Tailwind Typography release that adopts the fixed major. |
| `undici` — GHSA-3wwx-pv8p-q78v, GHSA-pmjh-fq2x-6v4x, GHSA-r53p-7pc4-xj5r, GHSA-rfgv-xxqx-mfg5, GHSA-3xpg-4rpp-hhhm, GHSA-2jfj-6hjv-fm6j, GHSA-2gqq-gqf2-x968, GHSA-w293-vg96-wgc3, GHSA-8436-99hf-9mmv, GHSA-vp8m-p9jh-q5pm, GHSA-rx4f-c7p8-82vq, GHSA-4qv8-2p9j-2685, GHSA-f72v-6w45-q472, GHSA-xjj6-f33q-929c | `astro → unifont@0.7.5 → undici@8.10.0` | Fixed at `8.12.2`, which requires Node `>=22.19.0`. The local runtime qualifies, but the deployed Node minor has not been verified. | Build-time Astro dependency. Verify the deployed Node minor, then add the in-range patch or update Astro/unifont. |
| `zod` — [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | `@astrojs/db`/`@astrojs/rss → zod@4.3.6`; Vercel CLI config retains exact `zod@4.1.11`; robots integration retains Zod 3 | Fixed at `4.6.6`; a global Zod 4 override would violate the Zod 3 parent and the Vercel package's exact version. | Build/config dependency. Wait for the direct Astro integrations and Vercel package line to converge, or use future scoped override support. |

## Review procedure

1. Run `bun audit --json` and inspect each remaining package with `bun pm why <package>`.
2. Check the advisory fixed range and parent ranges before changing the lockfile. Do not use audit ignores or force an incompatible major.
3. Prefer a released compatible parent update. Use a global override only when all parents accept it; document the removal condition above.
4. Run `bun run verify:offline` and re-audit. Review Vercel/runtime assumptions separately from dependency maintenance.

Primary sources: [Astro package metadata](https://www.npmjs.com/package/astro), [Astro MDX package metadata](https://www.npmjs.com/package/@astrojs/mdx), [Astro Svelte package metadata](https://www.npmjs.com/package/@astrojs/svelte), [Vitest package metadata](https://www.npmjs.com/package/vitest), and [Sentry v11 migration guidance](https://docs.sentry.io/platforms/javascript/guides/astro/migration/v10-to-v11/).
