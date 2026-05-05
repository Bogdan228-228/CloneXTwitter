import { COLORS } from "@/constants/theme";
import { styles } from "@/styles/notifications.styles";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export function NoNotificationsFound() {
  return (
    <View style={[styles.container, styles.centered]}>
      <Ionicons name="notifications-outline" size={48} color={COLORS.primary} />
      <Text style={{ fontSize: 20, color: COLORS.white }}>
        No notifications yet
      </Text>
    </View>
  );
}
