import { Comment } from "@/components/Comment";
import { Loader } from "@/components/Loader";
import { Post } from "@/components/Post";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PostDetailsScreen() {
  // Отримуємо id з URL (expo-router)
  const { id } = useLocalSearchParams<{ id: Id<"posts"> }>();

  // Отримуємо пост
  const post = useQuery(api.posts.getPostById, { postId: id });

  // Отримуємо коментарі до цього ж посту
  const comments = useQuery(api.comments.getComments, { postId: id });

  if (post === undefined || comments === undefined) return <Loader />;
  if (post === null) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        {/* left */}
        <TouchableOpacity onPress={() => router.back()} style={styles.side}>
          <Ionicons name="arrow-back" size={24} color={COLORS.grey} />
        </TouchableOpacity>

        {/* center */}
        <Text style={styles.title}>Bookmark</Text>

        {/* right (порожній баланс) */}
        <View style={styles.side} />
      </View>

      {/* 1. Рендеримо сам пост */}
      <Post post={post} />

      {/* 2. Рендеримо список коментарів одразу під постом */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Comments</Text>

        {comments.length === 0 ? (
          <Text style={styles.noCommentsText}>No comments yet</Text>
        ) : (
          comments.map((comment) => (
            <Comment key={comment._id} comment={comment} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface,
  },

  side: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontFamily: "JetBrainsMono-Medium",
    fontWeight: "600",
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: COLORS.white,
    fontSize: 18,
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  commentsTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  noCommentsText: {
    color: COLORS.grey,
    textAlign: "center",
    marginTop: 10,
  },
});
