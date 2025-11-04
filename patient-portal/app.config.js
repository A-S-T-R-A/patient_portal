export default {
  expo: {
    name: "Patient Portal",
    slug: "patient-portal",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.remedico.patientportal",
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          "We need access to your photo library to allow you to share images with your doctor.",
        NSCameraUsageDescription:
          "We need access to your camera to allow you to take and share photos with your doctor.",
        NSLocationWhenInUseUsageDescription:
          "We use your location to help you find nearby clinics (optional).",
        NSUserTrackingUsageDescription:
          "We do not track you across other apps or websites.",
        NSHealthShareUsageDescription:
          "We may access your health data if you choose to share it with your doctor.",
        NSHealthUpdateUsageDescription:
          "We may update your health data if you choose to share it with your doctor.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.remedico.patientportal",
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      [
        "expo-apple-authentication",
        {
          appleAuthenticationButtonStyle: "BLACK",
        },
      ],
    ],
    scheme: "patient-portal",
    extra: {
      privacyPolicyUrl:
        "https://patient-portal-admin-service-production.up.railway.app/privacy",
      termsOfServiceUrl:
        "https://patient-portal-admin-service-production.up.railway.app/terms",
    },
    experiments: {
      typedRoutes: false,
    },
  },
};

