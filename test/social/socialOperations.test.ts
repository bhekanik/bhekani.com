import { createClient } from "@libsql/client"
import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterAll, describe, expect, it } from "vitest"

const fixtureDirectory = mkdtempSync(join(tmpdir(), "social-operations-"))

function fixture(name: string, parent = "") {
  return join(fixtureDirectory, parent, `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.db`)
}

function runScript(script: string, args: string[], environment: Record<string, string>) {
  return execFileSync("bun", [script, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, ...environment },
  })
}

afterAll(() => rmSync(fixtureDirectory, { recursive: true, force: true }))

describe("social operations against disposable SQLite", () => {
  it("uses an explicit local target despite remote environment, preserves Views, and is idempotent", async () => {
    const local = fixture("social-operations-local")
    const remote = fixture("social-operations-remote")
    const client = createClient({ url: `file:${local}` })
    await client.execute("CREATE TABLE Views (slug TEXT PRIMARY KEY NOT NULL, count INTEGER NOT NULL)")
    await client.execute("INSERT INTO Views VALUES ('preserved', 9)")
    client.close()

    const environment = { ASTRO_DB_REMOTE_URL: `file:${remote}`, ASTRO_DB_APP_TOKEN: "test-only" }
    runScript("scripts/migrate-social-schema.ts", ["--local", local], environment)
    runScript("scripts/migrate-social-schema.ts", ["--local", local], environment)

    const migrated = createClient({ url: `file:${local}` })
    expect((await migrated.execute("SELECT count FROM Views WHERE slug = 'preserved'")).rows[0]?.count).toBe(9)
    expect((await migrated.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'SocialComments'")).rows).toHaveLength(1)
    migrated.close()
    expect(existsSync(remote)).toBe(false)
  })

  it("keeps concurrent/replayed SQL hearts idempotent and permits bounded moderation reversals", async () => {
    const local = fixture("social-operations-moderation", "first-use")
    expect(existsSync(dirname(local))).toBe(false)
    runScript("scripts/migrate-social-schema.ts", ["--local", local], {})
    expect(existsSync(local)).toBe(true)
    const client = createClient({ url: `file:${local}` })
    const like = "micro:back-to-vscode:7d6542fb-8d83-4f42-a968-fc6944d733b1"
    await Promise.all(Array.from({ length: 8 }, () => client.execute({
      sql: "INSERT INTO SocialLikes (id, contentType, contentId, browserId, createdAt) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING",
      args: [like, "micro", "back-to-vscode", "7d6542fb-8d83-4f42-a968-fc6944d733b1", "2026-10-26T12:00:00.000Z"],
    })))
    expect((await client.execute("SELECT COUNT(*) AS count FROM SocialLikes")).rows[0]?.count).toBe(1)
    await client.execute({
      sql: "INSERT INTO SocialComments (id, contentType, contentId, browserId, displayName, body, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["a9d735b0-2b3d-4307-9b6c-bcc2b9aafb9e", "micro", "back-to-vscode", "7d6542fb-8d83-4f42-a968-fc6944d733b1", "Reader", "Private", "pending", "2026-10-26T12:00:00.000Z"],
    })
    client.close()

    runScript("scripts/moderate-comments.ts", ["approve", "a9d735b0-2b3d-4307-9b6c-bcc2b9aafb9e", "--local", local], {})
    runScript("scripts/moderate-comments.ts", ["reject", "a9d735b0-2b3d-4307-9b6c-bcc2b9aafb9e", "--local", local], {})
    runScript("scripts/moderate-comments.ts", ["approve", "a9d735b0-2b3d-4307-9b6c-bcc2b9aafb9e", "--local", local], {})
    runScript("scripts/moderate-comments.ts", ["reject", "a9d735b0-2b3d-4307-9b6c-bcc2b9aafb9e", "--local", local], {})

    const moderated = createClient({ url: `file:${local}` })
    expect((await moderated.execute("SELECT status FROM SocialComments")).rows[0]?.status).toBe("rejected")
    moderated.close()
  })
})
