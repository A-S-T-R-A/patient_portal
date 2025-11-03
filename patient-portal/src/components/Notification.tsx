import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

type NotificationOptions = {
  title: string;
  body: string;
};

/**
 * Unified notification component that automatically uses the correct
 * notification system based on the platform:
 * - Web: react-native-toast-message (works on web too)
 * - Native (iOS/Android): expo-notifications + toast for immediate feedback
 */
export async function showNotification({
  title,
  body,
}: NotificationOptions): Promise<void> {
  const isWeb = Platform.OS === "web";

  // Always show toast for immediate visual feedback
  Toast.show({
    type: "info",
    text1: title,
    text2: body,
    position: "top",
    visibilityTime: 4000,
  });

  // For native platforms, also schedule a system notification
  if (!isWeb) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Failed to show notification:", error);
    }
  }
}

/**
 * Request notification permissions (needed for native platforms)
 */
export async function requestNotificationPermissions(): Promise<void> {
  if (Platform.OS === "web") {
    // For web, request browser notification permissions
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  } else {
    // For native, request expo notification permissions
    try {
      await Notifications.requestPermissionsAsync();
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    } catch (error) {
      console.error("Failed to request notification permissions:", error);
    }
  }
}
