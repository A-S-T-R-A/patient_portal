import { Calendar, MessageSquare, Activity, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stats = [
  {
    label: "Next Appointment",
    value: "Nov 15",
    subtext: "in 3 days",
    icon: Calendar,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Unread Messages",
    value: "2",
    subtext: "from clinic",
    icon: MessageSquare,
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    label: "Active Treatments",
    value: "2",
    subtext: "in progress",
    icon: Activity,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    label: "Completed",
    value: "8",
    subtext: "treatments",
    icon: Award,
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

export function QuickStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="shadow-md transition-all hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
