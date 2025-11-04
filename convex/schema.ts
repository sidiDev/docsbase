import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    pictureUrl: v.optional(v.string()),
    externalId: v.string(), // Clerk user ID
  }).index("byExternalId", ["externalId"]),
});
