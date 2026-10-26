import { column, defineDb, defineTable } from "astro:db"

const Views = defineTable({
  columns: {
    slug: column.text({ primaryKey: true }),
    count: column.number({
      default: 1,
    }),
  },
})

const SocialLikes = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    contentType: column.text(),
    contentId: column.text(),
    browserId: column.text(),
    createdAt: column.date(),
  },
  indexes: [{ name: "social_likes_content", on: ["contentType", "contentId"] }],
})

const SocialComments = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    contentType: column.text(),
    contentId: column.text(),
    browserId: column.text(),
    displayName: column.text(),
    body: column.text(),
    status: column.text(),
    moderationFlags: column.text({ optional: true }),
    createdAt: column.date(),
    moderatedAt: column.date({ optional: true }),
  },
  indexes: [
    { name: "social_comments_public", on: ["contentType", "contentId", "status", "createdAt"] },
    { name: "social_comments_pending", on: ["status", "createdAt"] },
  ],
})

export default defineDb({
  tables: { Views, SocialLikes, SocialComments },
})
