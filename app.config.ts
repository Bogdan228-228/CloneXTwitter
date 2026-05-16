import { ConfigContext, ExpoConfig } from "expo/config";

type AppEnv = "development" | "preview" | "production";

const APP_NAME = "CloneXTwitter";
const BUNDLE_IDENTIFIER = "com.bohdan_kapusta.clonextwitter";
const PACKAGE_NAME = "com.bohdan_kapusta.clonextwitter";
const SCHEME = "clonextwitter";
const PROJECT_SLUG = "clonextwitter";

const ICON = "./assets/images/icon.png";
const ADAPTIVE_ICON_FOREGROUND = "./assets/images/android-icon-foreground.png";
const ADAPTIVE_ICON_BACKGROUND = "./assets/images/android-icon-background.png";

export const getDynamicAppConfig = (environment: AppEnv) => {
  if (environment === "development") {
    return {
      name: `${APP_NAME} Dev`,
      bundleIdentifier: `${BUNDLE_IDENTIFIER}.dev`,
      packageName: `${PACKAGE_NAME}.dev`,
      icon: "./assets/images/icons/icon-dev.png",
      adaptiveIconForeground: ADAPTIVE_ICON_FOREGROUND,
      adaptiveIconBackground: ADAPTIVE_ICON_BACKGROUND,
      scheme: `${SCHEME}-dev`,
    };
  }

  if (environment === "preview") {
    return {
      name: `${APP_NAME} Preview`,
      bundleIdentifier: `${BUNDLE_IDENTIFIER}.preview`,
      packageName: `${PACKAGE_NAME}.preview`,
      icon: "./assets/images/icon-preview.png",
      adaptiveIconForeground: ADAPTIVE_ICON_FOREGROUND,
      adaptiveIconBackground: ADAPTIVE_ICON_BACKGROUND,
      scheme: `${SCHEME}-preview`,
    };
  }

  return {
    name: APP_NAME,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    packageName: PACKAGE_NAME,
    icon: ICON,
    adaptiveIconForeground: ADAPTIVE_ICON_FOREGROUND,
    adaptiveIconBackground: ADAPTIVE_ICON_BACKGROUND,
    scheme: SCHEME,
  };
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const environment = (process.env.APP_ENV as AppEnv) || "development";

  const dynamicConfig = getDynamicAppConfig(environment);

  console.log("⚙️ ENV:", environment);

  return {
    ...config,

    name: dynamicConfig.name,
    slug: PROJECT_SLUG,
    version: "1.0.0",
    orientation: "portrait",

    icon: dynamicConfig.icon,
    scheme: dynamicConfig.scheme,

    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: dynamicConfig.bundleIdentifier,

      infoPlist: {
        NSCameraUsageDescription:
          "This app uses the camera to take photos for posts.",
        NSPhotoLibraryUsageDescription:
          "This app accesses your photos to share in posts.",
      },
    },

    android: {
      package: dynamicConfig.packageName,

      adaptiveIcon: {
        backgroundColor: "#000000",
        foregroundImage: dynamicConfig.adaptiveIconForeground,
        backgroundImage: dynamicConfig.adaptiveIconBackground,
      },

      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.RECORD_AUDIO",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.POST_NOTIFICATIONS",
      ],

      googleServicesFile: "./google-services.json",
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#000000",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#000000",
          sounds: [],
        },
      ],
      "expo-secure-store",
      "expo-image-picker",
    ],

    extra: {
      env: environment,
      router: {},
    },
  };
};
