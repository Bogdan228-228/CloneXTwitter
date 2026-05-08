import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

export const createUser = mutation({
  args: {
    username: v.string(),
    fullname: v.string(),
    email: v.string(),
    bio: v.optional(v.string()),
    image: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    // Перевірка чи користувач вже існує
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) return;

    // Створення нового користувача
    await ctx.db.insert("users", {
      username: args.username,
      fullname: args.fullname,
      email: args.email,
      bio: args.bio,
      image: args.image,
      clerkId: args.clerkId,
      followers: 0,
      following: 0,
      posts: 0,
    });
  },
});

export const getAuthenticatedUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const currentUser = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();
  if (!currentUser) throw new Error("User not found");

  return currentUser;
};

export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    return user;
  },
});

export const updateProfile = mutation({
  args: {
    fullname: v.string(),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Отримання поточного користувача
    const currentUser = await getAuthenticatedUser(ctx);

    // 2. Оновлення профілю
    await ctx.db.patch(currentUser._id, {
      fullname: args.fullname,
      bio: args.bio,
    });
  },
});

export const getStoriesUsers = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const now = Date.now();

    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
      .collect();

    const followingUsers = await Promise.all(
      follows.map((f) => ctx.db.get(f.followingId)),
    );

    const hasActiveStory = async (userId: Id<"users">) => {
      const story = await ctx.db
        .query("stories")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.gt(q.field("expiresAt"), now))
        .first();
      return !!story;
    };

    const currentUserHasStory = await hasActiveStory(currentUser._id);

    const stories = [
      {
        id: currentUser._id,
        username: "You",
        avatar: currentUser.image,
        hasStory: currentUserHasStory,
      },
      ...(await Promise.all(
        followingUsers
          .filter((user) => user !== null)
          .map(async (user) => ({
            id: user!._id,
            username: user!.username,
            avatar: user!.image,
            hasStory: await hasActiveStory(user!._id),
          })),
      )),
    ];

    return stories;
  },
});
