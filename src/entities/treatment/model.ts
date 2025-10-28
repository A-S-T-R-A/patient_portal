import { TreatmentStep } from "@/shared/config/types";

export const mockTreatmentSteps: TreatmentStep[] = [
  {
    id: 1,
    title: "Initial Consultation",
    description: "Meet with your doctor",
    status: "completed",
    completedAt: new Date("2024-10-15"),
  },
  {
    id: 2,
    title: "Treatment Planning",
    description: "Create treatment plan",
    status: "completed",
    completedAt: new Date("2024-10-20"),
  },
  {
    id: 3,
    title: "Active Treatment",
    description: "Current step",
    status: "current",
  },
  {
    id: 4,
    title: "Follow-up",
    description: "Monitor progress",
    status: "upcoming",
  },
  {
    id: 5,
    title: "Maintenance",
    description: "Ongoing care",
    status: "upcoming",
  },
  {
    id: 6,
    title: "Review",
    description: "Final assessment",
    status: "upcoming",
  },
  {
    id: 7,
    title: "Completion",
    description: "Treatment finished",
    status: "upcoming",
  },
];

export const getCurrentStep = (
  steps: TreatmentStep[]
): TreatmentStep | undefined => {
  return steps.find((step) => step.status === "current");
};

export const getCompletedSteps = (steps: TreatmentStep[]): TreatmentStep[] => {
  return steps.filter((step) => step.status === "completed");
};

export const getProgressPercentage = (steps: TreatmentStep[]): number => {
  const completedCount = getCompletedSteps(steps).length;
  return Math.round((completedCount / steps.length) * 100);
};
