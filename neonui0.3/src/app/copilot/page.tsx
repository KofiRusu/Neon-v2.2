"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  CpuChipIcon,
  SparklesIcon,
  LightBulbIcon,
  PlayIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import PageLayout from "../../components/page-layout";
import CopilotLayout from "../../components/copilot/layout";
import { trpc } from "../../utils/trpc";

export default function CopilotPage() {
  const [sessionId, setSessionId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  const startReasoningMutation = trpc.copilot.startReasoning.useMutation();

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

  const handleNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    setSessionId(newSessionId);
    setHasActiveSession(true);
    localStorage.setItem("copilot-session-id", newSessionId);
    localStorage.setItem("copilot-has-active-session", "true");
    setIsInitialized(true);
  };

  const handleStartReasoning = async (prompt: string) => {
    try {
      // Create new session if none exists
      if (!sessionId) {
        handleNewSession();
      } else {
        setHasActiveSession(true);
        localStorage.setItem("copilot-has-active-session", "true");
      }

      // Use mutate instead of mutateAsync for mock compatibility
      startReasoningMutation.mutate({
        prompt,
        sessionId: sessionId || `session-${Date.now()}`,
      });
    } catch (error) {
      console.error("Failed to start reasoning:", error);
      // Fallback: still show interface even if API fails
      if (!sessionId) {
        handleNewSession();
      } else {
        setHasActiveSession(true);
      }
    }
  };

  const quickStartPrompts = [
    {
      title: "Campaign Analysis",
      description: "Analyze campaign performance and optimize top 3 strategies",
      icon: SparklesIcon,
      prompt:
        "Analyze campaign performance and optimize top 3 strategies. Focus on identifying underperforming areas and actionable improvements.",
    },
    {
      title: "Content Strategy",
      description: "Generate content calendar for next month",
      icon: LightBulbIcon,
      prompt:
        "Generate a comprehensive content calendar for next month including blog posts, social media content, and email campaigns.",
    },
    {
      title: "SEO Optimization",
      description: "Audit and improve website SEO performance",
      icon: PlayIcon,
      prompt:
        "Conduct a comprehensive SEO audit and provide actionable recommendations to improve search rankings and organic traffic.",
    },
  ];

  if (!isInitialized) {
    return (
      <PageLayout
        title="NeonHub Copilot"
        subtitle="AI-powered reasoning assistant for marketing automation"
      >
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="NeonHub Copilot"
      subtitle="AI-powered reasoning assistant for marketing automation"
      headerActions={
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Session Active
          </Badge>
          <Button variant="outline" size="sm" onClick={handleNewSession}>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>
      }
    >
      {/* Main Interface */}
      {hasActiveSession && sessionId ? (
        <div className="h-[calc(100vh-12rem)]">
          <CopilotLayout sessionId={sessionId} onSessionChange={setSessionId} />
        </div>
      ) : (
        /* Welcome State */
        <div className="space-y-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <CpuChipIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to NeonHub Copilot
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your intelligent marketing assistant powered by advanced AI
              reasoning. Ask complex questions, assign multi-step tasks, and
              watch the AI work through problems step by step.
            </p>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-blue-600" />
                    Smart Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Analyze campaign performance, identify optimization
                    opportunities, and get actionable recommendations.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LightBulbIcon className="w-5 h-5 text-yellow-600" />
                    Reasoning Transparency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    See exactly how the AI thinks through problems with
                    step-by-step reasoning visualization.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayIcon className="w-5 h-5 text-green-600" />
                    Multi-Step Execution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Assign complex tasks and watch them get broken down into
                    manageable steps with progress tracking.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Start */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <p className="text-gray-600">
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
                    >
                      <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleStartReasoning(prompt.prompt)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <prompt.icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium mb-1">
                                {prompt.title}
                              </h4>
                              <p className="text-sm text-gray-600">
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
                  <Button
                    onClick={() => handleNewSession()}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Start New Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Capabilities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-50 rounded-lg p-8"
          >
            <h3 className="text-xl font-semibold mb-4 text-center">
              What can the Copilot do?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Campaign Management</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Analyze campaign performance across all channels</li>
                  <li>• Identify optimization opportunities</li>
                  <li>• Generate A/B test strategies</li>
                  <li>• Recommend budget reallocation</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Content Strategy</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Create content calendars</li>
                  <li>• Generate topic ideas and outlines</li>
                  <li>• Optimize content for SEO</li>
                  <li>• Plan social media strategies</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </PageLayout>
  );
}
