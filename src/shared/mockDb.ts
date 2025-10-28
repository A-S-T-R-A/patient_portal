// Mock database with in-memory state
import { 
  UserSummary, 
  TreatmentStep, 
  Appointment, 
  Offer, 
  ChatMessage, 
  NotificationSettings 
} from './config/types';

// Initial mock data
const initialState = {
  userSummary: {
    name: "Valerii",
    progress: {
      currentStep: 3,
      totalSteps: 7,
      percent: 28,
    },
    nextAppointment: {
      id: "1",
      dateISO: "2024-10-31T10:30:00.000Z",
      doctor: "Dr. Smith",
      type: "Follow-up Consultation",
      status: "scheduled" as const,
    },
    offersCount: 3,
    unreadMessages: 1,
  },
  treatmentSteps: [
    {
      id: "1",
      title: "Initial Consultation",
      subtitle: "Meet with your doctor",
      status: "done" as const,
      eta: "Completed Oct 15",
    },
    {
      id: "2",
      title: "Treatment Planning",
      subtitle: "Create treatment plan",
      status: "done" as const,
      eta: "Completed Oct 20",
    },
    {
      id: "3",
      title: "Active Treatment",
      subtitle: "Current step",
      status: "current" as const,
      eta: "Expected Nov 5",
    },
    {
      id: "4",
      title: "Follow-up",
      subtitle: "Monitor progress",
      status: "upcoming" as const,
      eta: "Expected Nov 15",
    },
    {
      id: "5",
      title: "Maintenance",
      subtitle: "Ongoing care",
      status: "upcoming" as const,
      eta: "Expected Nov 25",
    },
    {
      id: "6",
      title: "Review",
      subtitle: "Final assessment",
      status: "upcoming" as const,
      eta: "Expected Dec 5",
    },
    {
      id: "7",
      title: "Completion",
      subtitle: "Treatment finished",
      status: "upcoming" as const,
      eta: "Expected Dec 15",
    },
  ],
  offers: [
    {
      id: "1",
      title: "Whitening Package",
      subtitle: "Professional teeth whitening treatment",
      priceNow: 299,
      priceOld: 399,
      discountPercent: 25,
      cta: "Buy" as const,
    },
    {
      id: "2",
      title: "Night Guard Discount",
      subtitle: "Custom night guard with 20% off",
      priceNow: 199,
      priceOld: 249,
      discountPercent: 20,
      cta: "Book" as const,
    },
    {
      id: "3",
      title: "Dental Cleaning",
      subtitle: "Comprehensive dental cleaning",
      priceNow: 89,
      priceOld: 120,
      discountPercent: 26,
      cta: "Book" as const,
    },
  ],
  chatMessages: [
    {
      id: "1",
      from: "doctor" as const,
      text: "Hello! How are you feeling after your last appointment?",
      timestampISO: "2024-10-25T10:00:00.000Z",
      read: false,
    },
    {
      id: "2",
      from: "patient" as const,
      text: "Hi Doctor! I'm feeling much better, thank you for asking.",
      timestampISO: "2024-10-25T10:05:00.000Z",
      read: true,
    },
    {
      id: "3",
      from: "doctor" as const,
      text: "That's great to hear! Remember to follow the care instructions I gave you.",
      timestampISO: "2024-10-25T10:10:00.000Z",
      read: true,
    },
  ],
  notificationSettings: {
    pushEnabled: false,
    categories: {
      reminders: true,
      offers: false,
      updates: true,
    },
  },
};

// In-memory state
let state = { ...initialState };

// State management functions
export const getState = () => ({ ...state });

export const setState = (patch: Partial<typeof state>) => {
  state = { ...state, ...patch };
};

export const resetState = () => {
  state = { ...initialState };
};

// Mutations
export const advanceStep = (stepId: string) => {
  const stepIndex = state.treatmentSteps.findIndex(
    (step) => step.id === stepId
  );
  if (stepIndex === -1) return false;

  // Mark current step as done
  state.treatmentSteps[stepIndex].status = "done";

  // Mark next step as current
  if (stepIndex + 1 < state.treatmentSteps.length) {
    state.treatmentSteps[stepIndex + 1].status = "current";
  }

  // Update progress
  const completedSteps = state.treatmentSteps.filter(
    (step) => step.status === "done"
  ).length;
  state.userSummary.progress.currentStep = stepIndex + 2;
  state.userSummary.progress.percent = Math.round(
    (completedSteps / state.treatmentSteps.length) * 100
  );

  return true;
};

export const rescheduleAppointment = (dateISO: string) => {
  if (!state.userSummary.nextAppointment) return false;

  state.userSummary.nextAppointment.dateISO = dateISO;
  (state.userSummary.nextAppointment as Appointment).status = "rescheduled";
  return true;
};

export const appendMessage = (text: string) => {
  const newMessage: ChatMessage = {
    id: Date.now().toString(),
    from: "patient",
    text,
    timestampISO: new Date().toISOString(),
    read: true,
  };

  state.chatMessages.push(newMessage);
  return newMessage;
};

export const toggleNotificationSettings = (
  settings: Partial<NotificationSettings>
) => {
  state.notificationSettings = { ...state.notificationSettings, ...settings };
  return state.notificationSettings;
};

export const trackOfferView = (offerId: string) => {
  // Just for telemetry, no state change needed
  console.log(`Offer ${offerId} viewed`);
  return true;
};

export const trackOfferClaim = (offerId: string) => {
  // Just for telemetry, no state change needed
  console.log(`Offer ${offerId} claimed`);
  return true;
};
