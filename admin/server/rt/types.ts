import type { Socket } from "socket.io";

export type GatewayUserBase = { id: string };

export type SocketWithContext = Socket & {
  user?: GatewayUserBase;
  accessToken?: string;
  authorized?: boolean;
};

