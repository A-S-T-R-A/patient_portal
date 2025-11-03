import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppointmentBanner } from "../components/dashboard/AppointmentBanner";
import { QuickStats } from "../components/dashboard/QuickStats";
import { UpcomingAppointments } from "../components/dashboard/UpcomingAppointments";
import { TreatmentOverview } from "../components/dashboard/TreatmentOverview";
import { AppointmentsProvider } from "../components/dashboard/AppointmentsContext";
import { useAuth, usePatient } from "../lib/queries";

export default function DashboardScreen() {
  const { data: authData } = useAuth();
  const patientId = authData?.role === "patient" ? authData.userId : null;
  const { data: patientData } = usePatient(patientId);

  const patientName = authData?.name || patientData?.patient?.name || "there";

  return (
    <AppointmentsProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              Welcome back{patientName ? `, ${patientName}` : ""}
            </Text>
            <Text style={styles.subtitle}>
              Here's an overview of your dental health journey
            </Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <AppointmentBanner />
          </View>

          <View style={{ marginTop: 24 }}>
            <QuickStats />
          </View>

          <View style={styles.grid}>
            <View style={{ marginBottom: 24 }}>
              <UpcomingAppointments />
            </View>
            <TreatmentOverview />
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppointmentsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  grid: {
    marginTop: 24,
  },
});
