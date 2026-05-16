import { PostGridItem } from "@/components/PostGridItem";
import { UserResultItem } from "@/components/UserResultItem";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/explore";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const toggleFollow = useMutation(api.posts.toggleFollow);

  // Популярні пости для початкового стану (без пошуку)
  const explorePosts = useQuery(
    api.search.getExplorePosts,
    isAuthenticated ? {} : "skip",
  );

  // Результати пошуку — активуються тільки коли є текст
  const userResults = useQuery(
    api.search.searchUsers,
    isAuthenticated && searchQuery.trim()
      ? { searchQuery: searchQuery.trim() }
      : "skip",
  );

  const postResults = useQuery(
    api.search.searchPosts,
    isAuthenticated && searchQuery.trim()
      ? { searchQuery: searchQuery.trim() }
      : "skip",
  );

  // Обробка натискання Follow/Unfollow
  const handleFollowToggle = useCallback(
    async (userId: Id<"users">) => {
      try {
        await toggleFollow({ followingId: userId });
      } catch (error) {
        console.error("Error toggling follow:", error);
      }
    },
    [toggleFollow],
  );

  // Очистити пошук
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
  };

  const isLoading = userResults === undefined || postResults === undefined;
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* ── ХЕДЕР ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      {/* ── РЯДОК ПОШУКУ ── */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORS.grey}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users or #hashtags..."
          placeholderTextColor={COLORS.grey}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setIsSearchActive(text.length > 0);
          }}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch}>
            <Ionicons name="close-circle" size={20} color={COLORS.grey} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── ВМІСТ ── */}
      {!hasQuery ? (
        // ── Початковий стан: сітка популярних постів ──
        <>
          <Text style={styles.sectionTitle}>Popular Posts</Text>
          {explorePosts === undefined ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginTop: 40 }}
            />
          ) : (
            <FlatList
              data={explorePosts}
              numColumns={3}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
              renderItem={({ item }) => <PostGridItem post={item} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons
                    name="photo-library"
                    size={48}
                    color={COLORS.grey}
                  />
                  <Text style={styles.emptyText}>No posts yet</Text>
                </View>
              }
            />
          )}
        </>
      ) : (
        // ── Режим пошуку: результати ──
        <FlatList
          data={[]} // FlatList використовується лише як scroll-контейнер
          keyExtractor={() => "search-results"}
          ListHeaderComponent={
            <>
              {isLoading ? (
                <ActivityIndicator
                  color={COLORS.primary}
                  style={{ marginTop: 40 }}
                />
              ) : (
                <>
                  {/* Секція: Користувачі */}
                  {userResults && userResults.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>People</Text>
                      {userResults.map((user) => (
                        <UserResultItem
                          key={user._id}
                          user={user}
                          onFollowToggle={handleFollowToggle}
                        />
                      ))}
                    </>
                  )}

                  {/* Секція: Пости */}
                  {postResults && postResults.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Posts</Text>
                      <View style={styles.postsGrid}>
                        {postResults.map((post) => (
                          <PostGridItem key={post._id} post={post} />
                        ))}
                      </View>
                    </>
                  )}

                  {/* Порожній стан пошуку */}
                  {userResults?.length === 0 && postResults?.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <Ionicons
                        name="search-outline"
                        size={48}
                        color={COLORS.grey}
                      />
                      <Text style={styles.emptyText}>
                        No results for ({searchQuery})
                      </Text>
                      <Text style={styles.emptySubtext}>
                        Try searching by username or #hashtag
                      </Text>
                    </View>
                  )}
                </>
              )}
            </>
          }
          renderItem={() => null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}
