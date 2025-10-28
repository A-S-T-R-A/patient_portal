import { Activity, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const treatments = [
  {
    id: 1,
    name: "Root Canal Treatment",
    progress: 75,
    status: "in-progress",
    nextStep: "Final restoration scheduled",
  },
  {
    id: 2,
    name: "Dental Implant",
    progress: 40,
    status: "in-progress",
    nextStep: "Osseointegration period",
  },
  {
    id: 3,
    name: "Teeth Whitening",
    progress: 100,
    status: "completed",
    nextStep: "Follow-up in 6 months",
  },
];

export function TreatmentOverview() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Treatment Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {treatments.map((treatment) => (
            <div key={treatment.id} className="space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{treatment.name}</p>
                  <p className="text-sm text-muted-foreground">{treatment.nextStep}</p>
                </div>
                <div className="flex items-center gap-1">
                  {treatment.status === "completed" ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <Clock className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-sm font-medium text-foreground">
                    {treatment.progress}%
                  </span>
                </div>
              </div>
              <Progress value={treatment.progress} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
