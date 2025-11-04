import type { Namespace } from "socket.io";
import { SERVER_EVENTS } from "./events";

let nsRef: Namespace | null = null;

export const publishApi = {
  setNamespace(ns: Namespace) {
    nsRef = ns;
  },

  // всем
  broadcast(event: string, data: any) {
    nsRef?.emit(event, attachMeta(data));
  },

  // комнате
  toRoom(room: string, event: string, data: any) {
    nsRef?.to(room).emit(event, attachMeta(data));
  },

  // конкретному пользователю (через u:<userId>)
  toUser(userId: string, event: string, data: any) {
    nsRef?.to(`u:${userId}`).emit(event, attachMeta(data));
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

// Примеры использования (из бизнес-логики/роутов Next.js):
export function emitNewMessage(userId: string, message: any) {
  publishApi.toUser(userId, SERVER_EVENTS.MESSAGE_NEW, { message });
}

export function emitAppointmentUpdate(patientId: string, appointment: any) {
  publishApi.toUser(patientId, SERVER_EVENTS.APPOINTMENT_UPDATE, { appointment });
}

export function emitAppointmentNew(patientId: string, appointment: any, by: string) {
  publishApi.toUser(patientId, SERVER_EVENTS.APPOINTMENT_NEW, { appointment, by });
}

export function emitAppointmentCancelled(patientId: string, appointmentId: string, by: string) {
  publishApi.toUser(patientId, SERVER_EVENTS.APPOINTMENT_CANCELLED, { appointmentId, by });
}

export function emitTreatmentUpdate(patientId: string, procedure: any) {
  publishApi.toUser(patientId, SERVER_EVENTS.TREATMENT_UPDATE, { procedure });
}

