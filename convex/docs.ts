import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const docSchema = v.object({
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
});

export const createDoc = mutation({
  args: {
    doc: docSchema,
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("docs", { ...args.doc });
    return fileId;
  },
});

export const updateDocPages = mutation({
  args: {
    crawlJobId: v.string(),
    completed: v.boolean(),
    pages: v.array(
      v.object({
        url: v.string(),
        title: v.string(),
        content: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Find doc by crawlJobId
    const doc = await ctx.db
      .query("docs")
      .filter((q) => q.eq(q.field("crawlJobId"), args.crawlJobId))
      .first();

    if (!doc) {
      throw new Error(`Doc not found for crawlJobId: ${args.crawlJobId}`);
    }

    // Update doc with pages and mark as completed
    await ctx.db.patch(doc._id, {
      pages: args.pages,
      completed: true,
      updatedAt: Date.now(),
    });

    return doc._id;
  },
});

export const getDoc = query({
  args: {
    docId: v.string(),
  },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("docs", args.docId);
    if (!id) return null;
    const doc = await ctx.db.get(id);
    return doc || null;
  },
});

export const getDocsByExternalId = query({
  args: {
    externalId: v.string(),
    noPages: v.boolean(),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("docs")
      .withIndex("byExternalId", (q) => q.eq("externalId", args.externalId))
      .filter((q) => q.eq(q.field("completed"), true))
      .order("desc")
      .collect();

    if (args.noPages) {
      return docs.map((doc) => ({
        _id: doc._id,
        url: doc.url,
        name: doc.name,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
    }
    return docs || [];
  },
});

export const getSingleDocsByExternalId = query({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("docs")
      .withIndex("byExternalId", (q) => q.eq("externalId", args.externalId))
      .filter((q) => q.eq(q.field("completed"), true))
      .order("desc")
      .first();

    return docs
      ? {
          _id: docs._id,
          url: docs.url,
          name: docs.name,
          createdAt: docs.createdAt,
          updatedAt: docs.updatedAt,
        }
      : null;
  },
});

// Check if the user has any docs with completed set to true
export const hasDocs = query({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("docs")
      .withIndex("byExternalId", (q) => q.eq("externalId", args.externalId))
      .filter((q) => q.eq(q.field("completed"), true))
      .first();
    return docs !== null;
  },
});
