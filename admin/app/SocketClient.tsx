"use client";
import { useEffect } from "react";
import { connectSocket } from "@/lib/api";

export default function SocketClient() {
  useEffect(() => {
    const socket: any = connectSocket({ doctorId: "seed" });
    socket.on("message:new", ({ message }: any) => {
      // eslint-disable-next-line no-console
      console.log("[admin] message:new", message);
    });
    socket.on("appointment:update", ({ appointment }: any) => {
      // eslint-disable-next-line no-console
      console.log("[admin] appointment:update", appointment?.id);
    });
  }, []);
  return null;
}
