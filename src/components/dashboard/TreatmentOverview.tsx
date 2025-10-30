import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const treatments = [
  {
    id: 1,
    name: "Root Canal Treatment",
    progress: 75,
    status: "in-progress",
    nextStep: "Final restoration scheduled",
  },
  {
    id: 2,
    name: "Dental Implant",
    progress: 40,
    status: "in-progress",
    nextStep: "Osseointegration period",
  },
  {
    id: 3,
    name: "Teeth Whitening",
    progress: 100,
    status: "completed",
    nextStep: "Follow-up in 6 months",
  },
];

export function TreatmentOverview() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="activity" size={20} color="#007AFF" />
        <Text style={styles.title}>Treatment Overview</Text>
      </View>

      <View style={styles.content}>
        {treatments.map((treatment) => (
          <View key={treatment.id} style={styles.treatmentCard}>
            <View style={styles.treatmentHeader}>
              <View style={styles.treatmentInfo}>
                <Text style={styles.treatmentName}>{treatment.name}</Text>
                <Text style={styles.treatmentStep}>{treatment.nextStep}</Text>
              </View>
              <View style={styles.progressInfo}>
                {treatment.status === "completed" ? (
                  <Feather name="check-circle" size={16} color="#34C759" />
                ) : (
                  <Feather name="clock" size={16} color="#007AFF" />
                )}
                <Text style={styles.progressText}>{treatment.progress}%</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${treatment.progress}%` },
                  treatment.status === "completed" &&
                    styles.progressBarComplete,
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  content: {
    gap: 20,
  },
  treatmentCard: {
    gap: 8,
  },
  treatmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  treatmentInfo: {
    flex: 1,
  },
  treatmentName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  treatmentStep: {
    fontSize: 12,
    color: "#666",
  },
  progressInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 4,
  },
  progressBarComplete: {
    backgroundColor: "#34C759",
  },
});
