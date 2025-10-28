import { QuickStats } from "@/components/dashboard/QuickStats";
import { UpcomingAppointments } from "@/components/dashboard/UpcomingAppointments";
import { TreatmentOverview } from "@/components/dashboard/TreatmentOverview";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, Sarah
        </h1>
        <p className="text-muted-foreground">
          Here's an overview of your dental health journey
        </p>
      </div>

      <QuickStats />

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingAppointments />
        <TreatmentOverview />
      </div>
    </div>
  );
};

export default Dashboard;
