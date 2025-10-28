"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/shared/ui/toast";
import { Appointment } from "@/shared/config/types";
import { Calendar, Clock, User, Eye, CalendarDays } from "lucide-react";

export function AppointmentReminder() {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    fetchAppointment();
  }, []);

  const fetchAppointment = async () => {
    try {
      const response = await fetch("/api/appointments/next");
      const data = await response.json();
      setAppointment(data);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to load appointment",
        type: "error",
      });
    }
  };

  const handleReschedule = async () => {
    if (!newDate) {
      addToast({
        title: "Error",
        description: "Please select a new date",
        type: "error",
      });
      return;
    }

    try {
      const response = await fetch("/api/appointments/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateISO: newDate }),
      });

      if (response.ok) {
        const data = await response.json();
        setAppointment(data);
        setIsRescheduleOpen(false);
        setNewDate("");

        const formattedDate = new Date(data.dateISO).toLocaleDateString(
          "en-US",
          {
            weekday: "short",
            month: "short",
            day: "numeric",
          }
        );

        addToast({
          title: "Appointment Rescheduled",
          description: `Rescheduled to ${formattedDate}`,
          type: "success",
        });
      } else {
        throw new Error("Failed to reschedule");
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to reschedule appointment",
        type: "error",
      });
    }
  };

  const formatAppointmentDate = (dateISO: string): string => {
    return new Date(dateISO).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatAppointmentTime = (dateISO: string): string => {
    return new Date(dateISO).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!appointment) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-gray-500">No upcoming appointments</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Next Appointment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium">
              {formatAppointmentDate(appointment.dateISO)}
            </span>
            <Badge variant="outline" className="text-xs">
              {appointment.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {formatAppointmentTime(appointment.dateISO)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{appointment.doctor}</span>
          </div>

          <div className="text-sm text-gray-500">{appointment.type}</div>
        </div>

        <div className="flex gap-2">
          <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1" variant="outline">
                <CalendarDays className="h-4 w-4 mr-2" />
                Reschedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Reschedule Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">New Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleReschedule}
                    className="flex-1"
                    disabled={!newDate}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsRescheduleOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1" variant="default">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Appointment Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Doctor</h4>
                  <p className="text-gray-600">{appointment.doctor}</p>
                </div>
                <div>
                  <h4 className="font-medium">Type</h4>
                  <p className="text-gray-600">{appointment.type}</p>
                </div>
                <div>
                  <h4 className="font-medium">Date & Time</h4>
                  <p className="text-gray-600">
                    {formatAppointmentDate(appointment.dateISO)} at{" "}
                    {formatAppointmentTime(appointment.dateISO)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Status</h4>
                  <Badge
                    variant={
                      appointment.status === "scheduled"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
