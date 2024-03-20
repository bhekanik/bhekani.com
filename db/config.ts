import { column, defineDb, defineTable } from "astro:db"

export const View = defineTable({
  columns: {
    slug: column.text({ primaryKey: true }),
    count: column.number({ default: 0, notNull: true }),
    updatedAt: column.date({ default: new Date(), notNull: true }),
  },
  indexes: {
    view_slug_idx: { on: ["slug"], unique: true },
  },
})

export const IPHash = defineTable({
  columns: {
    ipHash: column.text({}),
    slug: column.text({
      references: () => View.columns.slug,
    }),
    updatedAt: column.date(),
  },
  foreignKeys: [
    {
      columns: ["slug"],
      references: () => View.columns.slug,
    },
  ],
  indexes: {
    iphash_slug_idx: { on: ["slug", "ipHash"], unique: true },
    ipHash_idx: { on: ["ipHash"], unique: true },
  },
})

export default defineDb({
  tables: {
    View,
    IPHash,
  },
})
