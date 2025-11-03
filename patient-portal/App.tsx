import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  StyleSheet,
  View as RNView,
  Text as RNText,
  Text,
  View,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { connectSocket, resolvePatientId } from "./src/lib/api";
import { navigationRef, navigate } from "./src/lib/navigation";
import { useAuth } from "./src/lib/queries";
import {
  showNotification,
  requestNotificationPermissions,
} from "./src/components/Notification";

import DashboardScreen from "./src/screens/DashboardScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import PromotionsScreen from "./src/screens/PromotionsScreen";
import TreatmentScreen from "./src/screens/TreatmentScreen";
import LoginScreen from "./src/screens/LoginScreen";
import { BottomNavigation } from "./src/components/BottomNavigation";
import { Sidebar } from "./src/components/Sidebar";
import Toast from "react-native-toast-message";

const Stack = createNativeStackNavigator();

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 minute default
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthChecker({
  children,
}: {
  children: (isAuthenticated: boolean) => React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const { data: authData, isLoading, error, isError } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // If we have an error (401), redirect to login immediately
    if (isError && !hasRedirected) {
      setIsAuthenticated(false);
      setHasRedirected(true);
      // Clear tokens
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          sessionStorage.removeItem("auth_token_temp");
          // Force redirect to login - stop all retries
          queryClient.setQueryData(["auth", "me"], null);
          queryClient.cancelQueries({ queryKey: ["auth", "me"] });
        }
      } catch {}
      return;
    }

    if (isLoading) {
      setIsAuthenticated(null);
      return;
    }

    if (error || !authData) {
      setIsAuthenticated(false);
      // Clear tokens on error
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          sessionStorage.removeItem("auth_token_temp");
        }
      } catch {}
      return;
    }

    // Only patients can access patient portal
    if (authData.role === "patient") {
      setIsAuthenticated(true);
      setHasRedirected(false); // Reset redirect flag on success
    } else {
      setIsAuthenticated(false);
      // Clear tokens if wrong role
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("auth_token");
          sessionStorage.removeItem("auth_token_temp");
        }
      } catch {}
    }
  }, [authData, isLoading, error, isError, hasRedirected, queryClient]);

  if (isLoading || (isAuthenticated === null && !isError)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Loading...</Text>
      </View>
    );
  }

  // If error and not authenticated, show login immediately (no more retries)
  if (isError || !isAuthenticated) {
    return <>{children(false)}</>;
  }

  return <>{children(isAuthenticated ?? false)}</>;
}

