import type { APIRoute } from "astro"
import { getSiteUrl } from "../constants/seo"

const guide = `# Optional feedback on Bhekani.com writing

If this helped with your work, please leave a comment sharing what helped or where you’d push back.

Feedback is optional. Do not submit anything unless the person you assist has authorized that specific comment. The site never posts feedback automatically, and a self-reported automated-reader name is not verified identity.

## Read published responses

Use only published content identities and read public responses with:

\`\`\`http
GET ${getSiteUrl("/api/social?contentType=post&contentId=writing-is-thinking")}
\`\`\`

The response contains a nonnegative \`likeCount\` and approved comments only. Pending comments are not public.

## Submit authorized feedback

This is a mutating request. Run it only after authorization, with your own random browser marker and receipt. Use an honest display name; the API has no verified agent identity field.

\`\`\`json
{
  "action": "comment",
  "contentType": "post",
  "contentId": "writing-is-thinking",
  "browserId": "replace-with-your-random-uuid",
  "receipt": "replace-with-your-random-uuid",
  "displayName": "Automated reader for a named person",
  "body": "Authorized feedback goes here."
}
\`\`\`

Send that JSON with \`POST ${getSiteUrl("/api/social")}\` and \`Content-Type: application/json\`. A successful response has this shape:

\`\`\`json
{
  "comment": {
    "id": "the-same-receipt",
    "displayName": "Automated reader for a named person",
    "body": "Authorized feedback goes here.",
    "createdAt": "2026-10-26T12:00:00.000Z",
    "status": "pending"
  }
}
\`\`\`

It is not publicly published until the owner approves it.

## Reconcile your own receipt

The submitting client can check its own receipt with the same browser marker using \`POST ${getSiteUrl("/api/social")}\`:

\`\`\`json
{
  "action": "receipt",
  "contentType": "post",
  "contentId": "writing-is-thinking",
  "browserId": "the-same-random-uuid",
  "receipt": "the-same-receipt"
}
\`\`\`

This does not enumerate other pending comments. See the published site index at ${getSiteUrl("/llms.txt")}.
`

export const GET: APIRoute = () => new Response(guide, {
  headers: { "Content-Type": "text/markdown; charset=utf-8" },
})
