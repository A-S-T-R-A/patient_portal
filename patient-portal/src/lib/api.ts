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
    const res = await fetch(`${API_BASE}/patients`);
    const data = await res.json();
    const first = (data?.patients || [])[0];
    return first?.id ?? null;
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
