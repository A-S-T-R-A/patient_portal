// Client-side socket.io client import
import { io, Socket } from "socket.io-client";
import { Platform, Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { navigationRef } from "./navigation";
import { storage, storageSync } from "./storage";

// Import queryClient to invalidate queries on native after auth
let globalQueryClient: any = null;
let globalNavigate: any = null;

export function setQueryClientForAuth(qc: any) {
  console.log("[setQueryClientForAuth] Setting global query client:", !!qc);
  globalQueryClient = qc;
}

export function setNavigateForAuth(nav: any) {
  globalNavigate = nav;
}

function computeDefaultApiBase(): string {
  // Web: use current hostname (defensively)
  try {
    if (typeof window !== "undefined" && (window as any)?.location?.hostname) {
      const host = (window as any).location.hostname || "localhost";
      return `http://${host}:3001/api`;
    }
  } catch {}
  // Native: try to read Expo host from Constants
  try {
    // Lazy import to avoid web bundling issues
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require("expo-constants").default;
    const hostUri: string | undefined =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoClient?.hostUri;
    if (hostUri) {
      const host = hostUri.split(":")[0];
      return `http://${host}:3001/api`;
    }
  } catch {}
  return "http://localhost:3001/api";
}

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE || computeDefaultApiBase();

// Auth utilities - always use Railway backend for OAuth
export function getAuthBase(): string {
  // Always use Railway backend for auth (OAuth endpoint is there)
  const railwayUrl =
    process.env.EXPO_PUBLIC_API_BASE?.replace(/\/api$/, "") ||
    process.env.EXPO_PUBLIC_SOCKET_URL?.replace(/\/socket.io$/, "") ||
    "https://patient-portal-admin-service-production.up.railway.app";

  // If it's already a full URL with https, use it
  if (railwayUrl.startsWith("http")) {
    return railwayUrl;
  }

  // Otherwise assume it's a domain
  if (!railwayUrl.includes("localhost") && !railwayUrl.includes("127.0.0.1")) {
    return `https://${railwayUrl}`;
  }

  return `http://${railwayUrl}`;
}

// Token is now stored in HTTP-only cookie (web) or secure storage (native)
// No need to manually manage tokens - cookies are sent automatically
export function getAuthToken(): string | null {
  // For web: cookie is HTTP-only, not accessible via JS (security)
  // For native: would use secure storage, but for now return null
  // Cookie will be sent automatically with requests
  return null;
}

export function setAuthToken(token: string): void {
  // For cross-domain: save token in storage as fallback
  // Cookies are HTTP-only and don't work cross-domain
  try {
    storageSync.setItem("auth_token", token);
    // Also set in sessionStorage for OAuth callback compatibility (web only)
    if (Platform.OS === "web" && typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem("auth_token_temp", token);
    } else {
      // Native: also store in temp key
      storageSync.setItem("auth_token_temp", token);
    }
  } catch (e) {
    console.error("[setAuthToken] Error saving token:", e);
  }
}

export function clearAuthToken(): void {
  // Clear both storage and sessionStorage
  try {
    storageSync.removeItem("auth_token");
    storageSync.removeItem("auth_token_temp");
    if (Platform.OS === "web" && typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem("auth_token_temp");
    }
  } catch (e) {
    console.error("[clearAuthToken] Error clearing token:", e);
  }
}

export async function initiateAppleAuth(role: string = "patient") {
  const authBase = getAuthBase();

  // Get current URL - different methods for web vs native
  let redirectAfter = "";
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.href
  ) {
    redirectAfter = window.location.href;
  }

  const url = `${authBase}/api/auth/apple-web?role=${role}&redirect=${encodeURIComponent(
    redirectAfter
  )}`;

  // Use WebBrowser for native platforms (uses SFSafariViewController/Chrome Custom Tabs)
  // This will return control to app after OAuth completes
  if (Platform.OS !== "web") {
    try {
      // Open in in-app browser that can return to app
      console.log("[initiateAppleAuth] Opening WebBrowser:", url);
      const result = await WebBrowser.openAuthSessionAsync(
        url,
        "patient-portal://auth"
      );

      console.log(
        "[initiateAppleAuth] WebBrowser result:",
        result.type,
        (result as any).url
      );

      const resultUrl = (result as any).url;
      if (result.type === "success" && resultUrl) {
        // Deep link was called - extract token from URL
        const normalizedUrl = resultUrl.replace(
          "patient-portal://",
          "https://"
        );
        console.log("[initiateAppleAuth] Normalized URL:", normalizedUrl);

        const urlObj = new URL(normalizedUrl);
        const token =
          urlObj.searchParams.get("token") ||
          urlObj.searchParams.get("_auth_token");

        console.log(
          "[initiateAppleAuth] Extracted token:",
          token ? "present" : "missing"
        );

        if (token) {
          // Save token
          try {
            storageSync.setItem("auth_token", token);
            if (Platform.OS === "web" && typeof window !== "undefined" && window.sessionStorage) {
              window.sessionStorage.setItem("auth_token_temp", token);
            } else {
              storageSync.setItem("auth_token_temp", token);
            }
            console.log("[initiateAppleAuth] Token saved to storage");
          } catch (e) {
            console.error("[initiateAppleAuth] Failed to save token:", e);
          }

          // Trigger auth refetch - on native invalidate queries instead of reload
          // Navigation will happen automatically via AuthChecker when authData updates
          if (globalQueryClient) {
            console.log("[initiateAppleAuth] Invalidating auth queries");
            globalQueryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            
            // Immediately refetch auth to get user data
            // This will trigger AuthChecker to update isAuthenticated state
            // which will automatically switch screens in MainNavigator
            console.log("[initiateAppleAuth] Refetching auth data");
            globalQueryClient.refetchQueries({ queryKey: ["auth", "me"] }).then(() => {
              console.log("[initiateAppleAuth] Auth data refetched - AuthChecker will handle navigation");
            }).catch((err) => {
              console.error("[initiateAppleAuth] Failed to refetch auth:", err);
            });
          }
        } else {
          console.warn("[initiateAppleAuth] No token in URL:", resultUrl);
        }
      } else {
        console.warn(
          "[initiateAppleAuth] OAuth failed or cancelled:",
          result.type,
          resultUrl
        );
      }
    } catch (e) {
      console.error("WebBrowser auth error:", e);
      // Fallback to Linking if WebBrowser fails
      Linking.openURL(url).catch((err: any) => {
        console.error("Failed to open Apple Auth URL:", err);
      });
    }
  } else {
    // Web platform - use window.location
    if (typeof window !== "undefined" && window.location) {
      window.location.href = url;
    }
  }
}

