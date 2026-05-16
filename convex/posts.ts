import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return await ctx.storage.generateUploadUrl();
});

export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image URL not found");

    const postId = await ctx.db.insert("posts", {
      userId: currentUser._id,
      imageUrl,
      storageId: args.storageId,
      caption: args.caption,
      likes: 0,
      comments: 0,
    });

    await ctx.db.patch(currentUser._id, {
      posts: currentUser.posts + 1,
    });
    return postId;
  },
});

export const getPosts = query({
  handler: async (ctx) => {
    const currentUser = await getAuthenticatedUser(ctx);
    const posts = await ctx.db.query("posts").order("desc").collect();
    if (posts.length === 0) return [];

    return await Promise.all(
      posts.map(async (post) => {
        const postAuthor = (await ctx.db.get(post.userId))!;

        const like = await ctx.db
          .query("likes")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id),
          )
          .first();

        const bookmark = await ctx.db
          .query("bookmarks")
          .withIndex("by_both", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id),
          )
          .first();

        return {
          ...post,
          author: {
            _id: postAuthor._id,
            username: postAuthor.username,
            image: postAuthor.image,
          },
          isLiked: !!like,
          isBookmarked: !!bookmark,
        };
      }),
    );
  },
});

export const getPostById = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // 1. Отримуємо пост
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // 2. Отримуємо автора посту
    const author = await ctx.db.get(post.userId);
    if (!author) throw new Error("Author not found");

    // 3. Перевіряємо поточного користувача
    const currentUser = await getAuthenticatedUser(ctx);
    let isLiked = false;
    let isBookmarked = false;

    if (currentUser) {
      // Перевіряємо лайк (якщо є то true)
      const like = await ctx.db
        .query("likes")
        .withIndex("by_user_and_post", (q) =>
          q.eq("userId", currentUser._id).eq("postId", args.postId),
        )
        .first();
      if (like) isLiked = true;

      // Перевіряємо чи в закладках (якщо є то true)
      const bookmark = await ctx.db
        .query("bookmarks")
        .withIndex("by_both", (q) =>
          q.eq("userId", currentUser._id).eq("postId", args.postId),
        )
        .first();
      if (bookmark) isBookmarked = true;
    }

    return {
      ...post,
      author: {
        _id: author!._id,
        username: author!.username,
        image: author!.image,
      },
      isLiked,
      isBookmarked,
    };
  },
});

export const getPostsByUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Якщо userId передано — використовуємо його
    // Інакше — отримуємо поточного користувача
    const user = args.userId
      ? await ctx.db.get(args.userId)
      : await getAuthenticatedUser(ctx);

    if (!user) throw new Error("User not found");

    // Отримання постів користувача
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId || user._id))
      .collect();

    return posts;
  },
});

export const toggleLike = mutation({
  args: { postId: v.id("posts") },

  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", currentUser._id).eq("postId", args.postId),
      )
      .first();

    if (like) {
      await ctx.db.delete(like._id);

      await ctx.db.patch(post._id, {
        likes: Math.max(0, post.likes - 1),
      });

      return false;
    }

    await ctx.db.insert("likes", {
      userId: currentUser._id,
      postId: args.postId,
    });

    await ctx.db.patch(post._id, {
      likes: post.likes + 1,
    });

    if (currentUser._id !== post.userId) {
      await ctx.db.insert("notifications", {
        type: "like",
        receiverId: post.userId,
        senderId: currentUser._id,
        postId: args.postId,
      });
    }

    const receiver = await ctx.db.get(post.userId);

    if (receiver?.pushToken) {
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.sendPushNotification,
        {
          pushToken: receiver.pushToken,
          title: "Новий лайк ❤️",
          body: `${currentUser.username} вподобав ваш пост`,
          data: { postId: args.postId },
        },
      );
    }

    return true;
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    // 1. Отримання поточного користувача
    const currentUser = await getAuthenticatedUser(ctx);

    // 2. Отримання посту
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    // 3. Перевірка власника
    if (post.userId !== currentUser._id) {
      throw new Error("Not authorized to delete this post");
    }

    // 4. Видалення пов'язаних лайків
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // 5. Видалення пов'язаних коментарів
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // 6. Видалення пов'язаних закладок
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const bookmark of bookmarks) {
      await ctx.db.delete(bookmark._id);
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // 7. Видалення файлу зі Storage
    await ctx.storage.delete(post.storageId);

    // 8. Видалення посту
    await ctx.db.delete(args.postId);

    // 9. Зменшення лічильника постів користувача
    await ctx.db.patch(currentUser._id, {
      posts: Math.max(0, (currentUser.posts || 1) - 1),
    });
  },
});

export const getUserProfile = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");
    return user;
  },
});

export const isFollowing = query({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.followingId),
      )
      .first();

    return !!follow;
  },
});

async function updateFollowCounts(
  ctx: MutationCtx,
  followerId: Id<"users">,
  followingId: Id<"users">,
  isFollow: boolean,
) {
  const follower = await ctx.db.get(followerId);
  const following = await ctx.db.get(followingId);

  if (follower && following) {
    await ctx.db.patch(followerId, {
      following: follower.following + (isFollow ? 1 : -1),
    });
    await ctx.db.patch(followingId, {
      followers: following.followers + (isFollow ? 1 : -1),
    });
  }
}

export const toggleFollow = mutation({
  args: { followingId: v.id("users") },

  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    if (currentUser._id === args.followingId) {
      throw new Error("You cannot follow yourself");
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.followingId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await updateFollowCounts(ctx, currentUser._id, args.followingId, false);

      return false;
    }

    await ctx.db.insert("follows", {
      followerId: currentUser._id,
      followingId: args.followingId,
    });

    await updateFollowCounts(ctx, currentUser._id, args.followingId, true);

    await ctx.db.insert("notifications", {
      receiverId: args.followingId,
      senderId: currentUser._id,
      type: "follow",
    });

    const receiver = await ctx.db.get(args.followingId);

    if (receiver?.pushToken) {
      await ctx.scheduler.runAfter(
        0,
        internal.pushNotifications.sendPushNotification,
        {
          pushToken: receiver.pushToken,
          title: "Новий підписник 👤",
          body: `${currentUser.username} підписався на вас`,
          data: {
            userId: currentUser._id,
          },
        },
      );
    }

    return true;
  },
});
