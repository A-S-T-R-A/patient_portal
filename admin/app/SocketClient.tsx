"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket, setGlobalHandler, joinRoom } from "@/lib/socket";
import { adminQueryKeys } from "@/lib/admin-queries";

export default function SocketClient() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1) Получаем socket_token (создаст cookie + вернёт JSON)
    fetch("/api/rt/issue-socket-token")
      .then(() => {
        // 2) Подключаемся
        const socket = getSocket({ baseUrl: window.location.origin });

        // 3) Глобальный обработчик новых сообщений
        setGlobalHandler("message:new", ({ message }: any) => {
          console.log("[admin] message:new", message);
          // Invalidate chats to refresh the list
          queryClient.invalidateQueries({ queryKey: adminQueryKeys.chats() });
          // If viewing a specific patient, invalidate their data
          if (message?.patientId) {
            queryClient.invalidateQueries({
              queryKey: adminQueryKeys.patient(message.patientId),
            });
          }
        });

        // 4) Глобальный обработчик обновлений аппойнтментов
        setGlobalHandler("appointment:update", ({ appointment }: any) => {
          console.log("[admin] appointment:update", appointment?.id);
          // Invalidate appointments list
          queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
          // Invalidate dashboard stats
          queryClient.invalidateQueries({ queryKey: adminQueryKeys.dashboard() });
          // If appointment has patientId, invalidate patient data
          if (appointment?.patientId) {
            queryClient.invalidateQueries({
              queryKey: adminQueryKeys.patient(appointment.patientId),
            });
          }
        });

        // 5) Глобальный обработчик обновлений лечения
        setGlobalHandler("treatment:update", ({ procedure }: any) => {
          console.log("[admin] treatment:update", procedure);
          const patientId = procedure?.treatmentPlan?.patientId;
          if (patientId) {
            queryClient.invalidateQueries({
              queryKey: adminQueryKeys.treatmentPlans(patientId),
            });
            queryClient.invalidateQueries({
              queryKey: adminQueryKeys.patient(patientId),
            });
          }
        });

        // 6) Входим в комнаты (для доктора)
        joinRoom("doctor:seed");
      })
      .catch((err) => {
        console.error("[SocketClient] Failed to setup socket:", err);
      });
  }, [queryClient]);

  return null;
}
