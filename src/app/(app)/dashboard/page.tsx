"use client";

import { QuickStats } from "@/components/dashboard/QuickStats";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { TreatmentOverview } from "@/components/dashboard/TreatmentOverview";
import { AppointmentBanner } from "@/components/dashboard/AppointmentBanner";
import { AppointmentsProvider } from "@/components/dashboard/AppointmentsContext";

export default function DashboardPage() {
  return (
    <AppointmentsProvider>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back, Sarah
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s an overview of your dental health journey
            </p>
          </div>

          <AppointmentBanner />
        </div>

        <QuickStats />

        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingAppointments />
          <TreatmentOverview />
        </div>
      </div>
    </AppointmentsProvider>
  );
}
