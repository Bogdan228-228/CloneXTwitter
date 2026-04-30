import { useAuth as useClerkAuth } from "@clerk/expo";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

export function InitialLayout() {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn) {
      if (inAuthGroup) {
        router.replace("/(tabs)");
      }
    } else {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    }

    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
