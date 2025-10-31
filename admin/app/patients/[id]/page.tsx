"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { API_BASE, connectSocket } from "@/lib/api";

type Appointment = {
  id: string;
  title: string;
  datetime: string;
  location?: string | null;
  type: string;
};
type Plan = { id: string; title: string; status: string; steps: any };
type Message = {
  id: string;
  sender: "doctor" | "patient";
  content: string;
  createdAt: string;
};
type Patient = { id: string; name: string; email: string };

import * as React from "react";

export default function PatientDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = React.use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [reschedule, setReschedule] = useState<{
    id: string;
    when: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/patients/${patientId}`)
      .then((r) => r.json())
      .then((data) => {
        setPatient(data.patient);
        setPlans(data.plans ?? []);
        setAppointments(data.appointments ?? []);
        setMessages(data.messages ?? []);
      })
      .finally(() => setLoading(false));
    // Realtime updates via WebSocket
    const socket: any = connectSocket({ patientId });
    socket.on("message:new", ({ message }: any) => {
      setMessages((m) => [...m, message]);
    });
    (window as any).__adminPatientSocket = socket;
    return () => socket.disconnect();
  }, [patientId]);

  useLayoutEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    const socket: any | undefined = (window as any).__adminPatientSocket;
    socket?.emit(
      "message:send",
      { patientId, sender: "doctor", content: message.trim() },
      (ack: any) => {
        if (!ack?.ok) {
          // revert input on failure
          setMessage(message);
          alert("Failed to send message");
        }
      }
    );
    setMessage("");
  };

  const onMessageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const doReschedule = async () => {
    if (!reschedule?.id || !reschedule.when) return;
    const r = await fetch(
      `${API_BASE}/appointments/${reschedule.id}/reschedule`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datetime: reschedule.when }),
      }
    );
    const data = await r.json();
    setAppointments((arr) =>
      arr.map((a) => (a.id === data.appointment.id ? data.appointment : a))
    );
    setReschedule(null);
  };

  if (loading)
    return <div className="animate-pulse text-slate-500">Loading…</div>;
  if (!patient) return <p className="text-red-600">Patient not found</p>;

  return (
    <div className="space-y-8">
      <section className="bg-white/80 backdrop-blur rounded-xl border shadow-sm p-5">
        <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
        <p className="text-slate-600">{patient.email}</p>
      </section>

      <section className="bg-white/80 backdrop-blur rounded-xl border shadow-sm p-5">
        <h2 className="text-xl font-semibold mb-3">Treatment plan</h2>
        {plans.length === 0 ? (
          <p className="text-slate-500">No plan</p>
        ) : (
          <ul className="list-disc pl-5 text-sm text-slate-800">
            {plans.map((p) => (
              <li key={p.id}>
                <span className="font-medium">{p.title}</span> — {p.status}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white/80 backdrop-blur rounded-xl border shadow-sm p-5">
        <h2 className="text-xl font-semibold mb-3">Appointments</h2>
        {appointments.length === 0 ? (
          <p className="text-slate-500">No appointments</p>
        ) : (
          <ul className="space-y-2">
            {appointments.map((a) => (
              <li
                key={a.id}
                className="border rounded-lg p-3 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div>
                  <div className="font-medium text-slate-900">{a.title}</div>
                  <div className="text-sm text-slate-600">
                    {new Date(a.datetime).toLocaleString()}{" "}
                    {a.location ? `· ${a.location}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {reschedule?.id === a.id ? (
                    <>
                      <input
                        type="datetime-local"
                        className="border rounded px-2 py-1 text-sm"
                        value={reschedule.when}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) =>
                          setReschedule({ id: a.id, when: e.target.value })
                        }
                      />
                      <button
                        className="px-2 py-1 text-sm bg-blue-600 text-white rounded shadow"
                        onClick={doReschedule}
                        disabled={!reschedule.when}
                      >
                        Save
                      </button>
                      <button
                        className="px-2 py-1 text-sm text-slate-700"
                        onClick={() => setReschedule(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      className="px-2 py-1 text-sm border rounded hover:bg-slate-100"
                      onClick={() => {
                        const iso = new Date(a.datetime)
                          .toISOString()
                          .slice(0, 16);
                        setReschedule({ id: a.id, when: iso });
                      }}
                    >
                      Reschedule
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white/80 backdrop-blur rounded-xl border shadow-sm p-5">
        <h2 className="text-xl font-semibold mb-3">Messages</h2>
        <div
          ref={messagesContainerRef}
          className="border rounded-lg p-3 space-y-2 max-h-80 overflow-auto bg-white"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                "text-sm flex " +
                (m.sender === "doctor" ? "justify-end" : "justify-start")
              }
            >
              <div
                className={
                  (m.sender === "doctor"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-900") +
                  " px-3 py-2 rounded-xl shadow-sm max-w-[70%]"
                }
              >
                {m.content}
                <div className="mt-1 text-[10px] opacity-70 text-right">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={onMessageKeyDown}
            placeholder="Type a message"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm shadow hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
