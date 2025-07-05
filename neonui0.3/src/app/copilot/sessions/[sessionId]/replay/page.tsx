"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  MessageCircle,
  User,
  Bot,
  Clock,
  Zap,
  Settings,
  FastForward,
  Rewind,
  Volume2,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";

interface ReplayState {
  isPlaying: boolean;
  currentStep: number;
  playbackSpeed: number;
  showMetadata: boolean;
}

export default function SessionReplayPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const {
    data: session,
    isLoading,
    error,
  } = trpc.copilot.getSessionDetail.useQuery(
    { sessionId },
    { enabled: !!sessionId },
  );

  const [replayState, setReplayState] = useState<ReplayState>({
    isPlaying: false,
    currentStep: 0,
    playbackSpeed: 1,
    showMetadata: true,
  });

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const replayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [replayState.currentStep]);

  // Replay control logic
  useEffect(() => {
    if (replayState.isPlaying && session?.logs) {
      const interval = 2000 / replayState.playbackSpeed; // Base interval adjusted by speed

      replayIntervalRef.current = setInterval(() => {
        setReplayState((prev) => {
          if (prev.currentStep >= session.logs.length - 1) {
            return { ...prev, isPlaying: false };
          }
          return { ...prev, currentStep: prev.currentStep + 1 };
        });
      }, interval);

      return () => {
        if (replayIntervalRef.current) {
          clearInterval(replayIntervalRef.current);
        }
      };
    }
  }, [replayState.isPlaying, replayState.playbackSpeed, session?.logs]);

  const handlePlayPause = () => {
    setReplayState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleStop = () => {
    setReplayState((prev) => ({ ...prev, isPlaying: false, currentStep: 0 }));
  };

  const handleStepForward = () => {
    if (session?.logs && replayState.currentStep < session.logs.length - 1) {
      setReplayState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    }
  };

  const handleStepBack = () => {
    if (replayState.currentStep > 0) {
      setReplayState((prev) => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  };

  const handleSpeedChange = (speed: number[]) => {
    setReplayState((prev) => ({ ...prev, playbackSpeed: speed[0] }));
  };

  const handleSeek = (step: number[]) => {
    setReplayState((prev) => ({ ...prev, currentStep: step[0] }));
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case "QUERY":
        return "bg-blue-100 text-blue-800";
      case "COMMAND":
        return "bg-purple-100 text-purple-800";
      case "CLARIFICATION":
        return "bg-orange-100 text-orange-800";
      case "CONFIRMATION":
        return "bg-green-100 text-green-800";
      case "FEEDBACK":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-red-600">
                {error?.message || "Session not found"}
              </p>
              <Link href="/copilot/sessions">
                <Button className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sessions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const visibleMessages = session.logs.slice(0, replayState.currentStep + 1);
  const currentMessage = session.logs[replayState.currentStep];
  const progress = ((replayState.currentStep + 1) / session.logs.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/copilot/sessions/${session.sessionId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Session
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Replay:{" "}
                {session.title || `Session ${session.sessionId.slice(-8)}`}
              </h1>
              <p className="text-gray-600">
                Step {replayState.currentStep + 1} of {session.logs.length}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              setReplayState((prev) => ({
                ...prev,
                showMetadata: !prev.showMetadata,
              }))
            }
          >
            <Settings className="h-4 w-4 mr-2" />
            {replayState.showMetadata ? "Hide" : "Show"} Metadata
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Messages Column */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversation Replay
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Progress value={progress} className="flex-1" />
                  <span className="text-sm text-gray-500 font-mono">
                    {Math.round(progress)}%
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  ref={messagesContainerRef}
                  className="h-[500px] overflow-y-auto p-6 space-y-4"
                >
                  <AnimatePresence mode="popLayout">
                    {visibleMessages.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: index === replayState.currentStep ? 0.2 : 0,
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        className={`relative ${
                          index === replayState.currentStep
                            ? "ring-2 ring-blue-400 rounded-lg"
                            : ""
                        }`}
                      >
                        <div
                          className={`flex ${log.role === "USER" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-4 ${
                              log.role === "USER"
                                ? "bg-blue-500 text-white ml-8"
                                : "bg-gray-100 text-gray-900 mr-8"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {log.role === "USER" ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <Bot className="h-4 w-4" />
                              )}
                              <span className="text-sm font-medium">
                                {log.role === "USER" ? "You" : "Assistant"}
                              </span>
                              <Badge
                                className={getMessageTypeColor(log.messageType)}
                              >
                                {log.messageType.toLowerCase()}
                              </Badge>
                              {log.isAutonomous && (
                                <Badge variant="outline" className="text-xs">
                                  Auto
                                </Badge>
                              )}
                              {index === replayState.currentStep && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="ml-auto"
                                >
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Current
                                  </Badge>
                                </motion.div>
                              )}
                            </div>

                            <motion.p
                              className="whitespace-pre-wrap"
                              initial={{ opacity: 0.7 }}
                              animate={{ opacity: 1 }}
                            >
                              {log.content}
                            </motion.p>

                            {log.suggestedActions &&
                              Array.isArray(log.suggestedActions) &&
                              log.suggestedActions.length > 0 && (
                                <motion.div
                                  className="mt-3 pt-3 border-t border-gray-200"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  transition={{ delay: 0.3 }}
                                >
                                  <p className="text-sm font-medium mb-2">
                                    Suggested Actions:
                                  </p>
                                  <div className="space-y-1">
                                    {log.suggestedActions.map(
                                      (action: any, i: number) => (
                                        <motion.div
                                          key={i}
                                          initial={{ x: -10, opacity: 0 }}
                                          animate={{ x: 0, opacity: 1 }}
                                          transition={{ delay: 0.4 + i * 0.1 }}
                                          className="text-sm p-2 bg-gray-50 rounded"
                                        >
                                          {action.label || action}
                                        </motion.div>
                                      ),
                                    )}
                                  </div>
                                </motion.div>
                              )}

                            {replayState.showMetadata && (
                              <motion.div
                                className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 text-xs opacity-75"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.75 }}
                                transition={{ delay: 0.5 }}
                              >
                                <span>
                                  {format(new Date(log.createdAt), "HH:mm:ss")}
                                </span>
                                <div className="flex items-center gap-2">
                                  {log.confidence > 0 && (
                                    <span>
                                      Confidence:{" "}
                                      {(log.confidence * 100).toFixed(0)}%
                                    </span>
                                  )}
                                  {log.processingTime > 0 && (
                                    <span>{log.processingTime}ms</span>
                                  )}
                                  {log.cost > 0 && (
                                    <span>{formatCurrency(log.cost)}</span>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {replayState.isPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-center"
                    >
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                        Playing at {replayState.playbackSpeed}x speed...
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls & Stats Column */}
          <div className="space-y-4">
            {/* Playback Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Playback Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStepBack}
                    disabled={replayState.currentStep === 0}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    onClick={handlePlayPause}
                    className="flex items-center gap-2"
                  >
                    {replayState.isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {replayState.isPlaying ? "Pause" : "Play"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStepForward}
                    disabled={
                      replayState.currentStep >= session.logs.length - 1
                    }
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={handleStop}
                  className="w-full"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop & Reset
                </Button>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Playback Speed</label>
                  <Slider
                    value={[replayState.playbackSpeed]}
                    onValueChange={handleSpeedChange}
                    min={0.25}
                    max={4}
                    step={0.25}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.25x</span>
                    <span>{replayState.playbackSpeed}x</span>
                    <span>4x</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Jump to Step</label>
                  <Slider
                    value={[replayState.currentStep]}
                    onValueChange={handleSeek}
                    min={0}
                    max={session.logs.length - 1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Start</span>
                    <span>Step {replayState.currentStep + 1}</span>
                    <span>End</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Message Stats */}
            {currentMessage && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Step</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <Badge variant="outline">
                      {currentMessage.role === "USER" ? "User" : "Assistant"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type</span>
                    <Badge
                      className={getMessageTypeColor(
                        currentMessage.messageType,
                      )}
                    >
                      {currentMessage.messageType.toLowerCase()}
                    </Badge>
                  </div>
                  {currentMessage.confidence > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Confidence</span>
                      <span className="font-medium">
                        {(currentMessage.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {currentMessage.processingTime > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Processing</span>
                      <span className="font-medium">
                        {currentMessage.processingTime}ms
                      </span>
                    </div>
                  )}
                  {currentMessage.cost > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cost</span>
                      <span className="font-medium">
                        {formatCurrency(currentMessage.cost)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Timestamp</span>
                    <span className="font-medium text-xs">
                      {format(new Date(currentMessage.createdAt), "HH:mm:ss")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Messages</span>
                  <span className="font-medium">{session.logs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Commands</span>
                  <span className="font-medium">
                    {
                      session.logs.filter((log) => log.isCommandExecution)
                        .length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Autonomous</span>
                  <span className="font-medium">
                    {session.logs.filter((log) => log.isAutonomous).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
