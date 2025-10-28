import { ChatMessage } from "@/shared/config/types";

export const mockChatMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "doctor",
    content: "Hello! How are you feeling after your last appointment?",
    timestamp: new Date("2024-10-25T10:00:00"),
  },
  {
    id: "2",
    sender: "patient",
    content: "Hi Doctor! I'm feeling much better, thank you for asking.",
    timestamp: new Date("2024-10-25T10:05:00"),
  },
  {
    id: "3",
    sender: "doctor",
    content:
      "That's great to hear! Remember to follow the care instructions I gave you.",
    timestamp: new Date("2024-10-25T10:10:00"),
  },
];

export const formatMessageTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
