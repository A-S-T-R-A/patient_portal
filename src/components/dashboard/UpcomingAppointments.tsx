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
import { Feather } from "@expo/vector-icons";
import { useAppointments } from "./AppointmentsContext";

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

  const handleReschedule = () => {
    if (isRescheduling || !newDateTime) return;

    setIsRescheduling(true);
    setTimeout(() => {
      const dateTime = new Date(newDateTime);
      const formattedDate = dateTime.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const formattedTime = dateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === selectedAppointment.id
            ? { ...appointment, date: formattedDate, time: formattedTime }
            : appointment
        )
      );

      setIsRescheduleOpen(false);
      setIsRescheduling(false);
      setNewDateTime("");
    }, 1000);
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
        <Feather name="calendar" size={20} color="#007AFF" />
        <Text style={styles.title}>Upcoming Appointments</Text>
      </View>

      <View style={styles.content}>
        {appointments.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.appointmentContent}>
              <Text style={styles.appointmentTitle}>{appointment.title}</Text>
              <Text style={styles.appointmentDoctor}>{appointment.doctor}</Text>

              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Feather name="calendar" size={14} color="#666" />
                  <Text style={styles.detailText}>{appointment.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Feather name="clock" size={14} color="#666" />
                  <Text style={styles.detailText}>{appointment.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Feather name="map-pin" size={14} color="#666" />
                  <Text style={styles.detailText}>{appointment.location}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.rescheduleButton}
              onPress={() => handleOpenReschedule(appointment)}
            >
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </TouchableOpacity>
          </View>
        ))}
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
                  <Feather name="calendar" size={20} color="#666" />
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
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 14,
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
