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
  Linking,
} from "react-native";
import { useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import {
  connectSocket,
  setupGlobalMessageHandler,
  removeGlobalMessageHandler,
  resolvePatientId,
  setQueryClientForAuth,
  setNavigateForAuth,
} from "./src/lib/api";
import { storageSync } from "./src/lib/storage";
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
// Import DebugLogs early to capture console logs
import "./src/components/DebugLogs";
import { DebugLogs } from "./src/components/DebugLogs";

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
    console.log("[AuthChecker] State update:", {
      isLoading,
      hasAuthData: !!authData,
      authRole: authData?.role,
      error: error?.message,
      isError,
      hasRedirected,
    });

    // If we have an error (401), redirect to login immediately
    if (isError && !hasRedirected) {
      console.log("[AuthChecker] Error detected, setting authenticated to false");
      setIsAuthenticated(false);
      setHasRedirected(true);
          // Clear tokens
          try {
            storageSync.removeItem("auth_token");
            storageSync.removeItem("auth_token_temp");
            // Force redirect to login - stop all retries
            queryClient.setQueryData(["auth", "me"], null);
            queryClient.cancelQueries({ queryKey: ["auth", "me"] });
          } catch {}
      return;
    }

    if (isLoading) {
      console.log("[AuthChecker] Loading, authenticated = null");
      setIsAuthenticated(null);
      return;
    }

    if (error || !authData) {
      console.log("[AuthChecker] No auth data or error, setting authenticated to false");
      setIsAuthenticated(false);
      // Clear tokens on error
      try {
        storageSync.removeItem("auth_token");
        storageSync.removeItem("auth_token_temp");
      } catch {}
      return;
    }

    // Only patients can access patient portal
    if (authData.role === "patient") {
      console.log("[AuthChecker] Patient authenticated, setting authenticated to true");
      setIsAuthenticated(true);
      setHasRedirected(false); // Reset redirect flag on success
    } else {
      console.log("[AuthChecker] Wrong role:", authData.role);
      setIsAuthenticated(false);
      // Clear tokens if wrong role
      try {
        storageSync.removeItem("auth_token");
        storageSync.removeItem("auth_token_temp");
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
  // Handle title updates - must be outside conditional to follow Rules of Hooks
  useEffect(() => {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      if (!isAuthenticated) {
        console.log("[MainNavigator] Login page - setting title");
        document.title = "Login - Patient Portal";
      }
    }
  }, [isAuthenticated]);

  // Handle initial route from URL - must be outside conditional
  useEffect(() => {
    // Only on web platform where window.location exists
    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.pathname &&
      isAuthenticated
    ) {
      try {
        const path = window.location.pathname;
        console.log("[MainNavigator] Initial route from URL:", path);
        const routeMap: Record<string, string> = {
          "/dashboard": "Dashboard",
          "/profile": "Profile",
          "/messages": "Messages",
          "/promotions": "Promotions",
          "/treatment": "Treatment",
        };
        const routeName = routeMap[path];
        console.log("[MainNavigator] Mapped route name:", routeName);
        if (routeName && navigationRef.current?.isReady()) {
          console.log("[MainNavigator] Navigating to:", routeName);
          navigationRef.current.navigate(routeName as never);

          // Set initial title based on route
          if (
            typeof document !== "undefined" &&
            routeName &&
            routeName !== "undefined"
          ) {
            console.log("[MainNavigator] Setting initial title to:", routeName);
            document.title = routeName;
            console.log("[MainNavigator] Title after set:", document.title);
          }
        }
      } catch (e) {
        console.error("[MainNavigator] Error handling initial route:", e);
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
          key={isAuthenticated ? "authenticated" : "login"}
          initialRouteName="Dashboard"
          screenOptions={{
            headerShown: false,
          }}
          screenListeners={{
            state: (e: any) => {
              // Update URL when navigation state changes - only on web
              if (
                typeof window !== "undefined" &&
                window.location &&
                window.history
              ) {
                try {
                  const state = e.data?.state;
                  console.log("[App] Navigation state changed:", state);
                  if (state) {
                    const route = state.routes[state.index];
                    console.log("[App] Current route:", route?.name);
                    if (route?.name) {
                      const routeMap: Record<string, string> = {
                        Dashboard: "/dashboard",
                        Profile: "/profile",
                        Messages: "/messages",
                        Promotions: "/promotions",
                        Treatment: "/treatment",
                      };
                      const path = routeMap[route.name] || "/dashboard";
                      
                      // Only update history if available
                      if (window.history && window.history.replaceState) {
                        window.history.replaceState(null, "", path);
                      }

                      // Update document.title
                      if (typeof document !== "undefined") {
                        const currentTitle = document.title;
                        // Prevent setting "undefined" as string - use fallback
                        const newTitle =
                          route.name && route.name !== "undefined"
                            ? route.name
                            : "Patient Portal";

                        // Only update if title is actually undefined or different
                        if (
                          currentTitle === "undefined" ||
                          currentTitle !== newTitle
                        ) {
                          console.log("[App] Title update:", {
                            currentTitle,
                            newTitle,
                            routeName: route.name,
                          });
                          document.title = newTitle;
                          console.log(
                            "[App] Title after update:",
                            document.title
                          );
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.error("[App] Error updating navigation state:", e);
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
  // Test log to verify DebugLogs is working
  useEffect(() => {
    console.log("[App] Component mounted - DebugLogs should be active");
  }, []);

  // Track all document.title changes
  useEffect(() => {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      // Override document.title setter to log all changes
      try {
        const originalTitle =
          Object.getOwnPropertyDescriptor(Document.prototype, "title") ||
          Object.getOwnPropertyDescriptor(HTMLDocument.prototype, "title");

        if (originalTitle && originalTitle.set) {
          const originalSet = originalTitle.set;
          Object.defineProperty(document, "title", {
            set: function (value: string) {
              // Block setting undefined or null - use fallback instead
              if (
                value === undefined ||
                value === null ||
                value === "undefined" ||
                value === "null"
              ) {
                console.log(
                  "[Title Tracker] Blocked setting title to:",
                  value,
                  "- using fallback 'Patient Portal'"
                );
                const fallbackTitle = "Patient Portal";
                if (originalSet) {
                  originalSet.call(this, fallbackTitle);
                }
                return;
              }

              console.log("[Title Tracker] document.title SET to:", value);
              if (originalSet) {
                originalSet.call(this, value);
              }
            },
            get: originalTitle.get,
            configurable: true,
            enumerable: true,
          });
        }
      } catch (e) {
        console.warn("[Title Tracker] Failed to override document.title:", e);
      }

      // Set initial title
      console.log("[App] Initial load - setting title to 'Patient Portal'");
      console.log("[App] Current document.title:", document.title);
      document.title = "Patient Portal";
      console.log("[App] Title after initial set:", document.title);
    }
  }, []);

  // OAuth callback - handle token from URL if cross-domain
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Check if window.location exists and has search property (not available in native)
    if (!window.location || typeof window.location.search === "undefined")
      return;

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("_auth_token");
    const error = urlParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error);
      // Clean URL
      if (window.history && window.location.pathname) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
      // Error will be handled by LoginScreen
      return;
    }

    if (tokenFromUrl) {
      // Cross-domain: cookies don't work, use storage as persistent fallback
      // This is less secure but necessary for cross-domain OAuth
      try {
        // Save to both storage (persistent) and sessionStorage (temp)
        storageSync.setItem("auth_token", tokenFromUrl);
        if (Platform.OS === "web" && typeof window !== "undefined" && window.sessionStorage) {
          window.sessionStorage.setItem("auth_token_temp", tokenFromUrl);
        } else {
          storageSync.setItem("auth_token_temp", tokenFromUrl);
        }
      } catch {}

      // Clean URL immediately (only if window.history exists)
      if (window.history && window.location.pathname) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }

      // Invalidate auth query to refetch with new token
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  }, [queryClient]);

  // Set global query client and navigate for auth functions
  // Do this immediately, not in useEffect, to ensure it's available for OAuth callbacks
  setQueryClientForAuth(queryClient);
  setNavigateForAuth(navigate);
  
  // Also set in useEffect for safety
  useEffect(() => {
    console.log("[App] Setting global query client for auth");
    setQueryClientForAuth(queryClient);
    setNavigateForAuth(navigate);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <NavigationContainer
            ref={navigationRef}
            linking={{
              prefixes: ["patient-portal://", "https://", "http://"],
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
          <DebugLogs />
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

  // Log when authentication state changes
  // Navigation will happen automatically via MainNavigator key prop
  useEffect(() => {
    console.log("[AppContent] Auth state changed - isAuthenticated:", isAuthenticated, "authData role:", authData?.role, "authData exists:", !!authData);
    if (isAuthenticated && authData?.role === "patient") {
      console.log("[AppContent] User authenticated - MainNavigator will automatically show Dashboard");
    }
  }, [isAuthenticated, authData]);

  // Handle deep link authentication (patient-portal://auth?token=...)
  useEffect(() => {
    const handleDeepLink = async (url: string | null) => {
      if (!url) return;

      try {
        console.log("[App] Deep link received:", url);

        // Check if it's an auth deep link
        if (
          url.includes("patient-portal://auth") ||
          url.includes("://auth?token=")
        ) {
          // Extract token from URL
          // Replace custom scheme with https:// for URL parsing
          const normalizedUrl = url.replace("patient-portal://", "https://");
          const urlObj = new URL(normalizedUrl);
          const token =
            urlObj.searchParams.get("token") ||
            urlObj.searchParams.get("_auth_token");

          if (token) {
            console.log("[App] Deep link auth token received");
            // Save token
            try {
              storageSync.setItem("auth_token", token);
              if (Platform.OS === "web" && typeof window !== "undefined" && window.sessionStorage) {
                window.sessionStorage.setItem("auth_token_temp", token);
              } else {
                storageSync.setItem("auth_token_temp", token);
              }
            } catch (e) {
              console.error("[App] Failed to save token from deep link:", e);
            }

            // Invalidate and immediately refetch auth query to get user data
            console.log("[App] Invalidating auth queries");
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            
            console.log("[App] Refetching auth data from deep link");
            queryClient.refetchQueries({ queryKey: ["auth", "me"] }).then(() => {
              console.log("[App] Auth data refetched from deep link - AuthChecker will handle navigation");
            }).catch((err) => {
              console.error("[App] Failed to refetch auth from deep link:", err);
            });

            // Navigation will happen automatically via the isAuthenticated useEffect above
            console.log(
              "[App] Deep link processed, waiting for auth to update"
            );
          }
        }
      } catch (e) {
        console.error("[App] Deep link handling error:", e);
      }
    };

    // Handle initial URL (if app was opened via deep link)
    if (Platform.OS === "web") {
      // Web: check window.location
      if (typeof window !== "undefined") {
        const url = window.location.href;
        if (url.includes("://auth?token=")) {
          handleDeepLink(url);
        }
      }
    } else {
      // Native: use Linking API
      Linking.getInitialURL().then(handleDeepLink).catch(console.error);

      // Listen for deep link events (when app is already open)
      const subscription = Linking.addEventListener("url", ({ url }) => {
        handleDeepLink(url);
      });

      return () => {
        subscription.remove();
      };
    }
  }, [queryClient]);

  // Global message handler - updates cache and shows notifications when NOT on Messages screen
  // Setup once and it will persist across tab switches and reconnections
  useEffect(() => {
    console.log("[App] Global message handler: useEffect triggered, isAuthenticated:", isAuthenticated, "authData:", authData?.role, "authData exists:", !!authData);
    if (!isAuthenticated || authData?.role !== "patient") {
      console.log("[App] Global message handler: not authenticated or not patient, removing handler");
      removeGlobalMessageHandler();
      return;
    }
    let mounted = true;
    let socket: any = null;
    let messageNewHandler: any = null;
    
    (async () => {
      // Wait a bit for authData to be fully available
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!mounted) {
        console.log("[App] Global message handler: unmounted before setup");
        return;
      }
      
      try {
        // Request permissions using unified notification component
        await requestNotificationPermissions();
      } catch (error) {
        console.error("Failed to request notification permissions:", error);
      }
      
      // Get patientId - try multiple times if needed
      let patientId = authData?.userId;
      if (!patientId) {
        console.log("[App] Global message handler: no userId in authData, trying resolvePatientId");
        patientId = await resolvePatientId();
      }
      
      if (!mounted || !patientId) {
        console.log("[App] Global message handler: no patientId after all attempts, patientId:", patientId);
        return;
      }
      
      console.log("[App] Global message handler: setting up for patientId:", patientId);
      
      // Get current route to check if we're on Messages screen
      const getCurrentRoute = () => {
        try {
          if (navigationRef.isReady()) {
            const route = navigationRef.getCurrentRoute();
            return route?.name;
          }
        } catch (e) {
          console.error("[App] Error getting current route:", e);
        }
        return null;
      };
      
      socket = await connectSocket({ patientId });
      
      // Handler for new messages - ALWAYS update cache, show notification only if NOT on Messages
      messageNewHandler = ({ message: m }: any) => {
        if (!mounted || !m || !patientId) {
          console.log("[App] Global handler: message rejected (mounted:", mounted, "m:", !!m, "patientId:", !!patientId);
          return;
        }
        
        // Only process messages for this patient
        if (m.patientId && m.patientId !== patientId) {
          console.log("[App] Global handler: message rejected (wrong patientId), expected:", patientId, "got:", m.patientId);
          return;
        }
        
        console.log("[App] New message received globally:", m);
        console.log("[App] Global handler: updating cache, patientId:", patientId);
        
        // ALWAYS update React Query cache - независимо от вкладки
        try {
          const currentCache = queryClient.getQueryData(["messages", patientId]);
          const currentSize = Array.isArray(currentCache) ? currentCache.length : 0;
          console.log("[App] Global handler: current cache size:", currentSize);
          
          // Update cache synchronously
          queryClient.setQueryData(
            ["messages", patientId],
            (oldData: any[] | undefined) => {
              if (!oldData) {
                console.log("[App] Global handler: creating new messages array with message:", m.id);
                return [m];
              }
              // Check if message already exists (avoid duplicates)
              const exists = oldData.some((msg) => msg.id === m.id);
              if (exists) {
                console.log("[App] Global handler: message already in cache, skipping:", m.id);
                return oldData;
              }
              const newSize = oldData.length + 1;
              console.log("[App] Global handler: adding message to cache:", m.id, "Total:", newSize);
              return [...oldData, m];
            }
          );
          
          // Verify cache was updated
          const updatedCache = queryClient.getQueryData(["messages", patientId]);
          const updatedSize = Array.isArray(updatedCache) ? updatedCache.length : 0;
          console.log("[App] Global handler: cache updated, new size:", updatedSize, "was:", currentSize);
        } catch (error) {
          console.error("[App] Global handler: error updating cache:", error);
        }
        
        // Also invalidate unread count
        queryClient.invalidateQueries({
          queryKey: ["unread", patientId],
        });
        
        // Show notification ONLY if NOT on Messages screen
        let currentRoute: string | null = null;
        try {
          currentRoute = getCurrentRoute();
        } catch (e) {
          console.error("[App] Global handler: error getting current route:", e);
        }
        const isOnMessagesScreen = currentRoute === "Messages";
        
        console.log("[App] Global handler: current route:", currentRoute, "isOnMessagesScreen:", isOnMessagesScreen, "sender:", m.sender);
        
        if (!isOnMessagesScreen && m.sender === "doctor") {
          console.log("[App] Showing notification - not on Messages screen, current route:", currentRoute);
          showNotification({
            title: "New message from your doctor",
            body: m?.content || "You have a new message",
          }).catch((err) => {
            console.error("[App] Failed to show notification:", err);
          });
        } else {
          console.log("[App] Skipping notification - on Messages screen or not from doctor, route:", currentRoute);
        }
      };
      
      // Setup global handler using centralized manager
      // This handler will persist across tab switches and reconnect automatically
      console.log("[App] Global handler: registering with socket manager");
      setupGlobalMessageHandler(patientId, messageNewHandler);
    })();
    
    return () => {
      console.log("[App] Global message handler: cleanup");
      mounted = false;
      // Don't remove handler - it will be replaced when effect runs again with new patientId
      // Only remove if we're actually logging out (isAuthenticated becomes false)
      // For now, handler persists across tab switches
    };
  }, [isAuthenticated, authData?.userId, authData?.role, queryClient]);

  // Other socket handlers (appointments, treatments) - keep these
  useEffect(() => {
    if (!isAuthenticated || authData?.role !== "patient") return;
    let mounted = true;
    (async () => {
      const patientId = authData.userId || (await resolvePatientId());
      if (!mounted) return;
      const socket: any = connectSocket({ patientId: patientId || undefined });
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
          if (hasPromotions) {
            const lastPromoCheck = storageSync.getItem("pp_lastPromoCheck");
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
                storageSync.setItem("pp_lastPromoCheck", now.toString());
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
