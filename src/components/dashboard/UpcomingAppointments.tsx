import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const appointments = [
  {
    id: 1,
    title: "Regular Checkup",
    doctor: "Dr. Sarah Johnson",
    date: "Nov 15, 2025",
    time: "10:30 AM",
    location: "Room 203",
    type: "checkup",
  },
  {
    id: 2,
    title: "Teeth Cleaning",
    doctor: "Dr. Michael Chen",
    date: "Nov 22, 2025",
    time: "2:00 PM",
    location: "Room 105",
    type: "cleaning",
  },
  {
    id: 3,
    title: "Follow-up Consultation",
    doctor: "Dr. Sarah Johnson",
    date: "Dec 1, 2025",
    time: "11:00 AM",
    location: "Room 203",
    type: "consultation",
  },
];

export function UpcomingAppointments() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex items-start justify-between rounded-lg border border-border bg-gradient-subtle p-4 transition-all hover:shadow-sm"
            >
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{appointment.title}</p>
                <p className="text-sm text-muted-foreground">{appointment.doctor}</p>
                <div className="flex flex-col gap-1 pt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{appointment.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{appointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{appointment.location}</span>
                  </div>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Reschedule
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
