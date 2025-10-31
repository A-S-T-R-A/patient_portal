import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { API_BASE, connectEvents, resolvePatientId } from "../../lib/api";
import Toast from "react-native-toast-message";

type Appointment = {
  id: string;
  title: string;
  datetime: string;
  location?: string | null;
  type: string;
  patientId: string;
};

type AppointmentsContextType = {
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
};

const AppointmentsContext = createContext<AppointmentsContextType | undefined>(
  undefined
);

export function AppointmentsProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    let es: EventSource | null = null;
    (async () => {
      const patientId = await resolvePatientId();
      if (!patientId) return;
      const res = await fetch(`${API_BASE}/patients/${patientId}`);
      const data = await res.json();
      const appts = (data.appointments || []) as Appointment[];
      setAppointments(appts);
      es = connectEvents({ patientId });
      es.addEventListener("appointment.update", (e: MessageEvent) => {
        try {
          const payload = JSON.parse((e as any).data);
          const appt = payload?.appointment as Appointment | undefined;
          if (appt)
            setAppointments((arr) =>
              arr.map((a) => (a.id === appt.id ? appt : a))
            );
          if (appt) {
            Toast.show({
              type: "success",
              text1: "Appointment rescheduled",
              text2: new Date(appt.datetime).toLocaleString(),
            });
          }
        } catch {}
      });
    })();
    return () => es?.close();
  }, []);

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
