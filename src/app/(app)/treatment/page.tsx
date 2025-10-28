import { Activity, Calendar, CheckCircle, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const treatments = [
  {
    id: 1,
    name: "Root Canal Treatment",
    progress: 75,
    status: "in-progress",
    doctor: "Dr. Sarah Johnson",
    startDate: "Oct 1, 2025",
    estimatedEnd: "Nov 30, 2025",
    phases: [
      { name: "Initial Consultation", completed: true, date: "Oct 1, 2025" },
      { name: "Root Canal Procedure", completed: true, date: "Oct 15, 2025" },
      { name: "Temporary Filling", completed: true, date: "Oct 15, 2025" },
      { name: "Final Restoration", completed: false, date: "Nov 30, 2025" },
    ],
  },
  {
    id: 2,
    name: "Dental Implant",
    progress: 40,
    status: "in-progress",
    doctor: "Dr. Michael Chen",
    startDate: "Sep 15, 2025",
    estimatedEnd: "Feb 15, 2026",
    phases: [
      { name: "Initial Assessment", completed: true, date: "Sep 15, 2025" },
      { name: "Implant Placement", completed: true, date: "Oct 5, 2025" },
      { name: "Healing Period", completed: false, date: "Nov - Jan" },
      { name: "Abutment Placement", completed: false, date: "Jan 20, 2026" },
      { name: "Crown Placement", completed: false, date: "Feb 15, 2026" },
    ],
  },
  {
    id: 3,
    name: "Teeth Whitening",
    progress: 100,
    status: "completed",
    doctor: "Dr. Emily Rodriguez",
    startDate: "Sep 1, 2025",
    estimatedEnd: "Sep 20, 2025",
    phases: [
      { name: "Consultation & Assessment", completed: true, date: "Sep 1, 2025" },
      { name: "Professional Cleaning", completed: true, date: "Sep 5, 2025" },
      { name: "Whitening Treatment", completed: true, date: "Sep 12, 2025" },
      { name: "Follow-up Check", completed: true, date: "Sep 20, 2025" },
    ],
  },
];

export default function TreatmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Treatment Progress
        </h1>
        <p className="text-muted-foreground">
          Track your ongoing and completed dental treatments
        </p>
      </div>

      <div className="space-y-6">
        {treatments.map((treatment) => (
          <Card key={treatment.id} className="shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {treatment.name}
                    {treatment.status === "completed" && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                  </CardTitle>
                  <CardDescription>{treatment.doctor}</CardDescription>
                </div>
                <Badge
                  variant={treatment.status === "completed" ? "default" : "secondary"}
                  className={
                    treatment.status === "completed"
                      ? "bg-success hover:bg-success/90"
                      : ""
                  }
                >
                  {treatment.status === "completed" ? "Completed" : "In Progress"}
                </Badge>
              </div>
              <div className="pt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-semibold text-foreground">
                    {treatment.progress}%
                  </span>
                </div>
                <Progress value={treatment.progress} className="h-2" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium text-foreground">
                    {treatment.startDate}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Expected End:</span>
                  <span className="font-medium text-foreground">
                    {treatment.estimatedEnd}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4" />
                  Treatment Phases
                </h4>
                <div className="space-y-2">
                  {treatment.phases.map((phase, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-lg border border-border bg-gradient-subtle p-3"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          phase.completed
                            ? "bg-success/10"
                            : "bg-muted"
                        }`}
                      >
                        {phase.completed ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            phase.completed
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {phase.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{phase.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
