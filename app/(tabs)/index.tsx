import { Loader } from "@/components/Loader";
import { Post } from "@/components/Post";
import { StoriesSection } from "@/components/StoriesSection";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { signOut } = useAuth();
  const posts = useQuery(api.posts.getPosts);

  if (posts === undefined) return <Loader />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clone Twitter (X)</Text>
        <TouchableOpacity
          onPress={() => signOut()}
          style={styles.signOutButton}
        >
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={({ item }) => <Post post={item} />}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={<StoriesSection />}
      />
    </View>
  );
}
