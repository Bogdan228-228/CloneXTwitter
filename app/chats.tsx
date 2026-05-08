import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatsListScreen() {
  const { user } = useUser();
  const router = useRouter();

  const conversations = useQuery(api.chat.getConversations, {
    userId: user?.id || "",
  });

  const openChat = (
    conversationId: string,
    otherUserId: string,
    otherUserName: string,
  ) => {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: conversationId,
        otherUserId,
        name: otherUserName,
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          marginBottom: 5,
        }}
      >
        <View
          style={{
            width: 40,
            alignItems: "flex-start",
          }}
        >
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Ionicons name="arrow-back" size={24} color={COLORS.grey} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flex: 1,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: COLORS.primary,
              fontFamily: "JetBrainsMono-Medium",
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            My Chats
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {conversations === undefined ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 50, color: "#888" }}>
              You do not have any chats yet.
            </Text>
          }
          renderItem={({ item }) => {
            const otherUserId =
              item.participantOneId === user?.id
                ? item.participantTwoId
                : item.participantOneId;
            const otherUserName =
              item.otherUser?.fullname ||
              item.otherUser?.username ||
              "Unknown User";

            return (
              <TouchableOpacity
                style={{
                  padding: 16,
                  borderBottomWidth: 1,
                  borderColor: "#333",
                  flexDirection: "row",
                  alignItems: "center",
                }}
                onPress={() => openChat(item._id, otherUserId, otherUserName)}
              >
                <Image
                  source={{
                    uri:
                      item.otherUser?.image ||
                      "https://gravatar.com/avatar/placeholder?d=mp",
                  }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginRight: 15,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontWeight: "bold", color: "#fff", fontSize: 16 }}
                  >
                    {otherUserName}
                  </Text>
                  <Text
                    style={{ color: "#aaa", marginTop: 4 }}
                    numberOfLines={1}
                  >
                    {item.lastMessageText || "Немає повідомлень"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
