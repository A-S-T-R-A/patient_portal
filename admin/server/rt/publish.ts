import type { Namespace } from "socket.io";
import { SERVER_EVENTS } from "./events";

let nsRef: Namespace | null = null;

export const publishApi = {
  setNamespace(ns: Namespace) {
    nsRef = ns;
    console.log("[Publish API] Namespace set");
  },

  // всем
  broadcast(event: string, data: any) {
    if (!nsRef) {
      console.warn("[Publish API] Cannot broadcast: namespace not set");
      return;
    }
    console.log(`[Publish API] Broadcasting event: ${event}`);
    nsRef.emit(event, attachMeta(data));
  },

  // комнате
  toRoom(room: string, event: string, data: any) {
    if (!nsRef) {
      console.warn("[Publish API] Cannot send to room: namespace not set");
      return;
    }
    console.log(`[Publish API] Sending to room ${room}: ${event}`);
    nsRef.to(room).emit(event, attachMeta(data));
  },

  // конкретному пользователю (через u:<userId>)
  toUser(userId: string, event: string, data: any) {
    if (!nsRef) {
      console.warn("[Publish API] Cannot send to user: namespace not set");
      return;
    }
    console.log(`[Publish API] Sending to user ${userId}: ${event}`);

    // Отправляем в персональную комнату пользователя
    nsRef.to(`u:${userId}`).emit(event, attachMeta(data));

    // Также отправляем в комнату patient:xxx для обратной совместимости
    // (если это событие для пациента)
    if (userId && !userId.startsWith("doctor:")) {
      nsRef.to(`patient:${userId}`).emit(event, attachMeta(data));
    }
  },
};

function attachMeta<T extends object>(obj: T) {
  if (obj && typeof obj === "object") {
    return {
      ...obj,
      __m: { ts: Date.now() },
    };
  }
  return obj;
}

// Функции для отправки конкретных событий
export function emitNewMessage(patientId: string, message: any) {
  console.log(`[Publish API] emitNewMessage to patient ${patientId}`);
  publishApi.toUser(patientId, SERVER_EVENTS.MESSAGE_NEW, { message });
}

export function emitAppointmentUpdate(patientId: string, appointment: any) {
  console.log(`[Publish API] emitAppointmentUpdate to patient ${patientId}`);
  publishApi.toUser(patientId, SERVER_EVENTS.APPOINTMENT_UPDATE, {
    appointment,
  });
}

export function emitAppointmentNew(
  patientId: string,
  appointment: any,
  by: string
) {
  console.log(`[Publish API] emitAppointmentNew to patient ${patientId}`);
  publishApi.toUser(patientId, SERVER_EVENTS.APPOINTMENT_NEW, {
    appointment,
    by,
  });
}

export function emitAppointmentCancelled(
  patientId: string,
  appointmentId: string,
  by: string
) {
  console.log(`[Publish API] emitAppointmentCancelled to patient ${patientId}`);
  publishApi.toUser(patientId, SERVER_EVENTS.APPOINTMENT_CANCELLED, {
    appointmentId,
    by,
  });
}

export function emitTreatmentUpdate(patientId: string, procedure: any) {
  console.log(`[Publish API] emitTreatmentUpdate to patient ${patientId}`);
  publishApi.toUser(patientId, SERVER_EVENTS.TREATMENT_UPDATE, { procedure });
}
