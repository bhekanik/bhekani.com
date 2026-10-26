# Operate native hearts and comments

This runbook covers the small first-party interaction system on published Micro notes and blog posts. It does not change or import the existing GitHub/Giscus discussions.

## Database setup

`SocialLikes` and `SocialComments` are additive Astro DB tables. They do not alter `Views` or content rows. The committed migration script uses only `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, so it is safe to repeat and has no reset path.

Tested disposable-local command:

```sh
bun scripts/migrate-social-schema.ts --local .astro/micro-social.db
```

The coordinator must deliberately choose `--remote` in the established Astro DB environment before deploying the application route. `--remote` requires both `ASTRO_DB_REMOTE_URL` and `ASTRO_DB_APP_TOKEN`, and prints neither value. `--local <file>` creates a missing parent directory and always uses that file even if remote environment variables exist; commands without exactly one target fail closed. Do not use `--force-reset`, point this command at a views-test database, or create a new DB/account. Astro 7.3.3 in this checkout does not expose the older `astro db push` subcommand, so the tested script is the deployment mechanism for these two additive tables.

## API contract

`GET /api/social?contentType=micro|post&contentId=<published-id>` returns only a nonnegative `likeCount` and approved comment records (`id`, `displayName`, `body`, `createdAt`). Unknown or draft IDs return `404` before database access.

`POST /api/social` accepts bounded `application/json` only. Browser requests with an `Origin` must match the site origin; requests without `Origin` remain supported for future machine clients, but are not trusted or auto-approved. Reads, hearts, and comments are independently rate-limited per server-observed address (180, 60, and 20 requests per minute respectively); there is deliberately no production bypass.

```json
{"action":"like","contentType":"micro","contentId":"back-to-vscode","browserId":"<first-party-random-id>"}
```

Use `unlike` for an idempotent removal. The browser uses `likeStatus` with the same marker to restore its pressed state after navigation. The count is read from committed `SocialLikes` rows after the insert/delete. The primary key contains the content identity and first-party browser marker, so repeated likes cannot add duplicate votes and repeated unlikes cannot make the count negative.

```json
{"action":"comment","contentType":"post","contentId":"test","browserId":"<first-party-random-id>","receipt":"<uuid>","displayName":"Reader","body":"Plain text only"}
```

Comments accept a display name of up to 60 characters and body of up to 1,000 Unicode code points. The response contains the same unguessable receipt and `pending` status. Replaying the same receipt is idempotent. `receipt` checks require both receipt and browser marker and return no record to other markers; no public route enumerates private comments.

The server flags likely profanity in names and bodies, including simple punctuation and leetspeak obfuscation, but it never auto-publishes or rejects. It is a narrow maintenance aid, not a guarantee that text is safe or profanity-free. All comments, including clean machine submissions, start pending. Plain text is rendered with `textContent`, never as HTML.

## Private author state and limits

The browser stores at most ten successful pending receipts per page in first-party `localStorage`, separate from analytics. The submitting browser labels them **private · pending review**. Approved records reconcile to the public list by ID; rejected receipts are removed and shown as not published. If storage is denied or a saved payload is malformed, reading and posting still work. The active browser keeps its anonymous marker and pending state in memory across Astro navigation, but cannot restore a pending comment after a full reload. A network-uncertain submission preserves its receipt in the live form so retrying is idempotent.

This is anonymous-abuse mitigation, not proof of a unique human: users can clear storage, change browsers, automate requests, or share receipts. The per-process limiter is bounded but not distributed across server instances. Do not claim stronger anti-spam protection without a separately approved system.

## Owner moderation

List pending comments (including server-only flags) from the intended database:

```sh
bun scripts/moderate-comments.ts list --local .astro/micro-social.db
```

Approve or reject by receipt:

```sh
bun scripts/moderate-comments.ts approve <receipt> --local .astro/micro-social.db
bun scripts/moderate-comments.ts reject <receipt> --local .astro/micro-social.db
```

In the coordinator's established remote environment, replace the target with `--remote`; it uses the existing `ASTRO_DB_REMOTE_URL` and `ASTRO_DB_APP_TOKEN`. Approval can change a pending or rejected row to approved. Rejection can change a pending or already-approved row to rejected, immediately hiding it from public reads while preserving the author receipt's rejected status. There is no public endpoint, account, or new secret. Treat terminal output as private moderation material; do not copy comment bodies, browser markers, receipts, or flags into issue evidence or logs.
