import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Генерація URL для завантаження файлу
export const generateUploadUrl = mutation(async (ctx) => {
  // Перевірка автентифікації
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  // Генерація підписаного URL (дійсний ~1 годину)
  return await ctx.storage.generateUploadUrl();
});

// Створення посту в базі даних
export const createPost = mutation({
  args: {
    caption: v.optional(v.string()), // Текст твіту (необов'язковий)
    storageId: v.id("_storage"), // ID файлу в Storage
  },
  handler: async (ctx, args) => {
    // 1. Перевірка автентифікації
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // 2. Пошук користувача в БД
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!currentUser) throw new Error("User not found");

    // 3. Отримання публічного URL зображення
    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) throw new Error("Image URL not found");

    // 4. Створення посту
    const postId = await ctx.db.insert("posts", {
      userId: currentUser._id,
      imageUrl,
      storageId: args.storageId,
      caption: args.caption,
      likes: 0,
      comments: 0,
    });

    // 5. Оновлення лічильника постів користувача
    await ctx.db.patch(currentUser._id, {
      posts: currentUser.posts + 1,
    });

    return postId;
  },
});
