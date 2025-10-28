export interface TreatmentStep {
  id: number;
  title: string;
  description: string;
  status?: "completed" | "current" | "upcoming";
  completedAt?: Date;
}

export interface Appointment {
  id: string;
  date: Date;
  time: string;
  doctor: string;
  type: string;
  status: "scheduled" | "completed" | "cancelled";
}

export interface ChatMessage {
  id: string;
  sender: "patient" | "doctor";
  content: string;
  timestamp: Date;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  discount?: number;
}

export interface NotificationSettings {
  appointmentReminders: boolean;
  treatmentUpdates: boolean;
  specialOffers: boolean;
  doctorMessages: boolean;
}