export async function initiateGoogleAuth(
  role: "doctor" | "patient" = "patient"
): Promise<void> {
  const authBase = getAuthBase();

  // Get current URL - different methods for web vs native
  let currentUrl = "";
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.href
  ) {
    currentUrl = window.location.href;
  }

  const redirectAfter = encodeURIComponent(currentUrl);
  const authUrl = `${authBase}/api/auth/google?role=${role}&redirect=${redirectAfter}`;

  // Use WebBrowser for native platforms (uses SFSafariViewController/Chrome Custom Tabs)
  // This will return control to app after OAuth completes
  if (Platform.OS !== "web") {
    try {
      // Open in in-app browser that can return to app
      console.log("[initiateGoogleAuth] Opening WebBrowser:", authUrl);
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        "patient-portal://auth"
      );

      console.log(
        "[initiateGoogleAuth] WebBrowser result:",
        result.type,
        (result as any).url
      );

      const resultUrl = (result as any).url;
      console.log("[initiateGoogleAuth] Full result URL:", resultUrl);
      console.log("[initiateGoogleAuth] Result type:", result.type);
      console.log("[initiateGoogleAuth] Has resultUrl:", !!resultUrl);
      
      if (result.type === "success" && resultUrl) {
        console.log("[initiateGoogleAuth] Processing success result with URL");
        // Deep link was called - extract token from URL
        const normalizedUrl = resultUrl.replace(
          "patient-portal://",
          "https://"
        );
        console.log("[initiateGoogleAuth] Normalized URL:", normalizedUrl);

        let token: string | null = null;
        
        try {
          const urlObj = new URL(normalizedUrl);
          console.log("[initiateGoogleAuth] URL object created, searchParams:", urlObj.searchParams.toString());
          
          token =
            urlObj.searchParams.get("token") ||
            urlObj.searchParams.get("_auth_token");

          console.log(
            "[initiateGoogleAuth] Extracted token:",
            token ? `present (length: ${token.length})` : "missing"
          );
        } catch (urlError) {
          console.error("[initiateGoogleAuth] Failed to parse URL:", urlError, "URL:", normalizedUrl);
          // Try to extract token manually using regex
          const tokenMatch = resultUrl.match(/[?&#]token=([^&#]+)/);
          token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
          console.log("[initiateGoogleAuth] Manual token extraction:", token ? `found (length: ${token.length})` : "not found");
        }

        if (token) {
          console.log("[initiateGoogleAuth] Token extracted, length:", token.length);
          
          // Save token
          try {
            storageSync.setItem("auth_token", token);
            if (Platform.OS === "web" && typeof window !== "undefined" && window.sessionStorage) {
              window.sessionStorage.setItem("auth_token_temp", token);
            } else {
              storageSync.setItem("auth_token_temp", token);
            }
            console.log("[initiateGoogleAuth] Token saved to storage");
          } catch (e) {
            console.error("[initiateGoogleAuth] Failed to save token:", e);
          }

          // Trigger auth refetch - on native invalidate queries instead of reload
          // Navigation will happen automatically via AuthChecker when authData updates
          console.log("[initiateGoogleAuth] Checking globalQueryClient:", !!globalQueryClient);
          if (globalQueryClient) {
            console.log("[initiateGoogleAuth] Invalidating auth queries");
            globalQueryClient.invalidateQueries({ queryKey: ["auth", "me"] });
            
            // Immediately refetch auth to get user data
            // This will trigger AuthChecker to update isAuthenticated state
            // which will automatically switch screens in MainNavigator
            console.log("[initiateGoogleAuth] Refetching auth data");
            globalQueryClient.refetchQueries({ queryKey: ["auth", "me"] }).then((result) => {
              console.log("[initiateGoogleAuth] Auth data refetched - AuthChecker will handle navigation", result);
            }).catch((err) => {
              console.error("[initiateGoogleAuth] Failed to refetch auth:", err);
            });
          } else {
            console.error("[initiateGoogleAuth] globalQueryClient is not set! Cannot refetch auth.");
            // Fallback: try to manually trigger auth check after a delay
            setTimeout(() => {
              console.log("[initiateGoogleAuth] Attempting fallback auth check");
              if (typeof window !== "undefined" && window.location) {
                window.location.reload();
              }
            }, 1000);
          }
        } else {
          console.warn("[initiateGoogleAuth] No token in URL:", resultUrl);
        }
      } else {
        console.warn(
          "[initiateGoogleAuth] OAuth failed or cancelled:",
          result.type,
          resultUrl
        );
      }
    } catch (e) {
      console.error("WebBrowser auth error:", e);
      // Fallback to Linking if WebBrowser fails
      Linking.openURL(authUrl).catch((err: any) => {
        console.error("Failed to open Google Auth URL:", err);
      });
    }
  } else {
    // Web platform - use window.location
    if (typeof window !== "undefined" && window.location) {
      window.location.href = authUrl;
    }
  }
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // For cross-domain: try to get token from storage (persistent) or sessionStorage (temporary)
  let token: string | null = null;
  try {
    // First try storage (persistent across refreshes)
    token = storageSync.getItem("auth_token");
    console.log("[fetchWithAuth] Token from storage:", token ? `present (length: ${token.length})` : "missing");
    
    // Fallback to sessionStorage (temporary, from OAuth callback) - web only
    if (!token && Platform.OS === "web" && typeof window !== "undefined" && window.sessionStorage) {
      token = window.sessionStorage.getItem("auth_token_temp");
      console.log("[fetchWithAuth] Token from sessionStorage:", token ? `present (length: ${token.length})` : "missing");
      // If we have sessionStorage token, promote it to storage for persistence
      if (token) {
        storageSync.setItem("auth_token", token);
        console.log("[fetchWithAuth] Promoted sessionStorage token to storage");
      }
    } else if (!token) {
      // Native: try temp key
      token = storageSync.getItem("auth_token_temp");
      if (token) {
        storageSync.setItem("auth_token", token);
      }
    }
  } catch (e) {
    console.error("[fetchWithAuth] Error getting token:", e);
  }

  const headers = new Headers(options.headers);

  // If we have a token, use it in Authorization header
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    console.log("[fetchWithAuth] Added Authorization header with token");
  } else {
    console.warn("[fetchWithAuth] No token available, request will be unauthenticated");
  }

  console.log("[fetchWithAuth] Making request to:", url);
  return fetch(url, {
    ...options,
    headers,
    credentials: "include", // Cookies work for same-domain
  });
}

