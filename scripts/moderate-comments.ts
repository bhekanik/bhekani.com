import { createClient } from "@libsql/client"
import { resolve } from "node:path"

const [command, id] = process.argv.slice(2)

if (command !== "list" && command !== "approve" && command !== "reject") {
  throw new Error("Usage: bun scripts/moderate-comments.ts list | approve <receipt> | reject <receipt>")
}
if ((command === "approve" || command === "reject") && !id) {
  throw new Error(`A comment receipt is required to ${command}.`)
}

const remoteUrl = process.env.ASTRO_DB_REMOTE_URL
const localFile = process.env.ASTRO_DATABASE_FILE
if (!remoteUrl && !localFile) {
  throw new Error("Set ASTRO_DATABASE_FILE for a local database or use the coordinator-provided remote Astro DB environment.")
}

const client = createClient(remoteUrl
  ? { url: remoteUrl, authToken: process.env.ASTRO_DB_APP_TOKEN }
  : { url: `file:${resolve(localFile!)}` })

if (command === "list") {
  const result = await client.execute(`
    SELECT id, contentType, contentId, displayName, body, moderationFlags, createdAt
    FROM SocialComments
    WHERE status = 'pending'
    ORDER BY createdAt ASC
  `)
  console.table(result.rows)
} else {
  const status = command === "approve" ? "approved" : "rejected"
  const result = await client.execute({
    sql: "UPDATE SocialComments SET status = ?, moderatedAt = ? WHERE id = ? AND status = 'pending'",
    args: [status, new Date().toISOString(), id!],
  })
  if (result.rowsAffected !== 1) throw new Error("No pending comment matched that receipt.")
  console.log(`Comment ${status}.`)
}

client.close()
