import { openSocialDatabase, resolveSocialDatabaseTarget } from "./social-db"

const args = process.argv.slice(2)
const [command, id] = args
const targetArgs = command === "list" ? args.slice(1) : args.slice(2)

if (command !== "list" && command !== "approve" && command !== "reject") {
  throw new Error("Usage: bun scripts/moderate-comments.ts list --local <file>|--remote | approve|reject <receipt> --local <file>|--remote")
}
if ((command === "approve" || command === "reject") && !id) {
  throw new Error(`A comment receipt is required to ${command}.`)
}

const client = openSocialDatabase(resolveSocialDatabaseTarget(targetArgs))

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
    sql: "UPDATE SocialComments SET status = ?, moderatedAt = ? WHERE id = ? AND status IN ('pending', 'approved')",
    args: [status, new Date().toISOString(), id!],
  })
  if (result.rowsAffected !== 1) throw new Error(command === "approve" ? "No pending comment matched that receipt." : "No pending or approved comment matched that receipt.")
  console.log(`Comment ${status}.`)
}

client.close()
