import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppointments } from "./AppointmentsContext";
import { API_BASE } from "../../lib/api";

export function UpcomingAppointments() {
  const { appointments, setAppointments } = useAppointments();
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [newDateTime, setNewDateTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = new Date();
  const todayString = today.toISOString().slice(0, 16);

  const handleReschedule = async () => {
    if (isRescheduling || !newDateTime || !selectedAppointment?.id) return;
    setIsRescheduling(true);
    try {
      await fetch(
        `${API_BASE}/appointments/${selectedAppointment.id}/reschedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ datetime: newDateTime }),
        }
      );
      // SSE на бэке пришлет обновление; локально только закрываем
      setIsRescheduleOpen(false);
      setNewDateTime("");
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleOpenReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    const initialDate = new Date();
    setSelectedDate(initialDate);
    setNewDateTime(initialDate.toISOString().slice(0, 16));
    setIsRescheduleOpen(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      setNewDateTime(date.toISOString().slice(0, 16));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ fontSize: 18 }}>📅</Text>
        <Text style={styles.title}>Upcoming Appointments</Text>
      </View>

      <View style={styles.content}>
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No upcoming appointments</Text>
            <Text style={styles.emptySubtext}>
              Your scheduled appointments will appear here
            </Text>
          </View>
        ) : (
          appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentContent}>
                <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                {appointment.location ? (
                  <Text style={styles.appointmentDoctor}>
                    {appointment.location}
                  </Text>
                ) : null}

                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Text style={{ fontSize: 14 }}>📅</Text>
                    <Text style={styles.detailText}>
                      {new Date(appointment.datetime).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={{ fontSize: 14 }}>⏰</Text>
                    <Text style={styles.detailText}>
                      {new Date(appointment.datetime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={{ fontSize: 14 }}>📍</Text>
                    <Text style={styles.detailText}>
                      {appointment.location || "Clinic"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.rescheduleButton}
                  onPress={() => handleOpenReschedule(appointment)}
                >
                  <Text style={styles.rescheduleButtonText}>Reschedule</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={async () => {
                    if (
                      !confirm(
                        "Are you sure you want to cancel this appointment?"
                      )
                    )
                      return;
                    try {
                      const res = await fetch(
                        `${API_BASE}/appointments/${appointment.id}`,
                        {
                          method: "DELETE",
                          credentials: "include",
                        }
                      );
                      if (res.ok) {
                        // Appointment will be removed via socket update
                      } else {
                        alert("Failed to cancel appointment");
                      }
                    } catch (error) {
                      alert("Failed to cancel appointment");
                    }
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <Modal
        visible={isRescheduleOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsRescheduleOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reschedule Appointment</Text>
            <Text style={styles.modalDescription}>
              Reschedule your appointment with {selectedAppointment?.doctor} for{" "}
              {selectedAppointment?.title}.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>New Date & Time</Text>
              {Platform.OS === "web" ? (
                <View style={styles.dateTimeInputWrapper}>
                  <input
                    type="datetime-local"
                    value={newDateTime}
                    onChange={(e) => setNewDateTime(e.target.value)}
                    min={todayString}
                    style={{
                      width: "100%",
                      padding: "12px",
                      fontSize: "14px",
                      border: "1px solid #E5E5E5",
                      borderRadius: "6px",
                      backgroundColor: "#fff",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      maxWidth: "100%",
                    }}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.dateTimeInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateTimeText}>
                    {selectedDate.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: 20 }}>📅</Text>
                </TouchableOpacity>
              )}
              {showDatePicker && Platform.OS !== "web" && (
                <DateTimePicker
                  value={selectedDate}
                  mode="datetime"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={today}
                />
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsRescheduleOpen(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.saveButton,
                  (isRescheduling || !newDateTime) && styles.disabledButton,
                ]}
                onPress={handleReschedule}
                disabled={isRescheduling || !newDateTime}
              >
                {isRescheduling ? (
                  <Text style={styles.saveButtonText}>Rescheduling...</Text>
                ) : (
                  <Text style={styles.saveButtonText}>Reschedule</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 12,
  },
  appointmentCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#F9F9F9",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  appointmentContent: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  appointmentDoctor: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  appointmentDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#999",
  },
  rescheduleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#fff",
  },
  rescheduleButtonText: {
    fontSize: 14,
    color: "#007AFF",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#FF3B30",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    overflow: "hidden",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  dateTimeInputWrapper: {
    width: "100%",
    overflow: "hidden",
  },
  dateTimeInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    width: "100%",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateTimeText: {
    fontSize: 14,
    color: "#000",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
