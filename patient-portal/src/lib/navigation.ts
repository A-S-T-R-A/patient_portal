import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(routeName: string, params?: Record<string, any>) {
  try {
    if (navigationRef.isReady()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigationRef.navigate(routeName as any, params as any);
    }
  } catch {}
}
