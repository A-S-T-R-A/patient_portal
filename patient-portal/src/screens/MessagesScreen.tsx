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
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE, connectSocket } from "../lib/api";
import { storageSync } from "../lib/storage";
import { colors } from "../lib/colors";
import { useMessages, usePatientId } from "../lib/queries";
import { Header } from "../components/Header";

const screenWidth = Dimensions.get("window").width;
const isMobile = screenWidth < 768;

export default function MessagesScreen() {
  const messagesEndRef = useRef<ScrollView>(null);
  const wsRef = useRef<any | null>(null);
  const selectedConversationRef = useRef<any>(null);
  const patientId = usePatientId();
  const queryClient = useQueryClient();
  const { data: messagesData, isLoading: isLoadingMessages } = useMessages(patientId);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isConversationsCollapsed, setIsConversationsCollapsed] =
    useState(false);

  // Keep ref in sync with state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Load conversations from cached messages data
  // This effect runs whenever messagesData changes (including when new messages arrive via socket)
  useEffect(() => {
    if (!patientId || !messagesData) return;

    console.log("[MessagesScreen] Updating conversations from messagesData, count:", messagesData.length);

    // Also fetch patient data for appointments
    (async () => {
      try {
        const patientRes = await fetch(`${API_BASE}/patients/${patientId}`, {
          credentials: "include",
        });
        const patientData = await patientRes.json();
        const appointments = patientData.appointments || [];

        // Check if there are any scheduled (future) appointments
        const now = new Date();
        const hasScheduledAppointment = appointments.some(
          (apt: any) => new Date(apt.datetime) > now
        );

        // Check if there are any messages from a doctor
        const hasDoctorMessages = messagesData.some((m: any) => m.sender === "doctor");

        // Show conversation if there are doctor messages OR scheduled appointments
        if (hasDoctorMessages || hasScheduledAppointment) {
          let doctorName = "Your Doctor";

          // Get last message overall (not just from doctor)
          const lastMsg = [...messagesData].sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

          setConversations([
            {
              id: 1,
              sender: doctorName,
              role: "Doctor",
              lastMessage: lastMsg?.content || "",
              time: lastMsg
                ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
              unread: messagesData.some((m: any) => 
                m.sender === "doctor" && 
                (!selectedConversation || selectedConversation.id !== 1)
              ),
            },
          ]);
        } else {
          // No doctor messages and no scheduled appointments - don't show conversations
          setConversations([]);
        }

        storageSync.setItem("pp_lastReadAt", new Date().toISOString());
      } catch (e) {
        console.error("Failed to load conversations:", e);
        setConversations([]);
      }
    })();
  }, [patientId, messagesData, selectedConversation]);

  // Load messages when conversation opens - use cached data
  // Also update when messagesData changes (new messages arrive via socket)
  useEffect(() => {
    if (!selectedConversation || !patientId || !messagesData) return;
    
    // Use cached messages data instead of fetching
    // Sort by createdAt to ensure correct order
    const sortedMessages = [...messagesData].sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const msgs = sortedMessages.map((m: any) => ({
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
      storageSync.setItem("pp_lastReadAt", new Date().toISOString());
    } catch {}
  }, [selectedConversation, patientId, messagesData]);

  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Single Socket.IO connection
  useEffect(() => {
    if (!patientId) {
      console.log("[MessagesScreen] No patientId, skipping socket setup");
      return;
    }
    let mounted = true;

    console.log("[MessagesScreen] Setting up socket connection for patientId:", patientId);

    // Get or create socket connection
    (async () => {
      let socket: any = wsRef.current;

      // If socket doesn't exist or is disconnected, create/reuse singleton
      if (!socket || !socket.connected) {
        console.log("[MessagesScreen] Socket not connected, creating new connection");
        socket = await connectSocket({ patientId });
        wsRef.current = socket;
      
        // Wait for connection if not connected
        if (!socket.connected) {
          console.log("[MessagesScreen] Waiting for socket connection...");
          socket.once("connect", () => {
            console.log("[MessagesScreen] Socket connected, patientId:", patientId);
          });
        } else {
          console.log("[MessagesScreen] Socket already connected");
        }
      } else {
        console.log("[MessagesScreen] Reusing existing socket connection");
      }

      // Setup message listeners (remove old ones first to prevent duplicates)
      const messagesClearedHandler = () => {
        if (mounted) {
          // Clear React Query cache
          if (patientId) {
            queryClient.setQueryData(["messages", patientId], []);
          }
          setMessages([]);
          setConversations([]);
          setSelectedConversation(null);
        }
      };

      const messageNewHandler = ({ message: m }: any) => {
      // Only process messages for this patient
      if (!mounted || !m || (m.patientId && m.patientId !== patientId)) return;
      
      console.log("[MessagesScreen] New message received via socket:", m);
      
      // Update React Query cache with new message
      // This will trigger the useEffect that watches messagesData
      if (patientId) {
        queryClient.setQueryData(
          ["messages", patientId],
          (oldData: any[] | undefined) => {
            if (!oldData) {
              console.log("[MessagesScreen] No existing messages, creating new array with message:", m.id);
              return [m];
            }
            // Check if message already exists (avoid duplicates)
            const exists = oldData.some((msg) => msg.id === m.id);
            if (exists) {
              console.log("[MessagesScreen] Message already exists in cache, skipping:", m.id);
              return oldData;
            }
            console.log("[MessagesScreen] Adding new message to cache:", m.id, "Total messages:", oldData.length + 1);
            return [...oldData, m];
          }
        );
      }
      
      // Also update local messages state immediately for instant UI update
      // This will be synced by useEffect watching messagesData, but immediate update is better UX
      if (selectedConversationRef.current) {
        const rendered = {
          id: m.id,
          sender:
            m.sender === "doctor"
              ? selectedConversationRef.current?.sender || "Doctor"
              : "You",
          content: m.content,
          time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isOwn: m.sender !== "doctor",
        };
        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((msg) => msg.id === m.id);
          if (exists) {
            console.log("[MessagesScreen] Message already in local state, skipping:", m.id);
            return prev;
          }
          console.log("[MessagesScreen] Adding message to local state:", m.id);
          return [...prev, rendered];
        });
      }

      // If it's a message from doctor and we don't have a conversation yet, create one
      if (m.sender === "doctor") {
        setConversations((prev) => {
          const existingConv = prev.find((conv) => conv.id === 1);
          if (!existingConv) {
            // Create new conversation for first doctor message
            return [
              {
                id: 1,
                sender: "Your Doctor",
                role: "Doctor",
                lastMessage: m.content,
                time: new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                unread: true,
              },
            ];
          } else {
            // Update last message in existing conversation (always update with latest message)
            return prev.map((conv) =>
              conv.id === 1
                ? {
                    ...conv,
                    lastMessage: m.content,
                    time: new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    unread:
                      (m.sender === "doctor" &&
                        (!selectedConversationRef.current ||
                          selectedConversationRef.current.id !== conv.id)) ||
                      false,
                  }
                : conv
            );
          }
        });

        // If this is first message and we're not in chat view, auto-select the conversation
        if (!selectedConversation && !showChat) {
          setSelectedConversation({
            id: 1,
            sender: "Your Doctor",
            role: "Doctor",
            lastMessage: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unread: false,
          });
          // Messages will be loaded from cache via useEffect that watches messagesData
        }
      }

      try {
        storageSync.setItem("pp_lastReadAt", new Date().toISOString());
      } catch {}

      // Show toast notification (already have native notification in App.tsx)
      // But toast helps for web version
      if (m.sender === "doctor") {
        Toast.show({
          type: "info",
          text1: "New message from doctor",
          text2: rendered.content,
        });
      }
    };

      // Remove old listeners before adding new ones
      // IMPORTANT: Only remove our specific handlers, not all handlers!
      // The global handler in App.tsx must remain active
      socket.off("messages:cleared", messagesClearedHandler);
      socket.off("message:new", messageNewHandler);

      // Add new listeners
      socket.on("messages:cleared", messagesClearedHandler);
      socket.on("message:new", messageNewHandler);
      
      console.log("[MessagesScreen] Socket listeners setup complete, message:new listeners:", socket.listeners("message:new").length);
    })();

    return () => {
      mounted = false;
      // Cleanup happens automatically when component unmounts
    };
  }, [patientId]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!patientId) return;

    let socket: any = wsRef.current;

    // If socket doesn't exist or is disconnected, reconnect
    if (!socket || !socket.connected) {
      socket = await connectSocket({ patientId });
      wsRef.current = socket;

      // Wait for connection
      if (!socket.connected) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 2000);
          socket.once("connect", () => {
            clearTimeout(timeout);
            resolve();
          });
          socket.once("connect_error", () => {
            clearTimeout(timeout);
            resolve();
          });
        });

        // If still not connected, show error
        if (!socket.connected) {
          Toast.show({
            type: "error",
            text1: "Connection lost",
            text2: "Please refresh the page",
          });
          return;
        }
      }
    }

    const prev = message.trim();
    const msgContent = prev;
    setMessage(""); // Clear input immediately

    socket.emit(
      "message:send",
      { patientId, sender: "patient", content: msgContent },
      (ack: any) => {
        if (!ack?.ok) {
          // Revert input on failure
          setMessage(msgContent);
          Toast.show({ type: "error", text1: "Failed to send message" });
        } else {
          // Update conversation last message when message is sent successfully
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === 1
                ? {
                    ...conv,
                    lastMessage: msgContent,
                    time: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  }
                : conv
            )
          );
        }
      }
    );

    try {
      storageSync.setItem("pp_lastReadAt", new Date().toISOString());
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
                onSubmitEditing={() => {
                  if (message.trim()) {
                    handleSendMessage();
                  }
                }}
                blurOnSubmit={false}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
              >
                <Text style={{ color: colors.primaryWhite, fontSize: 16 }}>➤</Text>
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
          <Header title="Messages" />
          <View style={styles.header}>
            <Text style={styles.subtitle}>
              Communicate securely with your dental care team
            </Text>
          </View>

          <ScrollView style={styles.conversationsScroll}>
            {conversations.length === 0 ? (
              <View style={styles.emptyConversations}>
                <Text style={styles.emptyConversationsText}>
                  No conversations yet
                </Text>
                <Text style={styles.emptyConversationsSubtext}>
                  When your doctor sends a message, it will appear here
                </Text>
              </View>
            ) : (
              conversations.map((conv) => (
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
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Messages" />
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          Communicate securely with your dental care team
        </Text>
      </View>
      <View style={styles.content}>
        {!isConversationsCollapsed && (
          <View style={styles.conversationsList}>
            <View style={styles.conversationsHeader}>
              <Text style={{ fontSize: 20, color: colors.textPrimary }}>💬</Text>
              <Text style={styles.conversationsTitle}>Conversations</Text>
              <TouchableOpacity
                style={styles.collapseButton}
                onPress={() => setIsConversationsCollapsed(true)}
              >
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>◀</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.conversationsScroll}>
              {conversations.length === 0 ? (
                <View style={styles.emptyConversations}>
                  <Text style={styles.emptyConversationsText}>
                    No conversations yet
                  </Text>
                  <Text style={styles.emptyConversationsSubtext}>
                    When your doctor sends a message, it will appear here
                  </Text>
                </View>
              ) : (
                conversations.map((conv) => (
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
                      <Text
                        style={styles.conversationMessage}
                        numberOfLines={1}
                      >
                        {conv.lastMessage}
                      </Text>
                      <Text style={styles.conversationTime}>{conv.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}

        {isConversationsCollapsed ? (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsConversationsCollapsed(false)}
          >
            <Text style={{ fontSize: 18, color: colors.textSecondary }}>▶</Text>
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
                onSubmitEditing={() => {
                  if (message.trim()) {
                    handleSendMessage();
                  }
                }}
                blurOnSubmit={false}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendMessage}
              >
                <Text style={{ color: colors.primaryWhite, fontSize: 16 }}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : isLoadingMessages && !messagesData ? (
          <View style={styles.emptyChat}>
            <Text style={{ fontSize: 48, color: colors.greyscale300 }}>⏳</Text>
            <Text style={styles.emptyChatText}>Loading messages...</Text>
          </View>
        ) : (
          <View style={styles.emptyChat}>
            <Text style={{ fontSize: 48, color: colors.greyscale300 }}>💬</Text>
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
    backgroundColor: colors.primaryWhite,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  conversationsList: {
    width: 350,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
    backgroundColor: colors.primaryWhite,
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
    backgroundColor: colors.surface,
  },
  conversationsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
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
    backgroundColor: colors.surface,
  },
  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  conversationAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primaryWhite,
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
    color: colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  conversationRole: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  conversationMessage: {
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  chatAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primaryWhite,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  chatHeaderRole: {
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
  },
  messageBubbleOther: {
    backgroundColor: colors.surface,
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageTextOwn: {
    color: colors.primaryWhite,
  },
  messageTextOther: {
    color: colors.textPrimary,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeOwn: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  messageTimeOther: {
    color: colors.textSecondary,
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
    borderColor: colors.greyscale200,
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
    backgroundColor: colors.primary,
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
    color: colors.textPrimary,
  },
  collapseButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  expandButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  sendButtonText: {
    fontSize: 20,
    color: colors.primaryWhite,
  },
  emptyConversations: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyConversationsText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: "center",
  },
  emptyConversationsSubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
