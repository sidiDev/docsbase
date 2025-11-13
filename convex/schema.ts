import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    externalId: v.string(), // Clerk user ID
    emailNotifications: v.optional(v.boolean()),
  }).index("byExternalId", ["externalId"]),
  docs: defineTable({
    url: v.string(),
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    externalId: v.string(), // Clerk user ID
    crawlJobId: v.string(),
    completed: v.boolean(),
    pages: v.optional(
      v.array(
        v.object({
          url: v.string(),
          title: v.string(),
          content: v.string(),
          createdAt: v.number(),
          updatedAt: v.number(),
        })
      )
    ),
  }).index("byExternalId", ["externalId"]),
  chat: defineTable({
    externalId: v.string(), // Clerk user ID
    title: v.string(),
    docId: v.id("docs"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("byExternalIdDocId", ["externalId", "docId"]),
  messages: defineTable({
    chatId: v.id("chat"),
    docId: v.id("docs"),
    role: v.string(),
    id: v.string(),
    parts: v.array(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
    externalId: v.string(), // Clerk user ID
  })
    .index("byChatId", ["chatId"])
    .index("byDocId", ["docId"])
    .index("byExternalId", ["externalId"])
    .index("byChatIdDocIdExternalId", ["chatId", "docId", "externalId"]),
});
