# Check the Micro archive

Open `/micro/` to read short notes in the same archive shell as Writing. The page keeps published notes newest first, their full rendered bodies, each existing detail URL, a shared heart count, and a native approval-first comments disclosure.

Micro titles are optional. A titleless note does not gain an on-page heading. Its date-based fallback exists only where a textual label is required (metadata, search, accessibility, and OG image text).

The `Blog RSS` link still goes to `/rss.xml`. It is labelled as a blog feed because it does not include Micro notes.

Verify the repair locally:

```sh
bun run verify:offline
ASTRO_TELEMETRY_DISABLED=1 VERIFY_OFFLINE=1 ASTRO_DATABASE_FILE=.astro/verify.db bun run dev -- --port 4589
```

At 320px, 390px, and 1440px, compare `/micro/` with `/posts/` in both existing editions and themes. Confirm that note titles (when present) and visible `Permalink` links open the unchanged detail route, browser back returns to the archive, full note bodies remain visible without JavaScript, the heart control has a truthful count, comments can be disclosed and submitted for review, and the document has no horizontal overflow.

For comments, moderation, and the safe additive database setup, follow [native social interactions](./native-social-interactions.md).
