export interface UserSummary {
  name: string;
  progress: {
    currentStep: number;
    totalSteps: number;
    percent: number;
  };
  nextAppointment: Appointment | null;
  offersCount: number;
  unreadMessages: number;
}

export interface TreatmentStep {
  id: string;
  title: string;
  subtitle?: string;
  status: "done" | "current" | "upcoming";
  eta?: string;
}

export interface Appointment {
  id: string;
  dateISO: string;
  doctor: string;
  type: string;
  status: "scheduled" | "rescheduled";
}

export interface ChatMessage {
  id: string;
  from: "patient" | "doctor";
  text: string;
  timestampISO: string;
  read: boolean;
}

export interface Offer {
  id: string;
  title: string;
  subtitle?: string;
  priceNow: number;
  priceOld?: number;
  discountPercent?: number;
  cta: "View" | "Buy" | "Book";
}

export interface NotificationSettings {
  pushEnabled: boolean;
  categories: {
    reminders: boolean;
    offers: boolean;
    updates: boolean;
  };
}
