import { Appointment } from "@/shared/config/types";

export const mockAppointment: Appointment = {
  id: "1",
  dateISO: "2024-10-31T10:30:00.000Z",
  doctor: "Dr. Smith",
  type: "Follow-up Consultation",
  status: "scheduled",
};

export const formatAppointmentDate = (dateISO: string): string => {
  return new Date(dateISO).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const formatAppointmentTime = (dateISO: string): string => {
  return new Date(dateISO).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
