"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  PaperAirplaneIcon,
  UserIcon,
  CpuChipIcon,
  ClockIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { trpc } from "../../utils/trpc";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface CopilotChatProps {
  sessionId: string;
}

export default function CopilotChat({ sessionId }: CopilotChatProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: chatData, refetch } = trpc.copilot.getChatHistory.useQuery({
    sessionId,
  });
  const askCopilotMutation = trpc.copilot.askCopilot.useMutation({
    onSuccess: (data) => {
      // Add assistant response to display
      setIsTyping(false);
      setStreamingMessage("");
      if (refetch) {
        refetch();
      }
    },
    onError: (error) => {
      console.error("Copilot error:", error);
      setIsTyping(false);
      setStreamingMessage("");
    },
  });

  const messages: Message[] = chatData?.data?.messages || [];

  // Mock messages if no data
  const mockMessages: Message[] = [
    {
      id: "msg-1",
      content:
        "Hello! I'm your NeonHub Copilot. I can help you analyze campaigns, optimize strategies, and execute complex marketing tasks. What would you like to work on today?",
      role: "assistant",
      timestamp: new Date().toISOString(),
      metadata: { type: "greeting" },
    },
  ];

  const displayMessages = messages.length > 0 ? messages : mockMessages;

  const simulateStreamingResponse = (response: string) => {
    setStreamingMessage("");
    const words = response.split(" ");
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setStreamingMessage(
          (prev) => prev + (currentIndex > 0 ? " " : "") + words[currentIndex],
        );
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
        setStreamingMessage("");
      }
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage("");

    // Add user message to display immediately (for future use)
    const _newUserMessage: Message = {
      id: `user-${Date.now()}`,
      content: userMessage,
      role: "user",
      timestamp: new Date().toISOString(),
    };

    try {
      setIsTyping(true);

      // Use real backend copilot instead of mock
      askCopilotMutation.mutate({
        input: userMessage,
        sessionId,
        messageType: "query",
        context: {
          focusArea: "campaigns", // Default focus area
        },
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, streamingMessage]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = (msg: Message, index: number) => {
    const isUser = msg.role === "user";
    const isSystem = msg.role === "system";

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`flex gap-3 p-4 ${isUser ? "flex-row-reverse" : ""} ${isSystem ? "justify-center" : ""}`}
      >
        {!isSystem && (
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback
              className={isUser ? "bg-blue-100" : "bg-purple-100"}
            >
              {isUser ? (
                <UserIcon className="w-4 h-4 text-blue-600" />
              ) : (
                <CpuChipIcon className="w-4 h-4 text-purple-600" />
              )}
            </AvatarFallback>
          </Avatar>
        )}

        <div
          className={`flex-1 space-y-2 ${isUser ? "text-right" : ""} ${isSystem ? "text-center" : ""}`}
        >
          {isSystem ? (
            <Badge variant="outline" className="bg-gray-50">
              <ClockIcon className="w-3 h-3 mr-1" />
              {msg.content}
            </Badge>
          ) : (
            <>
              <div
                className={`inline-block max-w-[80%] p-3 rounded-lg ${
                  isUser
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  {msg.content.split("\n").map((line, i) => (
                    <p
                      key={i}
                      className={`${i === 0 ? "" : "mt-2"} ${isUser ? "text-white" : "text-gray-900"}`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
              <div
                className={`text-xs text-gray-500 ${isUser ? "text-right" : "text-left"}`}
              >
                {formatTime(msg.timestamp)}
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-0" ref={scrollAreaRef}>
        <div className="space-y-1">
          {displayMessages.map((msg, index) => renderMessage(msg, index))}

          {/* Streaming Message */}
          {isTyping && streamingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 p-4"
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-purple-100">
                  <CpuChipIcon className="w-4 h-4 text-purple-600" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="inline-block max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-900 rounded-bl-sm">
                  <div className="prose prose-sm max-w-none">
                    {streamingMessage}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="inline-block w-2 h-4 bg-purple-600 ml-1"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Typing Indicator */}
          {isTyping && !streamingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 p-4"
            >
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-purple-100">
                  <CpuChipIcon className="w-4 h-4 text-purple-600" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-1 p-3 rounded-lg bg-gray-100 rounded-bl-sm">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className="w-2 h-2 bg-gray-400 rounded-full"
                />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t p-4 space-y-3">
        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMessage(
                "Analyze campaign performance and optimize top 3 strategies",
              )
            }
            className="text-xs"
          >
            <SparklesIcon className="w-3 h-3 mr-1" />
            Analyze Campaigns
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMessage("Generate content calendar for next month")
            }
            className="text-xs"
          >
            <SparklesIcon className="w-3 h-3 mr-1" />
            Content Calendar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessage("Optimize email automation sequences")}
            className="text-xs"
          >
            <SparklesIcon className="w-3 h-3 mr-1" />
            Email Optimization
          </Button>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the Copilot anything about your marketing..."
            className="flex-1"
            disabled={askCopilotMutation.isLoading || isTyping}
          />
          <Button
            onClick={handleSendMessage}
            disabled={
              !message.trim() || askCopilotMutation.isLoading || isTyping
            }
            size="sm"
            className="px-3"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
