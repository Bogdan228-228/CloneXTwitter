import { COLORS } from "@/constants/theme";
import { styles } from "@/styles/auth.styles";
import { useSSO } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGooglePress = async () => {
    if (loading) return;

    try {
      setLoading(true);
      console.log("Starting Google OAuth...");

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      console.log("SSO result:", { createdSessionId });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        console.log("Session activated, redirecting...");
        router.replace("/(tabs)");
      } else {
        console.error("No session created");
        Alert.alert("Помилка", "Не вдалося створити сесію");
      }
    } catch (error: any) {
      console.error("Google login failed", error);
      Alert.alert(
        "Помилка",
        error?.message || "Не вдалося увійти через Google",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.container}>
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <Ionicons
              name="accessibility-outline"
              size={24}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.appName}>CloneTwitter</Text>
          <Text style={styles.tagline}>Find your next adventure</Text>

          <View style={styles.illustrationContainer}>
            <Image
              resizeMode="contain"
              source={require("@/assets/images/android-icon-foreground.png")}
              style={styles.illustration}
            />
          </View>

          <View style={styles.loginSection}>
            <TouchableOpacity
              style={[styles.googleButton, loading && { opacity: 0.6 }]}
              activeOpacity={0.9}
              onPress={handleGooglePress}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <Ionicons name="logo-google" size={24} color="#111827" />
                  </View>

                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
