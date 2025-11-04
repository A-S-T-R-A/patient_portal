export const NAMESPACE = "/events" as const;
export const SOCKET_MAX_BUFFER = 1_000_000; // 1MB

// События клиента, которые сервер принимает
export const CLIENT_EVENTS = {
  JOIN: "join",
  LEAVE: "leave",
  AUTHORIZE: "authorization",
  MESSAGE_SEND: "message:send",
} as const;

// События сервера, которые клиенты слушают
export const SERVER_EVENTS = {
  AUTH_SUCCESS: "core:auth:success",
  AUTH_ERROR: "core:auth:error",
  MESSAGE_NEW: "message:new",
  APPOINTMENT_NEW: "appointment:new",
  APPOINTMENT_UPDATE: "appointment:update",
  APPOINTMENT_CANCELLED: "appointment:cancelled",
  TREATMENT_UPDATE: "treatment:update",
} as const;

