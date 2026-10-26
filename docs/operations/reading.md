# Article reading repair

## Scope and reason

The article route previously put the opening paragraph of the longest memory article below a 390×844 viewport, omitted usable narrow-screen contents navigation, rendered dates in the browser timezone, and did not restart Giscus after a client-side article navigation. The repair is limited to the article route and its owned reading components.

The smaller adequate alternative was a mobile-only padding reduction. It could not expose the opening body while retaining the full title and description, so the repair instead gives the existing header a compact mobile scale, wraps metadata, and moves the noncritical view count below the reading path.

## Behavior contract

- Article dates are formatted with a fixed UTC presentation contract.
- Posts with three or more h2/h3 headings show a native `Contents` disclosure below the header; a wide in-layout rail replaces it only from 1280px.
- The contents builder retains an h3 that appears before an h2.
- Progress tracks the article, uses one passive scroll listener plus a request-animation-frame update, and cleans its observer/listeners before every navigation swap.
- Giscus preserves its `title` mapping, resolves its theme from the document root, initializes per article visit, and is removed on navigation. Storage access is not needed for comments.
- Local heroes use Astro image processing with supplied `imageAlt` text. An image without authored alt text is deliberately decorative (`alt=""`), rather than exposing a source path.
- The article's code and tables scroll inside their own containers; the page does not widen at 320px.

## Verification

Run the focused helper/lifecycle tests during iteration:

```bash
bun run test --run test/utils/articleReading.test.ts
```

Then use the repository's safe full gate:

```bash
bun run verify:offline
```

For browser acceptance, use a disposable local DB and the assigned server port. Check the longest memory article at 320, 390×844, 768, and 1440px; use the Contents summary by keyboard; and make five archive/article/back client navigation cycles. Confirm one progress element, one Giscus loader/frame, and no document-level horizontal overflow at 320px.
