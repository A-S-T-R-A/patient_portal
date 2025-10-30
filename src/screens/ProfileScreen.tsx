import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

export default function ProfileScreen() {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const [profileData, setProfileData] = useState({
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    birthDate: "Jan 15, 1985",
    location: "New York, NY",
  });

  const [formData, setFormData] = useState(profileData);

  useEffect(() => {
    if (isEditOpen) {
      setIsModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [isEditOpen, slideAnim]);

  const handleSaveProfile = () => {
    if (isSaving) return;

    setIsSaving(true);
    setTimeout(() => {
      setProfileData(formData);
      setIsEditOpen(false);
      setIsSaving(false);
    }, 1000);
  };

  const handleCancelEdit = () => {
    setFormData(profileData);
    setIsEditOpen(false);
  };

  const handleOpenEdit = () => {
    setFormData(profileData);
    setIsEditOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>
            Manage your personal information and preferences
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="user" size={20} color="#007AFF" />
              <Text style={styles.cardTitle}>Personal Information</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(profileData.name)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.profileName}>{profileData.name}</Text>
                  <Text style={styles.profileSubtext}>Patient since 2023</Text>
                </View>
              </View>

              <View style={styles.infoList}>
                <View style={styles.infoRow}>
                  <Feather name="mail" size={16} color="#666" />
                  <Text style={styles.infoText}>{profileData.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="phone" size={16} color="#666" />
                  <Text style={styles.infoText}>{profileData.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="calendar" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    Date of Birth: {profileData.birthDate}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={16} color="#666" />
                  <Text style={styles.infoText}>{profileData.location}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={handleOpenEdit}
              >
                <Feather name="edit" size={16} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Medical History</Text>
              <Text style={styles.cardDescription}>
                Your dental treatment history and current conditions
              </Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Current Treatments</Text>
                <View style={styles.historyList}>
                  <Text style={styles.historyItem}>
                    • Root Canal Treatment (In Progress)
                  </Text>
                  <Text style={styles.historyItem}>
                    • Dental Implant (Healing Phase)
                  </Text>
                </View>
              </View>

              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Completed Treatments</Text>
                <View style={styles.historyList}>
                  <Text style={styles.historyItem}>
                    • Teeth Whitening (Sep 2025)
                  </Text>
                  <Text style={styles.historyItem}>
                    • Regular Cleaning (Aug 2025)
                  </Text>
                  <Text style={styles.historyItem}>
                    • Cavity Filling (Jul 2025)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <SafeAreaView style={styles.modalContentInner}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={handleCancelEdit}
                >
                  <Feather name="x" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Edit Profile</Text>
                <View style={{ width: 24 }} />
              </View>
              <Text style={styles.modalDescription}>
                Make changes to your profile information here.
              </Text>

              <ScrollView style={styles.modalForm}>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Name</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                    placeholder="Name"
                  />
                </View>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Email</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData({ ...formData, email: text })
                    }
                    placeholder="Email"
                    keyboardType="email-address"
                  />
                </View>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Phone</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.phone}
                    onChangeText={(text) =>
                      setFormData({ ...formData, phone: text })
                    }
                    placeholder="Phone"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Birth Date</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.birthDate}
                    onChangeText={(text) =>
                      setFormData({ ...formData, birthDate: text })
                    }
                    placeholder="Birth Date"
                  />
                </View>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Location</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.location}
                    onChangeText={(text) =>
                      setFormData({ ...formData, location: text })
                    }
                    placeholder="Location"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    isSaving && styles.disabledButton,
                  ]}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  ) : (
                    <Text style={styles.saveButtonText}>Save changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
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
  grid: {
    gap: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  cardContent: {
    gap: 16,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  profileSubtext: {
    fontSize: 14,
    color: "#666",
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#000",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  historySection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  historyList: {
    gap: 4,
  },
  historyItem: {
    fontSize: 14,
    color: "#666",
  },
  modalOverlay: {
    flex: 1,
  },
  modalContent: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContentInner: {
    flex: 1,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  modalForm: {
    maxHeight: 400,
  },
  formRow: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 20,
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
