"use client";

import { useState } from "react";
import { MessageSquare, Send, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const conversations = [
  {
    id: 1,
    sender: "Dr. Sarah Johnson",
    role: "Dentist",
    lastMessage: "Your next appointment is confirmed for Nov 15.",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    sender: "Clinic Reception",
    role: "Staff",
    lastMessage: "Please arrive 15 minutes early for your checkup.",
    time: "1 day ago",
    unread: true,
  },
  {
    id: 3,
    sender: "Dr. Michael Chen",
    role: "Specialist",
    lastMessage: "The X-ray results look great! Everything is healing well.",
    time: "3 days ago",
    unread: false,
  },
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(
    conversations[0]
  );
  const [message, setMessage] = useState("");

  const messages = [
    {
      id: 1,
      sender: "Dr. Sarah Johnson",
      content: "Hi Sarah, I wanted to follow up on your root canal treatment.",
      time: "10:30 AM",
      isOwn: false,
    },
    {
      id: 2,
      sender: "You",
      content: "Thank you! I'm feeling much better now.",
      time: "10:35 AM",
      isOwn: true,
    },
    {
      id: 3,
      sender: "Dr. Sarah Johnson",
      content:
        "That's great to hear! Your next appointment is confirmed for Nov 15.",
      time: "10:36 AM",
      isOwn: false,
    },
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message logic
      setMessage("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Messages
        </h1>
        <p className="text-muted-foreground">
          Communicate securely with your dental care team
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-md lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left transition-colors hover:bg-muted/50 ${
                    selectedConversation.id === conv.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {conv.sender
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">
                          {conv.sender}
                        </p>
                        {conv.unread && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {conv.role}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {conv.lastMessage}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conv.time}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md lg:col-span-2">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedConversation.sender
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">
                  {selectedConversation.sender}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.role}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex h-[500px] flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.isOwn ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] space-y-1 rounded-lg p-3 ${
                        msg.isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-xs ${
                          msg.isOwn
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
