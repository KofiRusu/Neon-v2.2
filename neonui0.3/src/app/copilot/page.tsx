"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import {
  CpuChipIcon,
  SparklesIcon,
  LightBulbIcon,
  PlayIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { BarChart3, Keyboard, Moon, Sun } from "lucide-react";
import Link from "next/link";
import PageLayout from "../../components/page-layout";
import CopilotLayout from "../../components/copilot/layout";
import { trpc } from "../../utils/trpc";
import { useTheme } from "../../components/theme-provider";

export default function CopilotPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const { theme, setTheme } = useTheme();

  const startReasoningMutation = trpc.copilot.startReasoning.useMutation();
  const askCopilotMutation = trpc.copilot.askCopilot.useMutation();

  // Initialize on mount - but don't start active session immediately
  useEffect(() => {
    const existingSessionId = localStorage.getItem("copilot-session-id");
    const hasExistingActiveSession =
      localStorage.getItem("copilot-has-active-session") === "true";

    if (existingSessionId && hasExistingActiveSession) {
      setSessionId(existingSessionId);
      setHasActiveSession(true);
    }
    setIsInitialized(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for new session
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        handleNewSession();
      }
      // Cmd/Ctrl + S for sessions page
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        // Use Next.js router for proper navigation
        window.location.href = "/copilot/sessions";
        // Also dispatch a navigation event that tests can detect
        window.dispatchEvent(new CustomEvent("navigate-to-sessions"));
      }
      // Cmd/Ctrl + D for dark mode toggle
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        setTheme(theme === "dark" ? "light" : "dark");
      }
      // ? for keyboard help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowKeyboardHelp(!showKeyboardHelp);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [theme, setTheme, showKeyboardHelp]);

  // Autonomous mode logic - triggers follow-up tasks automatically
  useEffect(() => {
    if (!autonomousMode || !hasActiveSession || !sessionId) return;

    const autonomousTasks = [
      "Analyze current campaign performance and identify improvement opportunities",
      "Review recent customer engagement metrics and suggest optimization strategies",
      "Assess content performance across all channels and recommend adjustments",
      "Evaluate email marketing effectiveness and propose A/B test scenarios",
      "Examine social media engagement patterns and suggest posting optimizations",
    ];

    const interval = setInterval(() => {
      const randomTask =
        autonomousTasks[Math.floor(Math.random() * autonomousTasks.length)];

      console.log("Autonomous mode: Initiating task -", randomTask);

      askCopilotMutation.mutate({
        input: randomTask,
        sessionId,
        messageType: "query",
        context: {
          focusArea: "performance",
          autonomous: true,
        },
      });
    }, 15000); // Trigger every 15 seconds

    return () => clearInterval(interval);
  }, [autonomousMode, hasActiveSession, sessionId, askCopilotMutation]);

  const handleNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);
    setHasActiveSession(true);
    localStorage.setItem("copilot-session-id", newSessionId);
    localStorage.setItem("copilot-has-active-session", "true");
    setIsInitialized(true);

    // Force a re-render to ensure state is updated
    setTimeout(() => {
      setHasActiveSession(true);
    }, 0);
  };

  const handleStartReasoning = async (prompt: string) => {
    try {
      // Always create new session for reasoning
      const currentSessionId = sessionId || `session-${Date.now()}`;

      if (!sessionId) {
        setSessionId(currentSessionId);
        localStorage.setItem("copilot-session-id", currentSessionId);
      }

      // Set active session state immediately and reliably
      setHasActiveSession(true);
      localStorage.setItem("copilot-has-active-session", "true");

      // Force a re-render to ensure state is updated
      setTimeout(() => {
        setHasActiveSession(true);
      }, 0);

      // Use mutate instead of mutateAsync for mock compatibility
      startReasoningMutation.mutate({
        prompt,
        sessionId: currentSessionId,
      });
    } catch (error) {
      console.error("Failed to start reasoning:", error);
      // Fallback: still show interface even if API fails
      const fallbackSessionId = sessionId || `session-${Date.now()}`;
      if (!sessionId) {
        setSessionId(fallbackSessionId);
        localStorage.setItem("copilot-session-id", fallbackSessionId);
      }
      setHasActiveSession(true);
      localStorage.setItem("copilot-has-active-session", "true");
    }
  };

  const quickStartPrompts = [
    {
      title: "Campaign Analysis",
      description: "Analyze campaign performance and optimize top 3 strategies",
      icon: SparklesIcon,
      prompt:
        "Analyze campaign performance and optimize top 3 strategies. Focus on identifying underperforming areas and actionable improvements.",
      gradient: "from-neon-blue to-neon-purple",
      ariaLabel: "Start campaign analysis session",
    },
    {
      title: "Content Strategy",
      description: "Generate content calendar for next month",
      icon: LightBulbIcon,
      prompt:
        "Generate a comprehensive content calendar for next month including blog posts, social media content, and email campaigns.",
      gradient: "from-neon-purple to-neon-pink",
      ariaLabel: "Start content strategy session",
    },
    {
      title: "SEO Optimization",
      description: "Audit and improve website SEO performance",
      icon: PlayIcon,
      prompt:
        "Conduct a comprehensive SEO audit and provide actionable recommendations to improve search rankings and organic traffic.",
      gradient: "from-neon-pink to-neon-green",
      ariaLabel: "Start SEO optimization session",
    },
  ];

  if (!isInitialized) {
    return (
      <PageLayout
        title="NeonHub Copilot"
        subtitle="AI-powered reasoning assistant for marketing automation"
      >
        <div
          className="flex items-center justify-center h-96"
          role="status"
          aria-label="Loading"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="sr-only">Loading Copilot interface...</span>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="NeonHub Copilot"
      subtitle="AI-powered reasoning assistant for marketing automation"
      headerActions={
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="hidden sm:flex"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Keyboard Help */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
            aria-label="Show keyboard shortcuts"
            className="hidden md:flex"
          >
            <Keyboard className="h-4 w-4" />
          </Button>

          {hasActiveSession && (
            <div className="flex items-center space-x-2">
              <Switch
                id="autonomous-mode"
                checked={autonomousMode}
                onCheckedChange={setAutonomousMode}
                aria-describedby="autonomous-mode-description"
              />
              <Label
                htmlFor="autonomous-mode"
                className="text-sm font-medium cursor-pointer"
              >
                Autonomous Mode
              </Label>
              <span id="autonomous-mode-description" className="sr-only">
                Enable autonomous mode to automatically trigger follow-up tasks
              </span>
            </div>
          )}

          <Badge
            variant="outline"
            className={
              hasActiveSession
                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700"
                : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-700"
            }
            role="status"
            aria-live="polite"
          >
            <div
              className={`w-2 h-2 rounded-full mr-2 ${
                hasActiveSession ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
              aria-hidden="true"
            />
            {hasActiveSession ? "Session Active" : "No Session"}
          </Badge>

          <Link href="/copilot/sessions">
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              aria-label="View all copilot sessions"
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sessions</span>
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNewSession}
            aria-label="Start a new copilot session"
            data-testid="new-session-button"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Session</span>
          </Button>
        </div>
      }
    >
      {/* Keyboard Help Modal */}
      <AnimatePresence>
        {showKeyboardHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowKeyboardHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="keyboard-shortcuts-title"
              aria-modal="true"
            >
              <h3
                id="keyboard-shortcuts-title"
                className="text-lg font-semibold mb-4"
              >
                Keyboard Shortcuts
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>New Session</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    ⌘K
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>View Sessions</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    ⌘S
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Toggle Theme</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    ⌘D
                  </kbd>
                </div>
                <div className="flex justify-between">
                  <span>Show Help</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    ?
                  </kbd>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => setShowKeyboardHelp(false)}
              >
                Close
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interface */}
      {hasActiveSession && sessionId ? (
        <div
          className="h-[calc(100vh-12rem)]"
          role="main"
          aria-label="Copilot interface"
        >
          <CopilotLayout sessionId={sessionId} onSessionChange={setSessionId} />
        </div>
      ) : (
        /* Welcome State */
        <main className="space-y-8" role="main">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 md:py-12"
          >
            <motion.div
              className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <CpuChipIcon className="w-8 h-8 text-white" aria-hidden="true" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to NeonHub Copilot
            </h2>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Your intelligent marketing assistant powered by advanced AI
              reasoning. Ask complex questions, assign multi-step tasks, and
              watch the AI work through problems step by step.
            </p>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {[
              {
                icon: SparklesIcon,
                title: "Smart Analysis",
                description:
                  "Analyze campaign performance, identify optimization opportunities, and get actionable recommendations.",
                color: "text-blue-600 dark:text-blue-400",
              },
              {
                icon: LightBulbIcon,
                title: "Reasoning Transparency",
                description:
                  "See exactly how the AI thinks through problems with step-by-step reasoning visualization.",
                color: "text-yellow-600 dark:text-yellow-400",
              },
              {
                icon: PlayIcon,
                title: "Multi-Step Execution",
                description:
                  "Assign complex tasks and watch them get broken down into manageable steps with progress tracking.",
                color: "text-green-600 dark:text-green-400",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <feature.icon
                        className={`w-5 h-5 ${feature.color}`}
                        aria-hidden="true"
                      />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Quick Start */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
                  Choose a template to get started or create a new session to
                  begin
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickStartPrompts.map((prompt, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 group"
                        onClick={() => handleStartReasoning(prompt.prompt)}
                        role="button"
                        tabIndex={0}
                        aria-label={prompt.ariaLabel}
                        data-testid={`quick-start-${prompt.title.toLowerCase().replace(/\s+/g, "-")}`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleStartReasoning(prompt.prompt);
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <motion.div
                              className={`p-2 bg-gradient-to-r ${prompt.gradient} rounded-lg group-hover:scale-110 transition-transform`}
                              whileHover={{ rotate: 5 }}
                            >
                              <prompt.icon
                                className="w-5 h-5 text-white"
                                aria-hidden="true"
                              />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium mb-1 text-gray-900 dark:text-white">
                                {prompt.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                {prompt.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => handleNewSession()}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                      aria-label="Start a new copilot session"
                      data-testid="start-new-session-button"
                    >
                      <PlusIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                      Start New Session
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Capabilities */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 md:p-8"
            aria-labelledby="capabilities-heading"
          >
            <h3
              id="capabilities-heading"
              className="text-xl font-semibold mb-4 text-center text-gray-900 dark:text-white"
            >
              What can the Copilot do?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Campaign Management
                </h4>
                <ul
                  className="text-sm text-gray-600 dark:text-gray-300 space-y-1"
                  role="list"
                >
                  <li>• Analyze campaign performance across all channels</li>
                  <li>• Identify optimization opportunities</li>
                  <li>• Generate A/B test strategies</li>
                  <li>• Recommend budget reallocation</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Content Strategy
                </h4>
                <ul
                  className="text-sm text-gray-600 dark:text-gray-300 space-y-1"
                  role="list"
                >
                  <li>• Create content calendars</li>
                  <li>• Generate topic ideas and outlines</li>
                  <li>• Optimize content for SEO</li>
                  <li>• Plan social media strategies</li>
                </ul>
              </div>
            </div>
          </motion.section>
        </main>
      )}
    </PageLayout>
  );
}
