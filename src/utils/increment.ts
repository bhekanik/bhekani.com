import { sql } from "astro:db"

export const increment = (column: unknown, value = 1) => {
  const statement = sql`${column} + ${value}`
  return statement
}
