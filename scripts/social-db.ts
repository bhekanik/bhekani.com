import { createClient, type Client } from "@libsql/client"
import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"

type Environment = Record<string, string | undefined>

export type SocialDatabaseTarget =
  | { kind: "local"; path: string }
  | { kind: "remote"; url: string; authToken: string }

export function resolveSocialDatabaseTarget(args: string[], environment: Environment = process.env): SocialDatabaseTarget {
  if (args[0] === "--local" && args.length === 2 && args[1]) {
    return { kind: "local", path: resolve(args[1]) }
  }

  if (args.length === 1 && args[0] === "--remote") {
    const url = environment.ASTRO_DB_REMOTE_URL
    const authToken = environment.ASTRO_DB_APP_TOKEN
    if (!url || !authToken) throw new Error("--remote requires the established ASTRO_DB_REMOTE_URL and ASTRO_DB_APP_TOKEN environment variables.")
    return { kind: "remote", url, authToken }
  }

  throw new Error("Choose exactly one database target: --local <database-file> or --remote.")
}

export function openSocialDatabase(target: SocialDatabaseTarget): Client {
  return createClient(target.kind === "local"
    ? { url: `file:${target.path}` }
    : { url: target.url, authToken: target.authToken })
}

export function ensureLocalSocialDatabaseParent(target: SocialDatabaseTarget) {
  if (target.kind === "local") mkdirSync(dirname(target.path), { recursive: true })
}

export async function ensureSocialSchema(client: Client) {
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
}
