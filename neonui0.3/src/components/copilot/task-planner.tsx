"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { trpc } from "../../utils/trpc";

interface TaskStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "error";
  output?: any;
  reasoning?: string;
  timestamp: string;
}

interface TaskPlannerProps {
  sessionId: string;
}

export default function TaskPlanner({ sessionId }: TaskPlannerProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const {
    data: sessionData,
    isLoading,
    refetch,
  } = trpc.copilot.getReasoningSession.useQuery({ sessionId });

  const session = sessionData?.data;
  const steps: TaskStep[] = session?.steps || [];
  const currentStep = session?.currentStep || 0;
  const totalSteps = session?.totalSteps || 0;
  const status = session?.status || "pending";

  // Mock data if no session data
  const mockSteps: TaskStep[] = [
    {
      id: "step-1",
      title: "Initialize Analysis",
      description:
        "Setting up data connections and preparing analysis environment",
      status: "completed",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      output: { connections: 3, dataPoints: 1247 },
    },
    {
      id: "step-2",
      title: "Gather Campaign Data",
      description: "Collecting performance metrics from all active campaigns",
      status: "completed",
      timestamp: new Date(Date.now() - 240000).toISOString(),
      output: { campaigns: 12, metrics: 48 },
    },
    {
      id: "step-3",
      title: "Analyze Performance",
      description:
        "Running statistical analysis and identifying optimization opportunities",
      status: "running",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      reasoning:
        "Analyzing conversion rates, click-through rates, and engagement metrics across all campaigns. Identifying patterns and anomalies.",
    },
    {
      id: "step-4",
      title: "Generate Recommendations",
      description:
        "Creating actionable optimization strategies based on analysis",
      status: "pending",
      timestamp: "",
    },
    {
      id: "step-5",
      title: "Execute Optimizations",
      description: "Implementing approved optimizations and monitoring results",
      status: "pending",
      timestamp: "",
    },
  ];

  const displaySteps = steps.length > 0 ? steps : mockSteps;
  const displayStatus = status !== "pending" ? status : "running";
  const displayCurrentStep = currentStep > 0 ? currentStep : 3;
  const displayTotalSteps = totalSteps > 0 ? totalSteps : 5;

  const toggleStepExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case "running":
        return <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />;
      case "error":
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "running":
        return "border-blue-200 bg-blue-50";
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const progressPercentage = (displayCurrentStep / displayTotalSteps) * 100;

  return (
    <div className="h-full flex flex-col">
      {/* Progress Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Task Execution</h3>
            <p className="text-sm text-gray-500">
              Step {displayCurrentStep} of {displayTotalSteps}
            </p>
          </div>
          <Badge
            variant={displayStatus === "running" ? "default" : "outline"}
            className={
              displayStatus === "running" ? "bg-blue-100 text-blue-800" : ""
            }
          >
            {displayStatus === "running" && (
              <ArrowPathIcon className="w-3 h-3 mr-1 animate-spin" />
            )}
            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Steps List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {displaySteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`border rounded-lg p-4 ${getStatusColor(step.status)}`}
            >
              <div
                className="flex items-start gap-3 cursor-pointer"
                onClick={() => toggleStepExpanded(step.id)}
              >
                {getStatusIcon(step.status)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{step.title}</h4>
                    {step.timestamp && (
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(step.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {step.description}
                  </p>

                  {/* Step Status Indicator */}
                  {step.status === "running" && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-2 h-2 bg-blue-600 rounded-full"
                      />
                      Processing...
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {expandedSteps.has(step.id) ? (
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedSteps.has(step.id) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-gray-200 space-y-3"
                >
                  {step.reasoning && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">
                        Reasoning
                      </h5>
                      <p className="text-xs text-gray-600 bg-white/50 p-2 rounded">
                        {step.reasoning}
                      </p>
                    </div>
                  )}

                  {step.output && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">
                        Output
                      </h5>
                      <div className="text-xs bg-white/50 p-2 rounded">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch && refetch()}
            disabled={isLoading}
            className="flex-1"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {displayStatus === "running" ? (
            <Button variant="outline" size="sm" className="flex-1">
              <PauseIcon className="w-4 h-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button variant="default" size="sm" className="flex-1">
              <PlayIcon className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
