# Maintain bounded view counts and collection settings

Use this page when changing `/api/views` or browser collection. Keep anonymous aggregate article views and basic Sentry error reporting, with replay and automatic interaction collection disabled. This is not a consent system or a zero-tracking claim.

## View-count contract

`GET` and `POST /api/views?slug=<published-post-id>` accept the deployed query-string shape. The Svelte counter keeps one `POST` for each `client:load` mount. It does not retry automatically.

- A slug must be a bounded route-shaped string and must match a published Astro post `id`. The endpoint reads the post collection's identity and frontmatter only; it does not render a body or read the books collection.
- Invalid and prototype-like inputs return `400`. Drafts and unknown IDs return `404`. These requests do not reach the limiter or Astro DB.
- A published post with no DB row returns `200` and `{ "slug": "...", "count": 0 }` on `GET`.
- `POST` uses Astro DB's `insert ... onConflictDoUpdate` increment, so the database performs the increment atomically. A successful request returns the resulting count.
- A database or published-identity failure returns JSON `503` with `code: "views_unavailable"`; it never substitutes a made-up count. Diagnostics contain only static method/category/status tags.
- Live-count responses use `Cache-Control: no-store`. The existing limiter policy is unchanged. Its normal `429` response retains `Retry-After` and rate-limit headers.

The client accepts only a nonnegative finite integer `count`. It displays zero, renders `Views unavailable` for unavailable, rate-limited, empty, or malformed responses, and aborts its pending request on unmount. An article body does not depend on this island resolving.

Run the focused contract checks while editing:

```sh
bun run test --run test/views/viewsApi.test.ts test/views/ViewCounter.test.ts
```

Then use the repository-wide offline gate:

```sh
bun run verify:offline
```

## Effective browser configuration

The browser Sentry initialization retains `browserTracingIntegration` and its existing trace sampling. It no longer installs `replayIntegration`, and both replay sample rates are explicitly `0`. This leaves error reporting configured without enabling session replay or changing the DSN.

PostHog still initializes with the existing public project ingestion ID and the EU ingestion host. It explicitly preserves load pageviews with `capture_pageview: true` and disables autocapture, dead-click and rage-click detection, heatmaps, PostHog exception capture, and session recording. The local type declaration names those options so a typo cannot silently widen collection.

The relevant provider behavior is documented by [Sentry's replay configuration](https://docs.sentry.io/platforms/javascript/session-replay/configuration/) and [PostHog's JavaScript configuration](https://posthog.com/docs/libraries/js/config). Sentry documents that replay only starts from its integration or nonzero replay sampling. PostHog documents that `autocapture: false` does not disable pageviews, so the pageview setting remains explicit.

## Page-running services and destinations

This is an implementation inventory, not a privacy policy.

| Surface | When it runs | Current behavior |
| --- | --- | --- |
| Sentry | Browser initialization when its existing DSN is supplied | Errors and configured traces remain available; replay is disabled. |
| PostHog | Every `BaseLayout` page | Existing ingestion host and pageviews remain; replay and automatic interaction/error collection are disabled. The project ingestion ID is public configuration, not an administration secret. |
| Aggregate views | Published article counter on `client:load` | One anonymous aggregate increment per page mount after published-ID validation. |
| Native hearts and comments | Published post/Micro interaction controls | Loads public counts/comments and restores browser-specific status. A browser marker accompanies private status/receipt reads and explicit heart/comment writes; successful pending submissions have a browser-local copy. These are first-party interaction records, not analytics events. |
| Giscus | Article and book comment mounts | Loads Giscus from `giscus.app`, maps discussions by title, and stores comments in GitHub Discussions. |
| Book covers | Book pages/cards that have an ISBN | The browser requests cover images from `covers.openlibrary.org`; ordinary local post images are processed and served by the site. |

Booking and newsletter links are destinations rather than page-running scripts: `/unoffice-hours` links to `cal.com`, while the newsletter links to `justreflections.bhekani.com`. Following either link starts a visit on that external destination; this site does not embed either service.

For the native interaction tables, receipt scope, browser storage limits and owner moderation, use [native interactions](native-social-interactions.md). Do not infer a retention period or verified identity from the existence of a browser marker.

Do not add provider credentials, manual capture events, a DSN, provider account settings, retention claims, or a consent/legal claim as part of this repair. Review those separately with a named decision and a current provider configuration check.
