"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";
import { useAppointments } from "./AppointmentsContext";

export function AppointmentBanner() {
  const { appointments } = useAppointments();
  const firstAppointment = appointments[0];

  if (!firstAppointment) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100">
      <AlertDescription className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="h-5 w-5" />
          <span className="font-bold text-lg text-orange-800 dark:text-orange-200">
            Upcoming Appointment!
          </span>
        </div>
        <div>
          You have a {firstAppointment.title.toLowerCase()} with{" "}
          {firstAppointment.doctor} on {firstAppointment.date} at{" "}
          {firstAppointment.time}. Don&apos;t forget to arrive 15 minutes early.
        </div>
      </AlertDescription>
    </Alert>
  );
}
