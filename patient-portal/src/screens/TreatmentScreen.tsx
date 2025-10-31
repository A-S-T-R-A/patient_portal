import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const treatments = [
  {
    id: 1,
    name: "Root Canal Treatment",
    progress: 75,
    status: "in-progress",
    nextStep: "Final restoration scheduled",
    description: "Root canal procedure to treat infected tooth",
    startDate: "Sep 15, 2025",
    estimatedCompletion: "Dec 2025",
  },
  {
    id: 2,
    name: "Dental Implant",
    progress: 40,
    status: "in-progress",
    nextStep: "Osseointegration period",
    description: "Titanium implant placement for missing tooth replacement",
    startDate: "Aug 20, 2025",
    estimatedCompletion: "Feb 2026",
  },
  {
    id: 3,
    name: "Teeth Whitening",
    progress: 100,
    status: "completed",
    nextStep: "Follow-up in 6 months",
    description: "Professional teeth whitening treatment",
    startDate: "Jun 10, 2025",
    estimatedCompletion: "Jun 15, 2025",
    completionDate: "Jun 15, 2025",
  },
];

export default function TreatmentScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Treatment Progress</Text>
          <Text style={styles.subtitle}>
            Track your dental treatment journey and progress
          </Text>
        </View>

        <View style={styles.treatmentsList}>
          {treatments.map((treatment) => (
            <View key={treatment.id} style={styles.treatmentCard}>
              <View style={styles.treatmentHeader}>
                <View style={styles.treatmentInfo}>
                  <Text style={styles.treatmentName}>{treatment.name}</Text>
                  <Text style={styles.treatmentDescription}>
                    {treatment.description}
                  </Text>
                </View>
                <View style={styles.progressInfo}>
                  <Text style={{ fontSize: 18 }}>
                    {treatment.status === "completed" ? "✅" : "⏰"}
                  </Text>
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

              <View style={styles.treatmentDetails}>
                <View style={styles.detailRow}>
                  <Text>➡️</Text>
                  <Text style={styles.detailText}>{treatment.nextStep}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text>📅</Text>
                  <Text style={styles.detailText}>
                    Started: {treatment.startDate}
                  </Text>
                </View>
                {treatment.completionDate ? (
                  <View style={styles.detailRow}>
                    <Text>✅</Text>
                    <Text style={styles.detailText}>
                      Completed: {treatment.completionDate}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.detailRow}>
                    <Text>📅</Text>
                    <Text style={styles.detailText}>
                      Est. completion: {treatment.estimatedCompletion}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  treatmentsList: {
    gap: 20,
  },
  treatmentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  treatmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  treatmentInfo: {
    flex: 1,
    marginRight: 12,
  },
  treatmentName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  treatmentDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  progressInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: "#E5E5E5",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 5,
  },
  progressBarComplete: {
    backgroundColor: "#34C759",
  },
  treatmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
  },
});
