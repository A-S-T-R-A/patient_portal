import { TreatmentStep } from "@/shared/config/types";

export const mockTreatmentSteps: TreatmentStep[] = [
  {
    id: "1",
    title: "Initial Consultation",
    subtitle: "Meet with your doctor",
    status: "done",
    eta: "Completed Oct 15",
  },
  {
    id: "2",
    title: "Treatment Planning",
    subtitle: "Create treatment plan",
    status: "done",
    eta: "Completed Oct 20",
  },
  {
    id: "3",
    title: "Active Treatment",
    subtitle: "Current step",
    status: "current",
    eta: "Expected Nov 5",
  },
  {
    id: "4",
    title: "Follow-up",
    subtitle: "Monitor progress",
    status: "upcoming",
    eta: "Expected Nov 15",
  },
  {
    id: "5",
    title: "Maintenance",
    subtitle: "Ongoing care",
    status: "upcoming",
    eta: "Expected Nov 25",
  },
  {
    id: "6",
    title: "Review",
    subtitle: "Final assessment",
    status: "upcoming",
    eta: "Expected Dec 5",
  },
  {
    id: "7",
    title: "Completion",
    subtitle: "Treatment finished",
    status: "upcoming",
    eta: "Expected Dec 15",
  },
];

export const getCurrentStep = (
  steps: TreatmentStep[]
): TreatmentStep | undefined => {
  return steps.find((step) => step.status === "current");
};

export const getCompletedSteps = (steps: TreatmentStep[]): TreatmentStep[] => {
  return steps.filter((step) => step.status === "done");
};

export const getProgressPercentage = (steps: TreatmentStep[]): number => {
  const completedCount = getCompletedSteps(steps).length;
  return Math.round((completedCount / steps.length) * 100);
};
