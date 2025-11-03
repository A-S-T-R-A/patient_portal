import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth, usePatient, useUnreadMessages } from "../../lib/queries";

type Plan = { id: string; title: string; status: string; steps: any };
type Appointment = {
  id: string;
  title: string;
  datetime: string;
  location?: string | null;
};

export function QuickStats() {
  const { data: authData } = useAuth();
  const patientId = authData?.role === "patient" ? authData.userId : null;
  const { data: patientData } = usePatient(patientId);
  const { data: unreadData } = useUnreadMessages(patientId);

  const appts: Appointment[] = patientData?.appointments || [];
  const plans: Plan[] = patientData?.plans || [];

  const now = new Date();
  const upcoming = appts
    .filter((a) => new Date(a.datetime) >= now)
    .sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
  const nextAppointment = upcoming[0] || null;

  const activeTreatments = plans.filter((p) => p.status !== "completed").length;
  const completedTreatments = plans.filter(
    (p) => p.status === "completed"
  ).length;

  const unread = unreadData?.count || 0;

  const cards = useMemo(() => {
    return [
      {
        label: "Next Appointment",
        value: nextAppointment
          ? new Date(nextAppointment.datetime).toLocaleDateString()
          : "—",
        subtext: nextAppointment
          ? new Date(nextAppointment.datetime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        icon: "📅",
        color: "#007AFF",
        bgColor: "#E6F2FF",
      },
      {
        label: "Unread Messages",
        value: String(unread),
        subtext: unread === 1 ? "since last read" : "since last read",
        icon: "💬",
        color: "#34C759",
        bgColor: "#E8F5E9",
      },
      {
        label: "Active Treatments",
        value: String(activeTreatments),
        subtext: "in progress",
        icon: "🩺",
        color: "#007AFF",
        bgColor: "#E6F2FF",
      },
      {
        label: "Completed",
        value: String(completedTreatments),
        subtext: "treatments",
        icon: "🏆",
        color: "#34C759",
        bgColor: "#E8F5E9",
      },
    ];
  }, [nextAppointment, unread, activeTreatments, completedTreatments]);

  return (
    <View style={styles.container}>
      {cards.map((stat) => (
        <View key={stat.label} style={styles.card}>
          <View
            style={[styles.iconContainer, { backgroundColor: stat.bgColor }]}
          >
            <Text style={{ fontSize: 18 }}>{stat.icon}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.label}>{stat.label}</Text>
            <Text style={styles.value}>{stat.value}</Text>
            <Text style={styles.subtext}>{stat.subtext}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginVertical: 8,
  },
  card: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
  },
  subtext: {
    fontSize: 10,
    color: "#666",
  },
});
