import { QuickStats } from "@/components/dashboard/QuickStats";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { TreatmentOverview } from "@/components/dashboard/TreatmentOverview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";

export default function DashboardPage() {
  return (
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

        {/* Appointment Notification */}
        <Alert className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-100">
          <AlertDescription className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5" />
              <span className="font-bold text-lg text-orange-800 dark:text-orange-200">
                Upcoming Appointment!
              </span>
            </div>
            <div>
              You have a dental checkup with Dr. Sarah Johnson on Nov 15, 2025
              at 10:30 AM. Don't forget to arrive 15 minutes early.
            </div>
          </AlertDescription>
        </Alert>
      </div>

      <QuickStats />

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingAppointments />
        <TreatmentOverview />
      </div>
    </div>
  );
}