export async function logout(): Promise<void> {
  const authBase = getAuthBase();

  // Clear client-side tokens first
  try {
    storageSync.removeItem("auth_token");
    storageSync.removeItem("auth_token_temp");
    if (Platform.OS === "web" && typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem("auth_token_temp");
    }
  } catch (e) {
    console.error("[logout] Error clearing tokens:", e);
  }

  try {
    // Call logout endpoint to clear server-side cookie
    await fetch(`${authBase}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  }

  // Force redirect to login after logout
  // This prevents infinite loading and 401 spam
  // Only on web platform where window.location exists
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    window.location &&
    window.location.href
  ) {
    // Use setTimeout to ensure tokens are cleared first
    setTimeout(() => {
      try {
        window.location.href = "/";
      } catch (e) {
        console.error("[logout] Error redirecting:", e);
      }
    }, 50);
  } else {
    // On native: invalidate queries to trigger re-render and show login
    if (globalQueryClient) {
      globalQueryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    }
  }
}

function computeDefaultSocketBase(): string {
  // Web: same host as current page
  try {
    if (typeof window !== "undefined" && (window as any)?.location?.hostname) {
      const host = (window as any).location.hostname || "localhost";
      return `http://${host}:3001`;
    }
  } catch {}
  // Native: infer LAN IP from Expo hostUri
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Constants = require("expo-constants").default;
    const hostUri: string | undefined =
      Constants?.expoConfig?.hostUri ||
      Constants?.manifest2?.extra?.expoClient?.hostUri;
    if (hostUri) {
      const host = hostUri.split(":")[0];
      return `http://${host}:3001`;
    }
  } catch {}
  return "http://localhost:3001";
}

