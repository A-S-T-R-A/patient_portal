// Client-side socket.io client import
import { io, Socket } from "socket.io-client";
import { Platform } from "react-native";

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
  // For cross-domain: save token in localStorage as fallback
  // Cookies are HTTP-only and don't work cross-domain
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
      // Also set in sessionStorage for OAuth callback compatibility
      sessionStorage.setItem("auth_token_temp", token);
    }
  } catch {}
}

export function clearAuthToken(): void {
  // Clear both localStorage and sessionStorage
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_token_temp");
    }
  } catch {}
}

export function initiateGoogleAuth(
  role: "doctor" | "patient" = "patient"
): void {
  const authBase = getAuthBase();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const redirectAfter = encodeURIComponent(currentUrl);
  window.location.href = `${authBase}/api/auth/google?role=${role}&redirect=${redirectAfter}`;
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // For cross-domain: try to get token from localStorage (persistent) or sessionStorage (temporary)
  let token: string | null = null;
  try {
    if (typeof window !== "undefined") {
      // First try localStorage (persistent across refreshes)
      token = localStorage.getItem("auth_token");
      // Fallback to sessionStorage (temporary, from OAuth callback)
      if (!token) {
        token = sessionStorage.getItem("auth_token_temp");
        // If we have sessionStorage token, promote it to localStorage for persistence
        if (token) {
          localStorage.setItem("auth_token", token);
        }
      }
    }
  } catch {}

  const headers = new Headers(options.headers);

  // If we have a token, use it in Authorization header
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

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
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_token_temp");
    }
  } catch {}

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
  if (typeof window !== "undefined") {
    // Use setTimeout to ensure tokens are cleared first
    setTimeout(() => {
      window.location.href = "/";
    }, 50);
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

let singletonSocket: Socket | null = null;
const joinedRooms = new Set<string>();

export function connectSocket(params?: {
  patientId?: string;
  doctorId?: string;
}) {
  if (!singletonSocket) {
    const url =
      process.env.EXPO_PUBLIC_SOCKET_URL || computeDefaultSocketBase();
    singletonSocket = io(url, {
      transports: ["websocket", "polling"],
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    });
    // Debug lifecycle
    singletonSocket.on("connect", () => {
      console.log("[socket] connected", singletonSocket?.id);
    });
    singletonSocket.on("disconnect", (reason: any) => {
      console.log("[socket] disconnected", reason);
    });
    singletonSocket.on("connect_error", (err: any) => {
      console.log("[socket] connect_error", err?.message || err);
    });
    singletonSocket.io.on("reconnect_attempt", (n: number) => {
      console.log("[socket] reconnect_attempt", n);
    });
    singletonSocket.io.on("reconnect", (n: number) => {
      console.log("[socket] reconnected", n);
    });
  }
  const key = `${params?.patientId || ""}|${params?.doctorId || ""}`;
  if (key !== "|") {
    const doJoin = () => {
      if (!joinedRooms.has(key)) {
        console.log("[socket] join", {
          patientId: params?.patientId,
          doctorId: params?.doctorId,
        });
        singletonSocket!.emit("join", {
          patientId: params?.patientId,
          doctorId: params?.doctorId,
        });
        joinedRooms.add(key);
      }
    };
    if (singletonSocket.connected) doJoin();
    else singletonSocket.once("connect", doJoin);
  }
  return singletonSocket as any;
}
