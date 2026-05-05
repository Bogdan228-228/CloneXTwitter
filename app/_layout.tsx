import { InitialLayout } from "@/components/InitialLayout";
import { ClerkAndConvexProvider } from "@/providers/ClerkAndConvexProvider";
import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "SpaceMono-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ClerkAndConvexProvider>
      <SafeAreaView
        onLayout={onLayoutRootView}
        style={{ flex: 1, backgroundColor: "#000000" }}
      >
        <InitialLayout />
      </SafeAreaView>
    </ClerkAndConvexProvider>
  );
}
