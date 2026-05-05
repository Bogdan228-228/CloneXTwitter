import { v } from "convex/values";
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

export const getStoriesUsers = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);

    // Отримати користувачів, на яких підписаний поточний користувач
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
      .collect();

    const followingIds = follows.map((f) => f.followingId);

    // Отримати дані цих користувачів
    const followingUsers = await Promise.all(
      followingIds.map((id) => ctx.db.get(id)),
    );

    // Сформувати список stories
    const stories = [
      // Поточний користувач завжди перший ("You")
      {
        id: currentUser._id,
        username: "You",
        avatar: currentUser.image,
        hasStory: false, // або перевірка чи є активна story
      },
      // Користувачі, на яких підписані
      ...followingUsers
        .filter((user) => user !== null)
        .map((user) => ({
          id: user!._id,
          username: user!.username,
          avatar: user!.image,
          hasStory: true, // або реальна перевірка
        })),
    ];

    return stories;
  },
});
