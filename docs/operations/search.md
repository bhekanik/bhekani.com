# Deployment-local search

## Purpose and boundary

The deployed `/api/search` function builds a cached, server-only projection from Astro's installed content collections. It does **not** request `SITE/search-index.json`, so a protected preview searches the content bundled with that deployment rather than attempting an unauthenticated request to another origin. The legacy static artifact remains independently published for its existing consumers.

The projection indexes published posts, Micro entries and projects plus existing public book identities. It uses Astro `entry.id` for internal destinations and the S1 numeric-book-ID adapter for books. Book bodies are deliberately absent: legacy imports can contain private notes. Post and Micro bodies stay server-only inputs; no replacement full-body index is written to `public/`.

## Request contract

`GET /api/search?q=…` retains `results`, `total`, and per-result `score`. Successful responses add `mode` (`keyword` or `hybrid`) and a deterministic content `revision`.

- Fewer than two normalized Unicode letter/number code points, or more than 200 raw Unicode code points: `400`, `code: "invalid_query"`. Punctuation separates terms, so `Next.js` and `blah.chat` are valid while punctuation-only input is not.
- A genuine no-match is `200` with `results: []` and `total: 0`.
- The existing request limiter returns `429`, `code: "rate_limited"`, and `Retry-After`.
- A failed or invalid local projection returns `503`, `code: "search_unavailable"`; it is never presented as an empty library.
- Existing semantic retrieval remains optional. It continues to use the existing credentials and RRF when available; a provider error falls back to the local keyword result without changing the response into a failure. Its diagnostic is limited to static message/category/status values; provider errors, bodies, and visitor queries are never attached to Sentry.

Every semantic hit is rebuilt from the local projection. Unknown/deleted IDs, stale book paths, wrong types, and arbitrary provider URLs cannot reach the client. Project exits must be HTTP(S); unsafe or missing destinations fall back to `/projects`.

## UI lifecycle

`Search.svelte` is a labelled native `dialog` with a labelled input, polite status, ordinary result anchors, Close control, and standard Tab/Escape behavior. It keeps a generation per query together with an `AbortController`; closing, unmounting, or typing a new query cancels both pending debounce and the old request. A result can update the UI only while its dialog/query/generation is current. Close returns focus to the original trigger. The dialog uses `100dvh` sizing so the input and close control remain usable inside a mobile visual viewport.

## Evidence and maintenance

`test/search/` covers source-backed published-content identities and query-to-route ranking plus Unicode normalization, privacy filtering, API success/empty/400/429/503/hybrid fallback, static-only semantic diagnostics, stale semantic records, native-dialog focus/anchors, retry, reopen, abort, and reordered responses. The Vitest Vite config enables the Svelte Vite plugin solely so those DOM tests run in happy-dom.

When adding a collection, route, publication selector, book identity, or project URL, update `createSearchProjection` and the reviewed fixtures in `test/search/search.test.ts`. Keep search inputs limited to approved public fields; do not add unclassified book bodies or provider response data.
