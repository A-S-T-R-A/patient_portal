"use client";

import { TreatmentProgress } from "@/features/treatmentProgress/ui/TreatmentProgress";
import { AppointmentReminder } from "@/features/appointmentReminder/ui/AppointmentReminder";
import { OffersCarousel } from "@/features/offersCarousel/ui/OffersCarousel";
import { ChatWithClinic } from "@/features/chatWithClinic/ui/ChatWithClinic";
import { NotificationSettings } from "@/features/chatWithClinic/ui/NotificationSettings";
import { Card, CardContent } from "@/components/ui/card";
import { ToastProvider } from "@/shared/ui/toast";
import { User } from "lucide-react";

export function PatientPortal() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome Header */}
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome, Valerii!
                  </h1>
                  <p className="text-gray-600">
                    Here&apos;s your treatment overview
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Progress */}
          <TreatmentProgress />

          {/* Appointment Reminder */}
          <AppointmentReminder />

          {/* Offers */}
          <OffersCarousel />

          {/* Notification Settings */}
          <NotificationSettings />
        </div>

        {/* Sticky Chat Button */}
        <ChatWithClinic />
      </div>
    </ToastProvider>
  );
}
