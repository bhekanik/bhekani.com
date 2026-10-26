import { ensureSocialSchema, openSocialDatabase, resolveSocialDatabaseTarget } from "./social-db"

const client = openSocialDatabase(resolveSocialDatabaseTarget(process.argv.slice(2)))
await ensureSocialSchema(client)

console.log("Social interaction tables and indexes are present.")
client.close()
