import { ensureLocalSocialDatabaseParent, ensureSocialSchema, openSocialDatabase, resolveSocialDatabaseTarget } from "./social-db"

const target = resolveSocialDatabaseTarget(process.argv.slice(2))
ensureLocalSocialDatabaseParent(target)
const client = openSocialDatabase(target)
await ensureSocialSchema(client)

console.log("Social interaction tables and indexes are present.")
client.close()
