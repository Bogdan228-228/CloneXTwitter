import { InitialLayout } from "@/components/InitialLayout";
import { ClerkAndConvexProvider } from "@/providers/ClerkAndConvexProvider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <ClerkAndConvexProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
        <InitialLayout />
      </SafeAreaView>
    </ClerkAndConvexProvider>
  );
}
