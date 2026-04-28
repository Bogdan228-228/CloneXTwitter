import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: "black", marginBottom: 20 }}>Index</Text>

      <TouchableOpacity
        onPress={handleSignOut}
        style={{
          backgroundColor: "#ff0000",
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white" }}>Вийти</Text>
      </TouchableOpacity>
    </View>
  );
}
