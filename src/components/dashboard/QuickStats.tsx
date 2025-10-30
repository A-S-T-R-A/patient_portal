import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

const stats = [
  {
    label: "Next Appointment",
    value: "Nov 15",
    subtext: "in 3 days",
    iconName: "calendar" as const,
    color: "#007AFF",
    bgColor: "#E6F2FF",
  },
  {
    label: "Unread Messages",
    value: "2",
    subtext: "from clinic",
    iconName: "message-square" as const,
    color: "#34C759",
    bgColor: "#E8F5E9",
  },
  {
    label: "Active Treatments",
    value: "2",
    subtext: "in progress",
    iconName: "activity" as const,
    color: "#007AFF",
    bgColor: "#E6F2FF",
  },
  {
    label: "Completed",
    value: "8",
    subtext: "treatments",
    iconName: "award" as const,
    color: "#34C759",
    bgColor: "#E8F5E9",
  },
];

export function QuickStats() {
  return (
    <View style={styles.container}>
      {stats.map((stat) => (
        <View key={stat.label} style={styles.card}>
          <View
            style={[styles.iconContainer, { backgroundColor: stat.bgColor }]}
          >
            <Feather name={stat.iconName} size={20} color={stat.color} />
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
