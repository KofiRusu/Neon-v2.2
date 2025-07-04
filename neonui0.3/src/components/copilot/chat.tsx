"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import { Mic, MicOff, Volume2, VolumeX, Copy, RefreshCw } from "lucide-react";
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
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join("");

        setMessage(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Enter to send message
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSendMessage();
      }
      // Escape to focus input
      if (e.key === "Escape") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [message]);

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
    setShowQuickActions(false);

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

  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speakMessage = (text: string) => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const regenerateResponse = () => {
    // Logic to regenerate the last assistant response
    console.log("Regenerating response...");
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

  const quickActions = [
    {
      label: "Analyze Campaigns",
      prompt: "Analyze campaign performance and optimize top 3 strategies",
      icon: SparklesIcon,
      gradient: "from-blue-500 to-purple-600",
    },
    {
      label: "Content Calendar",
      prompt: "Generate content calendar for next month",
      icon: SparklesIcon,
      gradient: "from-purple-500 to-pink-600",
    },
    {
      label: "Email Optimization",
      prompt: "Optimize email automation sequences",
      icon: SparklesIcon,
      gradient: "from-pink-500 to-red-600",
    },
  ];

  const renderMessage = (msg: Message, index: number) => {
    const isUser = msg.role === "user";
    const isSystem = msg.role === "system";
    const isLast = index === displayMessages.length - 1;

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: index * 0.1,
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={`group flex gap-3 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${isUser ? "flex-row-reverse" : ""} ${isSystem ? "justify-center" : ""}`}
      >
        {!isSystem && (
          <motion.div
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback
                className={
                  isUser
                    ? "bg-blue-100 dark:bg-blue-900"
                    : "bg-purple-100 dark:bg-purple-900"
                }
              >
                {isUser ? (
                  <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <CpuChipIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                )}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        )}

        <div
          className={`flex-1 space-y-2 ${isUser ? "text-right" : ""} ${isSystem ? "text-center" : ""}`}
        >
          {isSystem ? (
            <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
              <ClockIcon className="w-3 h-3 mr-1" />
              {msg.content}
            </Badge>
          ) : (
            <>
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.1 }}
                className={`inline-block max-w-[85%] p-4 rounded-2xl ${
                  isUser
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700 shadow-sm"
                }`}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {msg.content.split("\n").map((line, i) => (
                    <p
                      key={i}
                      className={`${i === 0 ? "" : "mt-2"} ${isUser ? "text-white" : ""}`}
                    >
                      {line}
                    </p>
                  ))}
                </div>

                {/* Message Actions */}
                {!isUser && isLast && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakMessage(msg.content)}
                      aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
                      className="p-1 h-auto"
                    >
                      {isSpeaking ? (
                        <VolumeX className="h-3 w-3" />
                      ) : (
                        <Volume2 className="h-3 w-3" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(msg.content)}
                      aria-label="Copy message"
                      className="p-1 h-auto"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={regenerateResponse}
                      aria-label="Regenerate response"
                      className="p-1 h-auto"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>

              <div
                className={`text-xs text-gray-500 dark:text-gray-400 ${isUser ? "text-right" : "text-left"}`}
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
    <div
      className="h-full flex flex-col"
      role="region"
      aria-label="Chat interface"
    >
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-0" ref={scrollAreaRef}>
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {displayMessages.map((msg, index) => renderMessage(msg, index))}

            {/* Streaming Message */}
            {isTyping && streamingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-3 p-4"
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-purple-100 dark:bg-purple-900">
                    <CpuChipIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="inline-block max-w-[85%] p-4 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200 dark:border-gray-700">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {streamingMessage}
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="inline-block w-2 h-4 bg-purple-600 dark:bg-purple-400 ml-1"
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
                exit={{ opacity: 0, y: -20 }}
                className="flex gap-3 p-4"
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback className="bg-purple-100 dark:bg-purple-900">
                    <CpuChipIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center space-x-1 p-4 rounded-2xl bg-white dark:bg-gray-800 rounded-bl-md border border-gray-200 dark:border-gray-700">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        {/* Quick Actions */}
        <AnimatePresence>
          {showQuickActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2 flex-wrap"
            >
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(action.prompt)}
                    className={`text-xs bg-gradient-to-r ${action.gradient} text-white border-0 hover:scale-105 transition-transform`}
                  >
                    <action.icon className="w-3 h-3 mr-1" />
                    {action.label}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask the Copilot anything about your marketing..."
              className="pr-24 rounded-xl border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
              disabled={askCopilotMutation.isLoading || isTyping}
              aria-label="Message input"
              aria-describedby="input-help"
            />

            {/* Voice Input Button */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              {typeof window !== "undefined" &&
                "webkitSpeechRecognition" in window && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSpeechRecognition}
                    aria-label={
                      isListening ? "Stop voice input" : "Start voice input"
                    }
                    className={`p-2 h-auto ${isListening ? "text-red-500" : "text-gray-500"}`}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSendMessage}
              disabled={
                !message.trim() || askCopilotMutation.isLoading || isTyping
              }
              size="sm"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl"
              aria-label="Send message"
            >
              {askCopilotMutation.isLoading || isTyping ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              ) : (
                <ArrowUpIcon className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </div>

        {/* Helper Text */}
        <p id="input-help" className="text-xs text-gray-500 dark:text-gray-400">
          Press ⌘↵ to send, Esc to focus input
          {typeof window !== "undefined" &&
            "webkitSpeechRecognition" in window &&
            ", click mic for voice input"}
        </p>
      </div>
    </div>
  );
}