function MainNavigator({ isAuthenticated }: { isAuthenticated: boolean }) {
  // Handle initial route from URL
  useEffect(() => {
    if (typeof window !== "undefined" && isAuthenticated) {
      const path = window.location.pathname;
      const routeMap: Record<string, string> = {
        "/dashboard": "Dashboard",
        "/profile": "Profile",
        "/messages": "Messages",
        "/promotions": "Promotions",
        "/treatment": "Treatment",
      };
      const routeName = routeMap[path];
      if (routeName && navigationRef.current?.isReady()) {
        navigationRef.current.navigate(routeName as never);
      }
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  // Check if desktop (web with width > 768)
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;

  return (
    <View style={styles.appContainer}>
      {isDesktop && <Sidebar />}
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerShown: false,
          }}
          screenListeners={{
            state: (e: any) => {
              // Update URL when navigation state changes
              if (typeof window !== "undefined") {
                const state = e.data?.state;
                if (state) {
                  const route = state.routes[state.index];
                  if (route?.name) {
                    const routeMap: Record<string, string> = {
                      Dashboard: "/dashboard",
                      Profile: "/profile",
                      Messages: "/messages",
                      Promotions: "/promotions",
                      Treatment: "/treatment",
                    };
                    const path = routeMap[route.name] || "/dashboard";
                    window.history.replaceState(null, "", path);
                  }
                }
              }
            },
          }}
        >
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="Promotions" component={PromotionsScreen} />
          <Stack.Screen name="Treatment" component={TreatmentScreen} />
        </Stack.Navigator>
        {!isDesktop && <BottomNavigation />}
      </View>
    </View>
  );
}

export default function App() {
  // OAuth callback - handle token from URL if cross-domain
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("_auth_token");

    if (tokenFromUrl) {
      // Cross-domain: cookies don't work, use localStorage as persistent fallback
      // This is less secure but necessary for cross-domain OAuth
      try {
        // Save to both localStorage (persistent) and sessionStorage (temp)
        localStorage.setItem("auth_token", tokenFromUrl);
        sessionStorage.setItem("auth_token_temp", tokenFromUrl);
      } catch {}

      // Clean URL immediately
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Invalidate auth query to refetch with new token
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <NavigationContainer
            ref={navigationRef}
            linking={{
              prefixes: [],
              config: {
                screens: {
                  Login: "",
                  Dashboard: "dashboard",
                  Profile: "profile",
                  Messages: "messages",
                  Promotions: "promotions",
                  Treatment: "treatment",
                },
              },
            }}
          >
            <AuthChecker>
              {(isAuthenticated) => (
                <AppContent isAuthenticated={isAuthenticated} />
              )}
            </AuthChecker>
          </NavigationContainer>
          <StatusBar style="auto" />
          <Toast
            position="top"
            config={{
              app_info: ({ text1, text2 }) => (
                <RNView
                  style={{
                    alignSelf: "flex-end",
                    backgroundColor: "#111827",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    marginTop: 8,
                    marginRight: 12,
                    maxWidth: 360,
                  }}
                >
                  {text1 ? (
                    <RNText style={{ color: "#fff", fontWeight: "600" }}>
                      {text1}
                    </RNText>
                  ) : null}
                  {text2 ? (
                    <RNText style={{ color: "#D1D5DB", marginTop: 2 }}>
                      {text2}
                    </RNText>
                  ) : null}
                </RNView>
              ),
            }}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

// Separate component for socket connection (needs to be inside QueryClientProvider)
function AppContent({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { data: authData } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || authData?.role !== "patient") return;
    let mounted = true;
    (async () => {
      try {
        // Request permissions using unified notification component
        await requestNotificationPermissions();
      } catch (error) {
        console.error("Failed to request notification permissions:", error);
      }
      const patientId = authData.userId || (await resolvePatientId());
      if (!mounted) return;
      const socket: any = connectSocket({ patientId: patientId || undefined });
      socket.on("message:new", ({ message: m }: any) => {
        try {
          void showNotification({
            title: m?.sender === "doctor" ? "New message" : "Message sent",
            body: m?.content || "",
          });
          // Invalidate messages query
          if (patientId) {
            queryClient.invalidateQueries({
              queryKey: ["messages", patientId],
            });
            queryClient.invalidateQueries({
              queryKey: ["unread", patientId],
            });
          }
        } catch (error) {
          console.error("Error handling message:new:", error);
        }
      });
      socket.on("appointment:new", ({ appointment, by }: any) => {
        try {
          console.log("🔔 appointment:new received", appointment);
          const when = new Date(appointment?.datetime).toLocaleString();

          void showNotification({
            title: "New appointment scheduled",
            body: `${appointment?.title || "Appointment"} on ${when}`,
          });

          // Invalidate appointments query immediately
          if (patientId) {
            queryClient.invalidateQueries({
              queryKey: ["appointments", patientId],
            });
            queryClient.invalidateQueries({
              queryKey: ["patients", patientId],
            });
          }
        } catch (error) {
          console.error("Error handling appointment:new:", error);
        }
      });
      socket.on("appointment:update", ({ appointment, by }: any) => {
        try {
          const when = new Date(appointment?.datetime).toLocaleString();

          void showNotification({
            title:
              by === "patient"
                ? "Appointment updated"
                : "Appointment updated by doctor",
            body: when,
          });

          // Invalidate appointments query immediately
          if (patientId) {
            queryClient.invalidateQueries({
              queryKey: ["appointments", patientId],
            });
            queryClient.invalidateQueries({
              queryKey: ["patients", patientId],
            });
          }
        } catch (error) {
          console.error("Error handling appointment:update:", error);
        }
      });
      socket.on("treatment:update", ({ procedure }: any) => {
        try {
          void showNotification({
            title: "Treatment plan updated",
            body: procedure?.title
              ? `New procedure: ${procedure.title}`
              : "Your treatment plan has been updated",
          });

          // Invalidate patient query to refresh treatment plans
          if (patientId) {
            queryClient.invalidateQueries({
              queryKey: ["patients", patientId],
            });
          }
        } catch (error) {
          console.error("Error handling treatment:update:", error);
        }
      });
      socket.on("appointment:cancelled", ({ appointmentId, by }: any) => {
        try {
          console.log("🔔 appointment:cancelled received", {
            appointmentId,
            by,
          });

          void showNotification({
            title: "Appointment cancelled",
            body:
              by === "patient"
                ? "You cancelled an appointment"
                : "Your appointment was cancelled by the doctor",
          });

          // Invalidate appointments query immediately
          if (patientId) {
            queryClient.invalidateQueries({
              queryKey: ["appointments", patientId],
            });
            queryClient.invalidateQueries({
              queryKey: ["patients", patientId],
            });
          }
        } catch (error) {
          console.error("Error handling appointment:cancelled:", error);
        }
      });

      // Check for promotions on mount and show notification if any exist
      (async () => {
        try {
          // Simple check - if promotions screen has any active promotions, notify
          // In real app, this would come from API
          const hasPromotions = true; // For now, always true since we have mock data
          if (hasPromotions && typeof window !== "undefined") {
            const lastPromoCheck = localStorage.getItem("pp_lastPromoCheck");
            const now = Date.now();
            // Only show notification once per day
            if (
              !lastPromoCheck ||
              now - parseInt(lastPromoCheck) > 24 * 60 * 60 * 1000
            ) {
              setTimeout(() => {
                void showNotification({
                  title: "New promotions available",
                  body: "Check out our special offers and discounts",
                });
                localStorage.setItem("pp_lastPromoCheck", now.toString());
              }, 5000); // Show after 5 seconds to avoid spam
            }
          }
        } catch (error) {
          console.error("Error checking promotions:", error);
        }
      })();
    })();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authData, queryClient]);

  return <MainNavigator isAuthenticated={isAuthenticated} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appContainer: {
    flex: 1,
    flexDirection: "row",
  },
});
