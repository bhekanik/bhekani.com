# Operate machine-readable writing and optional feedback

## Published Markdown

Published blog posts are available at `/posts/<slug>.md`; published Micro notes are available at `/micro/<slug>.md`. Each is generated from the source entry with the syntax-aware MDX export helper. Draft entries are excluded. The normal HTML page advertises its matching Markdown through `rel="alternate" type="text/markdown"` and points to `/llms.txt` with `rel="describedby"`.

Use **Copy as Markdown** on post details, Micro details, or the Micro feed to fetch the actual export. The control announces a visible result only after the clipboard write completes. **Open Markdown** is always available when Clipboard permissions, the Clipboard API, or the network fails; navigation cancels unfinished copies.

`/llms.txt` is the concise discovery index. `/llms-full.txt` remains the published-blog aggregate only. The separate `/machine-feedback.md` guide contains the optional feedback invitation and the API details so neither the normal article nor the index turns into a posting manual.

## Optional feedback

The site asks: “If this helped with your work, please leave a comment sharing what helped or where you’d push back.” It is an ordinary, optional request. A client must not submit feedback unless its user has authorized that specific comment. Nothing on the site posts automatically.

Use the live native interaction contract in [native social interactions](./native-social-interactions.md). In brief: public reads use `GET /api/social?contentType=post|micro&contentId=<published-id>`; authorized comments use a bounded JSON `POST /api/social` with `action: "comment"`, a random browser marker, and a random receipt. A successful comment response is `pending`, not public. The owner must approve it before public reads can include it. A client can only reconcile its own receipt by presenting the same receipt and browser marker; it cannot enumerate pending bodies.

The guide requests user authorization; the anonymous API cannot verify that an automated reader obtained it. Owner moderation is the enforced publication boundary, not proof of the sender's identity or permission.

Do not run mutation examples as a health check, fabricate feedback, claim a self-reported automated name is verified identity, or send private task context. Use a local disposable database for implementation testing; only an authorized maintainer should run production writes and moderation.

## Verify a change

```sh
bun run test --run test/utils/markdownExports.test.ts test/scripts/markdownCopy.test.ts test/content/machine-feedback-contract.test.ts
bun run verify:offline
```

Open a post and a Micro note, copy each and compare the supplied clipboard bytes with its export. Navigate while a copy is waiting and confirm that it cannot write after the control loses ownership. Exercise denied/unavailable Clipboard and failed network requests; **Open Markdown** must remain usable. Check the public guide and `/llms.txt` through their routes. Their source files are generated-page inputs, not a separate docs website; change those inputs in an explicitly authorized code task rather than patching built output.
