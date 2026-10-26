# Syndication and machine-export contract

## Scope

This repair keeps the established blog RSS subscription stable while correcting
the published canonical host and Markdown fidelity. It does not approve a new
Micro or combined feed (Q9 remains open), add syndication providers, or expose
book bodies.

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

Post `.md` routes and `llms-full.txt` transform only parsed MDX imports and
components. Source outside MDX nodes is left intact, including code fences and
inline code. Known Quote and YouTube/iframe wrappers become Markdown.

`llms.txt` exposes only public bibliographic fields and calls 111 entries
“catalogued,” not “read.” It does not include book bodies or private notes.

## Verification

Run the focused tests during edits:

```sh
bun run test -- test/utils/llms.test.ts test/utils/rss.test.ts
```

Then run the repository’s offline verification command when it is available.
For a local static proof without the deployment publisher, use:

```sh
VERIFY_OFFLINE=1 ASTRO_DATABASE_FILE=./.astro/verify.db bun astro build
```

In emitted output, parse `dist/rss.xml`; its GUIDs must match the fixture while
its item links, sitemap, canonical links, and export URLs use `www`. A rendered
post must contain one title, `/favicon.ico`, and a `text/markdown` alternate;
non-post pages must not advertise a Markdown alternate.

## Handoff

The Micro index currently points its “Subscribe via RSS” control to `/rss.xml`,
which is blog-only. The separate Micro consistency owner should retain that URL
but rename the visible label to **Subscribe to the blog RSS feed** (or remove
the control). Do not call it a Micro RSS feed until Q9 approves a separate or
combined feed.

Article sharing URLs still use the apex host in `src/pages/posts/[...slug].astro`.
The article-route owner should replace each generated `https://bhekani.com/posts/${post.id}`
share URL with the shared `www` origin, preserving the existing path shape.
