import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/explore";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

type PostResult = {
  _id: Id<"posts">;
  imageUrl: string;
  likes: number;
  author: { username: string };
};

export function PostGridItem({ post }: { post: PostResult }) {
  return (
    <Link href={`/post/${post._id}`} asChild>
      <TouchableOpacity style={styles.gridItem} activeOpacity={0.8}>
        <Image
          source={post.imageUrl}
          style={styles.gridImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
        {/* Overlay з кількістю лайків */}
        <View style={styles.gridOverlay}>
          <Ionicons name="heart" size={12} color="#fff" />
          <Text style={styles.gridLikes}>{post.likes}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
