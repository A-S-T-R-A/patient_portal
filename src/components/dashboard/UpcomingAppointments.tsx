"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function UpcomingAppointments() {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [newDateTime, setNewDateTime] = useState("");
  const [appointments, setAppointments] = useState([
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
  ]);

  const today = new Date();
  const todayString = today.toISOString().slice(0, 16);

  const handleReschedule = () => {
    if (isRescheduling || !newDateTime) return;

    setIsRescheduling(true);
    setTimeout(() => {
      const dateTime = new Date(newDateTime);
      const formattedDate = dateTime.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const formattedTime = dateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === selectedAppointment.id
            ? { ...appointment, date: formattedDate, time: formattedTime }
            : appointment
        )
      );

      toast.success(
        `Appointment "${selectedAppointment.title}" rescheduled to ${formattedDate} at ${formattedTime}!`
      );
      setIsRescheduleOpen(false);
      setIsRescheduling(false);
      setNewDateTime("");
    }, 1000);
  };

  const handleOpenReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setNewDateTime(todayString);
    setIsRescheduleOpen(true);
  };

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
                <p className="font-semibold text-foreground">
                  {appointment.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {appointment.doctor}
                </p>
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenReschedule(appointment)}
              >
                Reschedule
              </Button>
            </div>
          ))}
        </div>

        {/* Reschedule Dialog */}
        <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Reschedule Appointment</DialogTitle>
              <DialogDescription>
                Reschedule your appointment with {selectedAppointment?.doctor}{" "}
                for {selectedAppointment?.title}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newDateTime" className="text-right">
                  New Date & Time
                </Label>
                <div className="col-span-3">
                  <Input
                    id="newDateTime"
                    type="datetime-local"
                    value={newDateTime}
                    onChange={(e) => setNewDateTime(e.target.value)}
                    min={todayString}
                    className="w-fit"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRescheduleOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={isRescheduling || !newDateTime}
              >
                {isRescheduling ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Rescheduling...
                  </>
                ) : (
                  "Reschedule"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
