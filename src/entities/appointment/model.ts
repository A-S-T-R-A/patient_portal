import { Appointment } from "@/shared/config/types";

export const mockAppointment: Appointment = {
  id: "1",
  date: new Date("2024-10-31"),
  time: "10:30",
  doctor: "Dr. Smith",
  type: "Follow-up Consultation",
  status: "scheduled",
};

export const formatAppointmentDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const formatAppointmentTime = (time: string): string => {
  return time;
};