export async function resolvePatientId(): Promise<string | null> {
  try {
    // Always get from auth token (JWT contains userId)
    const authBase = getAuthBase();
    try {
      const res = await fetchWithAuth(`${authBase}/api/auth/me`);
      if (res.ok) {
        const data = await res.json();
        if (data.role === "patient") {
          return data.userId;
        }
        // If not patient role, return null
        return null;
      }
    } catch {}

    return null;
  } catch {
    return null;
  }
}

export function connectEvents(params?: {
  patientId?: string;
  doctorId?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.patientId) qs.set("patientId", params.patientId);
  if (params?.doctorId) qs.set("doctorId", params.doctorId);
  const url = `${API_BASE}/events${qs.toString() ? `?${qs.toString()}` : ""}`;
  return new EventSource(url);
}

// Re-export from new socket module
export { initSocket, getSocket, setGlobalHandler, joinRoom, leaveRoom } from "./socket";
import { initSocket, setGlobalHandler as setSocketGlobalHandler } from "./socket";

// Global message handler - установлен один раз и восстанавливается при переподключении
let globalMessageHandler: ((data: any) => void) | null = null;
let globalPatientId: string | null = null;

// Setup global message handler - вызывается один раз при аутентификации
export function setupGlobalMessageHandler(
  patientId: string,
  handler: (message: any) => void
) {
  console.log("[socket] Setting up global message handler for patientId:", patientId);
  globalMessageHandler = handler;
  globalPatientId = patientId;
  
  // Устанавливаем через новый менеджер
  setSocketGlobalHandler("message:new", handler);
}

// Remove global handler (при logout)
export function removeGlobalMessageHandler() {
  console.log("[socket] Removing global message handler");
  globalMessageHandler = null;
  globalPatientId = null;
  // Handler будет удален при disconnect
}

// Legacy connectSocket для совместимости
export async function connectSocket(params?: {
  patientId?: string;
  doctorId?: string;
}) {
  const socket = await initSocket();
  
  // Автоматически присоединяемся к комнатам
  if (params?.patientId) {
    const { joinRoom } = await import("./socket");
    joinRoom(`patient:${params.patientId}`);
  }
  if (params?.doctorId) {
    const { joinRoom } = await import("./socket");
    joinRoom(`doctor:${params.doctorId}`);
  }
  
  return socket as any;
}


