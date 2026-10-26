# Verify the local library

Run the library contract before changing library presentation:

```sh
bun run test --run test/library/library.test.ts
ASTRO_DATABASE_FILE=.astro/verify.db bun run lint
```

The targeted test checks the source-backed read shelf and the pure display rules. It does not call a metadata provider or read book bodies into a new projection.

## What this repair preserves

At commit `b1a18b2be3c2b23531a9105bf84c88f4b27a7676`, the local source contains 111 book files: 61 on the read shelf, 14 currently reading, and 36 to read. The index still uses only the 61 read books. Of those, 53 have a positive personal rating and 25 have a frontmatter review.

The contract hashes all 111 numeric book record IDs, the personal fields used by the repair, and each Markdown body without printing their contents. It protects these baseline digests:

| Surface | SHA-256 digest |
| --- | --- |
| Numeric book record IDs | `fbba808df0456d0b00c4b49a97081e77e496f89c57d9b1f7edf79ae19d9cce32` |
| Personal fields | `8dce232c33e4abeac3546b18c26dd2025e3ecaad0c6d52e67fe94383695d1702` |
| Bodies | `aa26d4789f6654954711288e8e3f00ae02cc3386e5557b5cb6ce74fd8821f221` |

## Display rules

- Count a personal rating only when it is finite, greater than zero, and no more than five. Zero, missing, and invalid values display as `Not rated` and do not lower the average.
- Group the read index by a valid `dateAdded` value and label it `Added to log in <year>`. Invalid or absent values appear under `Date unknown`; this repair does not infer a completion date from imported data.
- Use an Open Library cover or outbound ISBN action only for an ISBN-10 or ISBN-13 with a valid checksum. A missing or invalid identifier leaves the textual cover fallback in place.
- Generate book-tag routes from read-book tags only. Post tags remain on their existing routes. The current source has no book tags, so `/books/tags/` states that plainly.

## Boundaries

This is a display and normalization repair. It does not alter book source records, add a metadata provider, request remote metadata, expose book bodies or notes, or broaden the read shelf. Reconcile original reading history before changing date provenance or exposing more shelves.
