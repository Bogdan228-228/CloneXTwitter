import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

export const getConversations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const asParticipantOne = await ctx.db
      .query("conversations")
      .withIndex("by_participantOne", (q) =>
        q.eq("participantOneId", args.userId),
      )
      .collect();

    const asParticipantTwo = await ctx.db
      .query("conversations")
      .withIndex("by_participantTwo", (q) =>
        q.eq("participantTwoId", args.userId),
      )
      .collect();

    const conversations = [...asParticipantOne, ...asParticipantTwo].sort(
      (a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0),
    );

    return await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId =
          conv.participantOneId === args.userId
            ? conv.participantTwoId
            : conv.participantOneId;

        const otherUser = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", otherUserId))
          .first();

        return { ...conv, otherUser };
      }),
    );
  },
});

export const getOrCreateConversation = mutation({
  args: {
    currentUserId: v.string(),
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingChat = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("participantOneId"), args.currentUserId),
            q.eq(q.field("participantTwoId"), args.otherUserId),
          ),
          q.and(
            q.eq(q.field("participantOneId"), args.otherUserId),
            q.eq(q.field("participantTwoId"), args.currentUserId),
          ),
        ),
      )
      .first();

    if (existingChat) return existingChat._id;

    return await ctx.db.insert("conversations", {
      participantOneId: args.currentUserId,
      participantTwoId: args.otherUserId,
    });
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      text: args.text,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageText: args.text,
      lastMessageTime: now,
    });

    const conversation = await ctx.db.get(args.conversationId);

    if (conversation) {
      const receiverId =
        conversation?.participantOneId === args.senderId
          ? conversation.participantTwoId
          : conversation?.participantOneId;

      const receiver = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", receiverId))
        .first();
      const sender = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.senderId))
        .first();

      if (receiver?.pushToken) {
        await ctx.scheduler.runAfter(
          0,
          internal.pushNotifications.sendPushNotification,
          {
            pushToken: receiver.pushToken,
            title: "Нове повідомлення",
            body: `${sender!.username} надіслав вам повідомлення: ${args.text}`,
            data: { senderId: args.senderId },
          },
        );
      }
    }

    return messageId;
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();
  },
});
