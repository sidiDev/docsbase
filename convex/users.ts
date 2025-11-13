import {
  internalMutation,
  mutation,
  query,
  QueryCtx,
} from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { v, Validator } from "convex/values";

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const updateUserSettings = mutation({
  args: {
    externalId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await userByExternalId(ctx, args.externalId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      firstName: args.firstName,
      lastName: args.lastName,
      username: args.username,
    });

    return { success: true };
  },
});

export const getUserByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await userByExternalId(ctx, args.externalId);
  },
});

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const updateProfilePicture = mutation({
  args: {
    externalId: v.string(),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await userByExternalId(ctx, args.externalId);

    if (!user) {
      throw new Error("User not found");
    }

    // Get the URL for the uploaded file
    const pictureUrl = await ctx.storage.getUrl(args.storageId as any);

    if (!pictureUrl) {
      throw new Error("Failed to get picture URL");
    }

    await ctx.db.patch(user._id, {
      pictureUrl,
    });

    return { success: true, pictureUrl };
  },
});

export const removeProfilePicture = mutation({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await userByExternalId(ctx, args.externalId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      pictureUrl: undefined,
    });

    return { success: true };
  },
});

export const deleteUserAccount = mutation({
  args: {
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await userByExternalId(ctx, args.externalId);

    if (!user) {
      throw new Error("User not found");
    }

    // Delete all user's documents
    const userDocs = await ctx.db
      .query("docs")
      .withIndex("byExternalId", (q) => q.eq("externalId", args.externalId))
      .collect();

    for (const doc of userDocs) {
      await ctx.db.delete(doc._id);
    }

    // Delete the user record
    await ctx.db.delete(user._id);

    return { success: true };
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const userAttributes = {
      firstName: data.first_name ?? undefined,
      lastName: data.last_name ?? undefined,
      username: data.username ?? undefined,
      externalId: data.id,
      pictureUrl: data.image_url,
    };

    const user = await userByExternalId(ctx, data.id);
    if (user === null) {
      await ctx.db.insert("users", userAttributes);
    } else {
      await ctx.db.patch(user._id, userAttributes);
    }
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.delete(user._id);
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`
      );
    }
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByExternalId(ctx, identity.subject);
}

async function userByExternalId(ctx: QueryCtx, externalId: string) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
    .unique();
}
