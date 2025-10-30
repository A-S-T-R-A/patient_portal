import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAppointments } from "./AppointmentsContext";

export function AppointmentBanner() {
  const { appointments } = useAppointments();
  const firstAppointment = appointments[0];

  if (!firstAppointment) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Upcoming Appointment!</Text>
        <Text style={styles.text}>
          You have a {firstAppointment.title.toLowerCase()} with{" "}
          {firstAppointment.doctor} on {firstAppointment.date} at{" "}
          {firstAppointment.time}. Don't forget to arrive 15 minutes early.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FED7AA",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#9A3412",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: "#9A3412",
    textAlign: "center",
  },
});
