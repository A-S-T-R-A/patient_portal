import { ChatMessage } from "@/shared/config/types";

export const mockChatMessages: ChatMessage[] = [
  {
    id: "1",
    from: "doctor",
    text: "Hello! How are you feeling after your last appointment?",
    timestampISO: "2024-10-25T10:00:00.000Z",
    read: false,
  },
  {
    id: "2",
    from: "patient",
    text: "Hi Doctor! I'm feeling much better, thank you for asking.",
    timestampISO: "2024-10-25T10:05:00.000Z",
    read: true,
  },
  {
    id: "3",
    from: "doctor",
    text:
      "That's great to hear! Remember to follow the care instructions I gave you.",
    timestampISO: "2024-10-25T10:10:00.000Z",
    read: true,
  },
];

export const formatMessageTime = (timestampISO: string): string => {
  return new Date(timestampISO).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
