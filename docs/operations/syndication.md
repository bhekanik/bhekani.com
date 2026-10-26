# Syndication and machine-export contract

## Scope

Preserve the established blog RSS subscription and faithful published-writing exports. The scrolling Micro page is not an RSS feed: `/rss.xml` contains blog posts only. This contract adds neither a separate Micro/combined RSS feed nor book-body exports.

## RSS compatibility

- `/rss.xml` remains the published-blog feed: published posts only, ordered by
  original publication date.
- Navigable feed links use `https://www.bhekani.com`.
- Item GUIDs remain the exact apex-origin values published before the canonical
  host correction. `test/fixtures/rss-history.ts` records the 17 identifiers
  captured from the public feed on 2026-10-26.
- `@astrojs/rss` derives GUIDs from links, so the feed supplies its legacy GUID
  as item XML `customData`; this deliberately overrides that package default.

## Markdown exports

Published posts use `/posts/<slug>.md`; published Micro notes use `/micro/<slug>.md`. Both exclude drafts. `/llms-full.txt` remains a published-post aggregate, not a combined writing export.

The shared syntax-aware helper selects actual MDX imports and components by parsed source range. Code fences and inline code retain their authored whitespace. Known Quote and HTTP(S) YouTube/iframe wrappers become Markdown. A parse failure preserves the trimmed original text rather than guessing with a broad HTML regex.

`/llms.txt` labels the whole book collection as “catalogued,” not “read”, and lists selected public titles, authors and ratings. It does not include book bodies or private notes.

Post and Micro details advertise their own `text/markdown` alternate and a `/llms.txt` `describedby` link. Other pages do not advertise a per-entry Markdown alternate. Copy controls fetch the actual export; their lifecycle and the separate optional feedback guide are documented in [machine-readable writing](machine-readable-writing-feedback.md).

## Verification

Run the focused tests during edits:

```sh
bun run test --run test/utils/llms.test.ts test/utils/rss.test.ts test/utils/markdownExports.test.ts test/scripts/markdownCopy.test.ts test/content/machine-feedback-contract.test.ts
```

Then run the repository’s offline verification command:

```sh
bun run verify:offline
```

In emitted output, parse `dist/client/rss.xml`; its GUIDs must match the fixture while
its item links, sitemap, canonical links, and export URLs use `www`. A rendered
post must contain one title and `/favicon.ico`. Both post and Micro details must advertise their matching Markdown file; archive, book and project pages must not invent a per-entry Markdown alternate.

## Check the published destinations

Open `/micro/` and find **Blog RSS** below the note stream. It must still link to `/rss.xml` and describe blog-only delivery. A future Micro RSS feed requires a separate product decision.

Post sharing URLs already use `https://www.bhekani.com` as the canonical origin; the current template writes that origin directly. Preserve the existing post path shape and the exceptional historical apex RSS GUIDs; do not normalize those GUIDs along with navigation links.
