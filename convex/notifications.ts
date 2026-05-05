import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./users";

export const getNotifications = query({
  handler: async (ctx) => {
    // 1. Отримання поточного користувача
    const currentUser = await getAuthenticatedUser(ctx);

    // 2. Отримання всіх сповіщень для користувача
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_receiver", (q) => q.eq("receiverId", currentUser._id))
      .order("desc")
      .collect();

    // 3. Збагачення даними
    const notificationsWithInfo = await Promise.all(
      notifications.map(async (notification) => {
        // Отримання відправника
        const sender = (await ctx.db.get(notification.senderId))!;

        // Отримання посту (якщо є)
        let post = null;
        if (notification.postId) {
          post = await ctx.db.get(notification.postId);
        }

        // Отримання коментаря (якщо тип = comment)
        let comment = null;
        if (notification.type === "comment" && notification.commentId) {
          comment = await ctx.db.get(notification.commentId);
        }

        return {
          ...notification,
          sender: {
            _id: sender._id,
            username: sender.username,
            image: sender.image,
          },
          post,
          comment: comment?.content,
        };
      }),
    );

    return notificationsWithInfo;
  },
});

export const deleteNotification = mutation({
  // Визначаємо аргументи, які приймає функція
  args: {
    notificationId: v.id("notifications"), // ID сповіщення для видалення
  },
  handler: async (ctx, args) => {
    // 1. Отримуємо поточного авторизованого користувача
    const currentUser = await getAuthenticatedUser(ctx);

    // 2. Знаходимо сповіщення в базі даних
    const notification = await ctx.db.get(args.notificationId);

    // 3. Перевірка: чи існує сповіщення
    if (!notification) {
      throw new Error("Notification not found");
    }

    // 4. Перевірка безпеки: чи належить сповіщення цьому користувачу
    // Це запобігає видаленню чужих сповіщень
    if (notification.receiverId !== currentUser._id) {
      throw new Error("You can only delete your own notifications");
    }

    // 5. Видаляємо сповіщення з бази даних
    await ctx.db.delete(args.notificationId);

    return { success: true };
  },
});
