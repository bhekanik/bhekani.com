# bhekani.com

Personal site and blog built with Astro 7, Tailwind CSS v4 and Svelte, hosted on Vercel. Published posts and Micro notes have shared hearts and approval-first native comments; existing Giscus discussions remain available. Astro DB stores interactions and aggregate views. Search uses deployment-local content with optional OpenAI/Upstash semantic retrieval.

Live at <https://www.bhekani.com>. The [colophon](https://www.bhekani.com/colophon/) covers the type, colour and sound choices.

## Run it

Bun only, with Node.js `>=22.19.0 <23`. Start without provider credentials:

```bash
bun install --frozen-lockfile
bun run verify:offline
ASTRO_DATABASE_FILE=.astro/verify.db VERIFY_OFFLINE=1 bun run dev
```

Open `http://localhost:4321`. The verification command creates the ignored local database before the dev server uses it. Repeat `bun run verify:offline` before opening a PR; it resets only that disposable verification database, so do not keep local moderation fixtures there.

`verify:offline` runs the non-watch Vitest suite, Astro checks, content sync, and a local static build. It uses the ignored `.astro/verify.db` database, disables build telemetry and Sentry for the verification build, and does not generate embeddings, publish to the vector index, or require provider credentials.

The pre-push hook runs `verify:offline`, so it does not publish embeddings.

`bun run build` is the deployment build. Its `prebuild` step clears the Astro content cache and attempts embedding publication when provider credentials are present; it also runs `astro build --remote`. It does not generate a public full-body search index. Do not use it for local verification.

For optional integrations, consult the [operations index](docs/operations/README.md). `.env.example` contains Sentry placeholders, not a complete provider configuration. Semantic retrieval needs `OPENAI_API_KEY`, `UPSTASH_VECTOR_REST_URL` and `UPSTASH_VECTOR_REST_TOKEN`; remote Astro DB needs its existing URL/token. Local keyword search and offline checks do not require them.

## Where things live

- `src/styles/global.css`: design tokens (OKLCH, `light-dark()`), type scale, shared classes
- `src/scripts/feedback.ts`: click sound and haptics
- `src/content/{posts,micro,books,projects}`: content collections, schemas in `src/content/_schemas`
- `PRODUCT.md`: audience, voice and design principles
- [Operations](docs/operations/README.md): comments/moderation, search, exports, share images, privacy and maintenance

## Read or copy writing

Open a published post or Micro note and choose **Copy as Markdown** or **Open Markdown**. The Micro stream offers the same controls. Post exports use `/posts/<slug>.md`; Micro exports use `/micro/<slug>.md`. `/llms.txt` indexes published writing, while `/llms-full.txt` remains blog-only.

The [optional feedback guide](https://www.bhekani.com/machine-feedback.md) asks for specific, user-authorized feedback. Native submissions remain pending until owner approval; the submitting browser displays its private copy. See [writing exports](docs/operations/machine-readable-writing-feedback.md) and [moderation](docs/operations/native-social-interactions.md) for the full contracts.

## Shipping

Branch from fetched `origin/main`, run the offline gate, open a PR and check CI, schema, security and Vercel results. After merge, verify the production deployment's merge SHA, target and public aliases, then exercise the changed user journey. A ready preview or merged PR is not production acceptance.

## Why `prebuild` deletes `node_modules/.astro`

Vercel restores `node_modules` from the previous deploy, and Astro's content layer caches rendered markdown in `node_modules/.astro`. Expressive Code names its stylesheet by a hash of its CSS, so after a dependency bump the cached HTML pointed at `ec.<old>.css` while the build emitted `ec.<new>.css`, and every code block lost its highlighting in production. Clearing the cache before each build keeps the two in step.
