import { createClient } from "@libsql/client"
import { resolve } from "node:path"

const remoteUrl = process.env.ASTRO_DB_REMOTE_URL
const localFile = process.env.ASTRO_DATABASE_FILE
if (!remoteUrl && !localFile) {
  throw new Error("Set ASTRO_DATABASE_FILE for a local database or use the coordinator-provided remote Astro DB environment.")
}

const client = createClient(remoteUrl
  ? { url: remoteUrl, authToken: process.env.ASTRO_DB_APP_TOKEN }
  : { url: `file:${resolve(localFile!)}` })

await client.batch([
  `CREATE TABLE IF NOT EXISTS SocialLikes (
    id TEXT PRIMARY KEY NOT NULL,
    contentType TEXT NOT NULL,
    contentId TEXT NOT NULL,
    browserId TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS social_likes_content ON SocialLikes (contentType, contentId)",
  `CREATE TABLE IF NOT EXISTS SocialComments (
    id TEXT PRIMARY KEY NOT NULL,
    contentType TEXT NOT NULL,
    contentId TEXT NOT NULL,
    browserId TEXT NOT NULL,
    displayName TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL,
    moderationFlags TEXT,
    createdAt TEXT NOT NULL,
    moderatedAt TEXT
  )`,
  "CREATE INDEX IF NOT EXISTS social_comments_public ON SocialComments (contentType, contentId, status, createdAt)",
  "CREATE INDEX IF NOT EXISTS social_comments_pending ON SocialComments (status, createdAt)",
], "write")

console.log("Social interaction tables and indexes are present.")
client.close()
