export const APP_CONFIG = {
  name: "Remedico Patient Portal",
  version: "1.0.0",
} as const;

export const TREATMENT_STEPS = [
  {
    id: 1,
    title: "Initial Consultation",
    description: "Meet with your doctor",
  },
  { id: 2, title: "Treatment Planning", description: "Create treatment plan" },
  {
    id: 3,
    title: "Active Treatment",
    description: "Current step",
    status: "current",
  },
  { id: 4, title: "Follow-up", description: "Monitor progress" },
  { id: 5, title: "Maintenance", description: "Ongoing care" },
  { id: 6, title: "Review", description: "Final assessment" },
  { id: 7, title: "Completion", description: "Treatment finished" },
] as const;

export const NOTIFICATION_TYPES = {
  APPOINTMENT_REMINDER: "appointment_reminder",
  TREATMENT_UPDATE: "treatment_update",
  SPECIAL_OFFER: "special_offer",
  DOCTOR_MESSAGE: "doctor_message",
} as const;
