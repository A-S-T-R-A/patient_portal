import { User, Mail, Phone, Calendar, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  SJ
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">Sarah Johnson</h3>
                <p className="text-sm text-muted-foreground">
                  Patient since 2023
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">sarah.johnson@email.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Date of Birth: Jan 15, 1985</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">New York, NY</span>
              </div>
            </div>

            <Button className="w-full">Edit Profile</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Medical History</CardTitle>
            <CardDescription>
              Your dental treatment history and current conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Current Treatments
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Root Canal Treatment (In Progress)</li>
                  <li>• Dental Implant (Healing Phase)</li>
                </ul>
              </div>

              <div className="rounded-lg border border-border p-4">
                <h4 className="font-semibold text-foreground mb-2">
                  Completed Treatments
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Teeth Whitening (Sep 2025)</li>
                  <li>• Regular Cleaning (Aug 2025)</li>
                  <li>• Cavity Filling (Jul 2025)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
