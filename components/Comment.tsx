import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/feed.styles";
import { useUser } from "@clerk/expo";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface CommentProps {
  content: string;
  _creationTime: number;
  user: {
    _id: Id<"users">;
    fullname: string;
    image: string;
  };
}

export function Comment({
  comment,
  onClose,
}: {
  comment: CommentProps;
  onClose: () => void;
}) {
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip",
  );

  return (
    <View style={styles.commentContainer}>
      {/* Аватар користувача */}
      <Link
        href={
          currentUser?._id === comment.user._id
            ? { pathname: "/(tabs)/profile" }
            : {
                pathname: "/user/[id]",
                params: { id: comment.user._id.toString() },
              }
        }
        asChild
      >
        <TouchableOpacity onPress={onClose}>
          <Image
            source={{ uri: comment.user.image }}
            style={styles.commentAvatar}
          />
        </TouchableOpacity>
      </Link>

      {/* Контент коментаря */}
      <View style={styles.commentContent}>
        <Text style={styles.commentUsername}>{comment.user.fullname}</Text>
        <Text style={styles.commentText}>{comment.content}</Text>
        <Text style={styles.commentTime}>
          {formatDistanceToNow(comment._creationTime, { addSuffix: true })}
        </Text>
      </View>
    </View>
  );
}
