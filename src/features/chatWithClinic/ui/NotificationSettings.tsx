"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/shared/ui/toast";
import { Settings, Bell } from "lucide-react";

interface NotificationSettings {
  pushEnabled: boolean;
  categories: {
    reminders: boolean;
    offers: boolean;
    updates: boolean;
  };
}

export function NotificationSettings() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      pushEnabled: false,
      categories: {
        reminders: true,
        offers: false,
        updates: true,
      },
    });
  const { addToast } = useToast();

  useEffect(() => {
    if (isSettingsOpen) {
      fetchNotificationSettings();
    }
  }, [isSettingsOpen]);

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch("/api/notifications/settings");
      const data = await response.json();
      setNotificationSettings(data);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to load notification settings",
        type: "error",
      });
    }
  };

  const toggleNotification = async (
    key: keyof NotificationSettings["categories"]
  ) => {
    const newSettings = {
      ...notificationSettings,
      categories: {
        ...notificationSettings.categories,
        [key]: !notificationSettings.categories[key],
      },
    };

    setNotificationSettings(newSettings);

    try {
      const response = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        addToast({
          title: "Settings Saved",
          description: "Notification preferences updated",
          type: "success",
        });
      } else {
        // Revert on error
        setNotificationSettings(notificationSettings);
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to save notification settings",
        type: "error",
      });
    }
  };

  const togglePushEnabled = async () => {
    const newSettings = {
      ...notificationSettings,
      pushEnabled: !notificationSettings.pushEnabled,
    };

    setNotificationSettings(newSettings);

    try {
      const response = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        addToast({
          title: "Settings Saved",
          description: "Push notifications updated",
          type: "success",
        });
      } else {
        setNotificationSettings(notificationSettings);
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to save notification settings",
        type: "error",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Notification Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Push Notifications
                  </label>
                  <Button
                    size="sm"
                    variant={
                      notificationSettings.pushEnabled ? "default" : "outline"
                    }
                    onClick={togglePushEnabled}
                  >
                    {notificationSettings.pushEnabled ? "On" : "Off"}
                  </Button>
                </div>

                {Object.entries(notificationSettings.categories).map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <label className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <Button
                        size="sm"
                        variant={value ? "default" : "outline"}
                        onClick={() =>
                          toggleNotification(
                            key as keyof NotificationSettings["categories"]
                          )
                        }
                      >
                        {value ? "On" : "Off"}
                      </Button>
                    </div>
                  )
                )}
              </div>
              <div className="text-xs text-gray-500">
                Manage your notification preferences to stay updated about your
                treatment.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
