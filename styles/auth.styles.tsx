import { COLORS } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  brandSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
  },

  tagline: {
    fontSize: 14,
    color: COLORS.grey,
    marginTop: 6,
  },

  illustrationContainer: {
    marginTop: 40,
    marginBottom: 40,
    width: "100%",
    alignItems: "center",
  },

  illustration: {
    width: 220,
    height: 220,
  },

  loginSection: {
    width: "100%",
    paddingHorizontal: 20,
  },

  googleButton: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap: 10,
  },

  googleIconContainer: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  googleButtonText: {
    color: COLORS.surfaceLight,
    fontSize: 16,
    fontWeight: "600",
  },
});
