"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket, setGlobalHandler, joinRoom } from "@/lib/socket";
import { adminQueryKeys } from "@/lib/admin-queries";

export default function SocketClient() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    const setupSocket = async () => {
      try {
        console.log("[SocketClient] Setting up socket connection...");

        // 1. Получаем socket_token
        const tokenRes = await fetch("/api/rt/issue-socket-token");
        if (!tokenRes.ok) {
          throw new Error("Failed to get socket token");
        }

        const tokenData = await tokenRes.json();
        const socketToken = tokenData?.socketToken;

        if (!socketToken) {
          throw new Error("No socket token received");
        }

        console.log("[SocketClient] Socket token obtained");

        // 2. Подключаемся с токеном
        const baseUrl = window.location.origin;
        const socket = getSocket({ baseUrl, socketToken });

        // 3. Ждем успешной авторизации
        socket.once("core:auth:success", () => {
          if (!mounted) return;
          console.log("[SocketClient] Socket authenticated successfully");

          // 4. Настраиваем глобальные обработчики после авторизации
          setupHandlers();

          // 5. Присоединяемся к комнате доктора
          // TODO: получить реальный doctorId из auth
          joinRoom("doctor:seed");
        });

        // Обработка ошибок авторизации
        socket.once("core:auth:error", (error) => {
          console.error("[SocketClient] Socket auth error:", error);
        });

        // Настройка обработчиков (они будут установлены после авторизации)
        const setupHandlers = () => {
          // Глобальный обработчик новых сообщений
          setGlobalHandler("message:new", ({ message }: any) => {
            if (!mounted) return;
            console.log("[SocketClient] message:new received:", message?.id);

            // Обновляем кэш чатов
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.chats() });

            // Обновляем данные пациента если сообщение относится к нему
            if (message?.patientId) {
              queryClient.invalidateQueries({
                queryKey: adminQueryKeys.patient(message.patientId),
              });
            }
          });

          // Глобальный обработчик обновлений аппойнтментов
          setGlobalHandler("appointment:update", ({ appointment }: any) => {
            if (!mounted) return;
            console.log(
              "[SocketClient] appointment:update received:",
              appointment?.id
            );

            // Обновляем список аппойнтментов
            queryClient.invalidateQueries({
              queryKey: ["admin", "appointments"],
            });

            // Обновляем статистику дашборда
            queryClient.invalidateQueries({
              queryKey: adminQueryKeys.dashboard(),
            });

            // Обновляем данные пациента
            if (appointment?.patientId) {
              queryClient.invalidateQueries({
                queryKey: adminQueryKeys.patient(appointment.patientId),
              });
            }
          });

          // Глобальный обработчик новых аппойнтментов
          setGlobalHandler("appointment:new", ({ appointment }: any) => {
            if (!mounted) return;
            console.log(
              "[SocketClient] appointment:new received:",
              appointment?.id
            );

            queryClient.invalidateQueries({
              queryKey: ["admin", "appointments"],
            });
            queryClient.invalidateQueries({
              queryKey: adminQueryKeys.dashboard(),
            });

            if (appointment?.patientId) {
              queryClient.invalidateQueries({
                queryKey: adminQueryKeys.patient(appointment.patientId),
              });
            }
          });

          // Глобальный обработчик отмененных аппойнтментов
          setGlobalHandler(
            "appointment:cancelled",
            ({ appointmentId, patientId }: any) => {
              if (!mounted) return;
              console.log(
                "[SocketClient] appointment:cancelled received:",
                appointmentId
              );

              queryClient.invalidateQueries({
                queryKey: ["admin", "appointments"],
              });
              queryClient.invalidateQueries({
                queryKey: adminQueryKeys.dashboard(),
              });

              if (patientId) {
                queryClient.invalidateQueries({
                  queryKey: adminQueryKeys.patient(patientId),
                });
              }
            }
          );

          // Глобальный обработчик обновлений лечения
          setGlobalHandler("treatment:update", ({ procedure }: any) => {
            if (!mounted) return;
            console.log(
              "[SocketClient] treatment:update received:",
              procedure?.id
            );

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

          console.log("[SocketClient] Global handlers set up");
        };

        // Если уже подключен и авторизован, сразу настраиваем обработчики
        if (socket.connected) {
          // Проверяем, авторизован ли уже (ждем немного)
          setTimeout(() => {
            if (mounted && socket.connected) {
              setupHandlers();
              joinRoom("doctor:seed");
            }
          }, 500);
        }
      } catch (err) {
        console.error("[SocketClient] Failed to setup socket:", err);
      }
    };

    setupSocket();

    return () => {
      mounted = false;
    };
  }, [queryClient]);

  return null;
}
