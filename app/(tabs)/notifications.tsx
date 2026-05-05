import { Loader } from "@/components/Loader";
import { NoNotificationsFound } from "@/components/NoNotificationsFound";
import { SwiperNotificationItem } from "@/components/SwiperNotificationItem";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/notifications.styles";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Text, View } from "react-native";
import { FlatList, GestureHandlerRootView } from "react-native-gesture-handler";

export default function Notifications() {
  const { isAuthenticated } = useConvexAuth();
  const notifications = useQuery(
    api.notifications.getNotifications,
    isAuthenticated ? {} : "skip",
  );

  const deleteNotification = useMutation(api.notifications.deleteNotification);
  const handleDeleteNotification = async (
    notificationId: Id<"notifications">,
  ) => {
    try {
      // Викликаємо mutation на сервері
      await deleteNotification({ notificationId });
      // Convex автоматично оновить UI після успішного видалення
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  if (notifications === undefined) {
    return <Loader />;
  }

  if (notifications.length === 0) {
    return <NoNotificationsFound />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <SwiperNotificationItem
              notification={item}
              onDelete={handleDeleteNotification}
            />
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </GestureHandlerRootView>
  );
}
