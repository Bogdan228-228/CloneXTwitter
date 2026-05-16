import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

/**
 * Пошук користувачів за username або fullname.
 * Повертає масив користувачів (без поточного).
 */
export const searchUsers = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    // Якщо рядок пошуку пустий — повернути порожній масив
    if (!args.searchQuery.trim()) return [];

    const currentUser = await getAuthenticatedUser(ctx);

    // Пошук по username
    const byUsername = await ctx.db
      .query("users")
      .withSearchIndex("search_by_username", (q) =>
        q.search("username", args.searchQuery),
      )
      .take(10);

    // Пошук по fullname
    const byFullname = await ctx.db
      .query("users")
      .withSearchIndex("search_by_fullname", (q) =>
        q.search("fullname", args.searchQuery),
      )
      .take(10);

    // Об'єднати результати, прибрати дублікати та поточного користувача
    const combined = [...byUsername, ...byFullname];
    const seen = new Set<string>();
    const unique = combined.filter((user) => {
      if (seen.has(user._id) || user._id === currentUser._id) return false;
      seen.add(user._id);
      return true;
    });

    // Для кожного знайденого користувача перевірити — чи поточний підписаний
    return await Promise.all(
      unique.map(async (user) => {
        const isFollowing = await ctx.db
          .query("follows")
          .withIndex("by_both", (q) =>
            q.eq("followerId", currentUser._id).eq("followingId", user._id),
          )
          .first();

        return {
          _id: user._id,
          username: user.username,
          fullname: user.fullname,
          image: user.image,
          followers: user.followers,
          isFollowing: !!isFollowing,
        };
      }),
    );
  },
});

/**
 * Пошук постів за текстом у caption (підтримка хештегів типу #ua).
 */
export const searchPosts = query({
  args: {
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) return [];

    const currentUser = await getAuthenticatedUser(ctx);

    const posts = await ctx.db
      .query("posts")
      .withSearchIndex("search_by_caption", (q) =>
        q.search("caption", args.searchQuery),
      )
      .take(20);

    return await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.userId);
        const like = await ctx.db
          .query("likes")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id),
          )
          .first();

        return {
          ...post,
          author: {
            _id: author!._id,
            username: author!.username,
            image: author!.image,
          },
          isLiked: !!like,
        };
      }),
    );
  },
});

/**
 * Отримати популярні пости для початкового екрана Explore (без пошуку).
 * Сортує за кількістю лайків (desc).
 */
export const getExplorePosts = query({
  handler: async (ctx) => {
    await getAuthenticatedUser(ctx); // перевірка автентифікації

    // Завантажити всі пости, відсортовані за датою, та відсіяти найпопулярніші
    const posts = await ctx.db.query("posts").order("desc").take(50);

    // Сортування за лайками на клієнті (Convex не підтримує order by likes)
    const sorted = posts.sort((a, b) => b.likes - a.likes).slice(0, 30);

    return await Promise.all(
      sorted.map(async (post) => {
        const author = await ctx.db.get(post.userId);
        return {
          _id: post._id,
          imageUrl: post.imageUrl,
          likes: post.likes,
          author: {
            username: author!.username,
          },
        };
      }),
    );
  },
});
