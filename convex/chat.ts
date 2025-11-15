import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const chatSchema = v.object({
  externalId: v.string(), // Clerk user ID
  title: v.string(),
  docId: v.id("docs"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const createChat = mutation({
  args: {
    chat: chatSchema,
  },
  handler: async (ctx, args) => {
    const fileId = await ctx.db.insert("chat", { ...args.chat });
    return fileId;
  },
});

const messageSchema = v.object({
  chatId: v.id("chat"),
  docId: v.id("docs"),
  role: v.string(),
  id: v.string(),
  parts: v.array(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
  externalId: v.string(), // Clerk user ID
});

export const createMessage = mutation({
  args: {
    message: messageSchema,
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", { ...args.message });
    return messageId;
  },
});

export const getChats = query({
  args: {
    externalId: v.string(),
    docId: v.id("docs"),
  },
  handler: async (ctx, args) => {
    const chats = await ctx.db
      .query("chat")
      .withIndex("byExternalIdDocId", (q) =>
        q.eq("externalId", args.externalId).eq("docId", args.docId)
      )
      .filter((q) => q.eq(q.field("docId"), args.docId))
      .collect();
    return chats;
  },
});

export const getMessages = query({
  args: {
    chatId: v.string(),
    docId: v.id("docs"),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("chat", args.chatId);
    if (!id) {
      return null;
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("byChatIdDocIdExternalId", (q) =>
        q
          .eq("chatId", id)
          .eq("docId", args.docId)
          .eq("externalId", args.externalId)
      )
      .collect();
    return messages;
  },
});

export const deleteChat = mutation({
  args: {
    chatId: v.id("chat"),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the chat belongs to the user
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.externalId !== args.externalId) {
      throw new Error("Chat not found or unauthorized");
    }

    // Delete all messages associated with the chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("byChatIdDocIdExternalId", (q) =>
        q
          .eq("chatId", args.chatId)
          .eq("docId", chat.docId)
          .eq("externalId", args.externalId)
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the chat
    await ctx.db.delete(args.chatId);
  },
});

export const updateChatTitle = mutation({
  args: {
    chatId: v.id("chat"),
    externalId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the chat belongs to the user
    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.externalId !== args.externalId) {
      throw new Error("Chat not found or unauthorized");
    }

    // Update the chat title
    await ctx.db.patch(args.chatId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});
