import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { API_BASE, connectSocket, resolvePatientId } from "../lib/api";

const screenWidth = Dimensions.get("window").width;
const isMobile = screenWidth < 768;

const initialConversations = [
  {
    id: 1,
    sender: "Your Doctor",
    role: "Doctor",
    lastMessage: "",
    time: "",
    unread: false,
  },
];

export default function MessagesScreen() {
  const messagesEndRef = useRef<ScrollView>(null);
  const wsRef = useRef<any | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isConversationsCollapsed, setIsConversationsCollapsed] =
    useState(false);

  useEffect(() => {
    // Resolve patient once on mount
    (async () => {
      const id = await resolvePatientId();
      setPatientId(id);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "pp_lastReadAt",
            new Date().toISOString()
          );
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    // Load messages when conversation opens
    (async () => {
      if (!selectedConversation || !patientId) return;
      const res = await fetch(`${API_BASE}/patients/${patientId}/messages`);
      const data = await res.json();
      const msgs = (data.messages || []).map((m: any) => ({
        id: m.id,
        sender: m.sender === "doctor" ? selectedConversation.sender : "You",
        content: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: m.sender !== "doctor",
      }));
      setMessages(msgs);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "pp_lastReadAt",
            new Date().toISOString()
          );
        }
      } catch {}
    })();
  }, [selectedConversation, patientId]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Single Socket.IO connection
  useEffect(() => {
    if (!patientId) return;
    if (wsRef.current) return; // prevent duplicates
    const socket: any = connectSocket({ patientId });
    wsRef.current = socket;
    socket.on("message:new", ({ message: m }: any) => {
      const rendered = {
        id: m.id,
        sender:
          m.sender === "doctor"
            ? selectedConversation?.sender || "Doctor"
            : "You",
        content: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: m.sender !== "doctor",
      };
      setMessages((prev) => [...prev, rendered]);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            "pp_lastReadAt",
            new Date().toISOString()
          );
        }
      } catch {}
      Toast.show({
        type: "info",
        text1:
          m.sender === "doctor" ? "New message from doctor" : "Message sent",
        text2: rendered.content,
      });
    });
    return () => {
      wsRef.current?.disconnect?.();
      wsRef.current = null;
    };
  }, [patientId, selectedConversation?.sender]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!patientId) return;
    const socket: any = wsRef.current;
    const prev = message;
    socket?.emit(
      "message:send",
      { patientId, sender: "patient", content: message.trim() },
      (ack: any) => {
        if (!ack?.ok) {
          setMessage(prev);
          Toast.show({ type: "error", text1: "Failed to send message" });
        }
      }
    );
    setMessage("");
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("pp_lastReadAt", new Date().toISOString());
      }
    } catch {}
  };

  const handleSelectConversation = (conv: any) => {
    setSelectedConversation(conv);
    setShowChat(true);
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: false } : c))
    );
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedConversation(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  if (isMobile) {
    if (showChat && selectedConversation) {
      return (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackToList}
              >
                <Text style={{ fontSize: 20 }}>←</Text>
              </TouchableOpacity>
              <View style={styles.chatHeader}>
                <View style={styles.chatAvatar}>
                  <Text style={styles.chatAvatarText}>
                    {getInitials(selectedConversation.sender)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.chatHeaderName}>
                    {selectedConversation.sender}
                  </Text>
                  <Text style={styles.chatHeaderRole}>
                    {selectedConversation.role}
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              ref={messagesEndRef}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageContainer,
                    msg.isOwn ? styles.messageOwn : styles.messageOther,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      msg.isOwn
                        ? styles.messageBubbleOwn
                        : styles.messageBubbleOther,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.isOwn
                          ? styles.messageTextOwn
                          : styles.messageTextOther,
                      ]}
                    >
                      {msg.content}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        msg.isOwn
                          ? styles.messageTimeOwn
                          : styles.messageTimeOther,
                      ]}
                    >
                      {msg.time}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>➤</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      );
    }

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Messages</Text>
            <Text style={styles.subtitle}>
              Communicate securely with your dental care team
            </Text>
          </View>

          <ScrollView style={styles.conversationsScroll}>
            {conversations.map((conv) => (
              <TouchableOpacity
                key={conv.id}
                style={styles.conversationItem}
                onPress={() => handleSelectConversation(conv)}
              >
                <View style={styles.conversationAvatar}>
                  <Text style={styles.conversationAvatarText}>
                    {getInitials(conv.sender)}
                  </Text>
                </View>
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationSender}>{conv.sender}</Text>
                    {conv.unread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.conversationRole}>{conv.role}</Text>
                  <Text style={styles.conversationMessage} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                  <Text style={styles.conversationTime}>{conv.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>
          Communicate securely with your dental care team
        </Text>
      </View>

      <View style={styles.content}>
        {!isConversationsCollapsed && (
          <View style={styles.conversationsList}>
            <View style={styles.conversationsHeader}>
              <Text style={{ fontSize: 20, color: "#007AFF" }}>💬</Text>
              <Text style={styles.conversationsTitle}>Conversations</Text>
              <TouchableOpacity
                style={styles.collapseButton}
                onPress={() => setIsConversationsCollapsed(true)}
              >
                <Text style={{ fontSize: 18, color: "#666" }}>◀</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.conversationsScroll}>
              {conversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  style={[
                    styles.conversationItem,
                    selectedConversation?.id === conv.id &&
                      styles.conversationItemActive,
                  ]}
                  onPress={() => handleSelectConversation(conv)}
                >
                  <View style={styles.conversationAvatar}>
                    <Text style={styles.conversationAvatarText}>
                      {getInitials(conv.sender)}
                    </Text>
                  </View>
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.conversationSender}>
                        {conv.sender}
                      </Text>
                      {conv.unread && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.conversationRole}>{conv.role}</Text>
                    <Text style={styles.conversationMessage} numberOfLines={1}>
                      {conv.lastMessage}
                    </Text>
                    <Text style={styles.conversationTime}>{conv.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {isConversationsCollapsed ? (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsConversationsCollapsed(false)}
          >
            <Text style={{ fontSize: 18, color: "#666" }}>▶</Text>
          </TouchableOpacity>
        ) : null}

        {selectedConversation ? (
          <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
              <View style={styles.chatAvatar}>
                <Text style={styles.chatAvatarText}>
                  {getInitials(selectedConversation.sender)}
                </Text>
              </View>
              <View>
                <Text style={styles.chatHeaderName}>
                  {selectedConversation.sender}
                </Text>
                <Text style={styles.chatHeaderRole}>
                  {selectedConversation.role}
                </Text>
              </View>
            </View>

            <ScrollView
              ref={messagesEndRef}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageContainer,
                    msg.isOwn ? styles.messageOwn : styles.messageOther,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      msg.isOwn
                        ? styles.messageBubbleOwn
                        : styles.messageBubbleOther,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.isOwn
                          ? styles.messageTextOwn
                          : styles.messageTextOther,
                      ]}
                    >
                      {msg.content}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        msg.isOwn
                          ? styles.messageTimeOwn
                          : styles.messageTimeOther,
                      ]}
                    >
                      {msg.time}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your message..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyChat}>
            <Text style={{ fontSize: 48, color: "#E5E5E5" }}>💬</Text>
            <Text style={styles.emptyChatText}>Select a conversation</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
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
  content: {
    flex: 1,
    flexDirection: "row",
  },
  conversationsList: {
    width: 350,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
    backgroundColor: "#fff",
  },
  conversationsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  collapseButton: {
    marginLeft: "auto",
    padding: 4,
  },
  expandButton: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
    backgroundColor: "#F9F9F9",
  },
  conversationsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  conversationsScroll: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    gap: 12,
  },
  conversationItemActive: {
    backgroundColor: "#F5F5F5",
  },
  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  conversationAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  conversationSender: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  conversationRole: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  conversationMessage: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  conversationTime: {
    fontSize: 10,
    color: "#999",
  },
  chatContainer: {
    flex: 1,
    flexDirection: "column",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  chatAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  chatHeaderRole: {
    fontSize: 12,
    color: "#666",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageContainer: {
    flexDirection: "row",
  },
  messageOwn: {
    justifyContent: "flex-end",
  },
  messageOther: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 12,
  },
  messageBubbleOwn: {
    backgroundColor: "#007AFF",
  },
  messageBubbleOther: {
    backgroundColor: "#F5F5F5",
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageTextOwn: {
    color: "#fff",
  },
  messageTextOther: {
    color: "#000",
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeOwn: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  messageTimeOther: {
    color: "#666",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChat: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyChatText: {
    fontSize: 16,
    color: "#999",
  },
  backButtonText: {
    fontSize: 20,
    color: "#000",
  },
  collapseButtonText: {
    fontSize: 20,
    color: "#666",
  },
  expandButtonText: {
    fontSize: 20,
    color: "#666",
  },
  sendButtonText: {
    fontSize: 20,
    color: "#fff",
  },
});
