import { Loader } from "@/components/Loader";
import { NoBookmarksFound } from "@/components/NoBookmarksFound";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { useConvexAuth, useQuery } from "convex/react";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Bookmarks() {
  const { isAuthenticated } = useConvexAuth();
  const bookmarkedPosts = useQuery(
    api.bookmarks.getBookmarkedPosts,
    isAuthenticated ? {} : "skip",
  );

  if (bookmarkedPosts === undefined) {
    return <Loader />;
  }

  if (bookmarkedPosts.length === 0) {
    return <NoBookmarksFound />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 24,
            fontFamily: "JetBrainsMono-Medium",
            color: COLORS.primary,
          }}
        >
          Bookmarks
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 8,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {bookmarkedPosts.map((post) => {
          if (!post) return null;
          return (
            <View key={post._id} style={{ width: "33.33%", padding: 1 }}>
              <Link
                href={{
                  pathname: "/post/[id]" as any,
                  params: { id: post._id },
                }}
                asChild
              >
                <TouchableOpacity activeOpacity={0.8}>
                  <Image
                    source={post.imageUrl}
                    style={{ width: "100%", aspectRatio: 1 }}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              </Link>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
