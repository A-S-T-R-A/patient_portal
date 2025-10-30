import { createContext, useContext, useState, ReactNode } from "react";
import { initialAppointments } from "./appointmentsData";

type Appointment = {
  id: number;
  title: string;
  doctor: string;
  date: string;
  time: string;
  location: string;
  type: string;
};

type AppointmentsContextType = {
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
};

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(
  undefined
);

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState(initialAppointments);

  return (
    <AppointmentsContext.Provider value={{ appointments, setAppointments }}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const context = useContext(AppointmentsContext);
  if (context === undefined) {
    throw new Error("useAppointments must be used within AppointmentsProvider");
  }
  return context;
}
