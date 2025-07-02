"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Clock,
  MessageCircle,
  User,
  Bot,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Activity,
  DollarSign,
  Zap,
  BarChart3,
  Play,
  FileText,
  Download,
} from "lucide-react";
import { formatDistance, format } from "date-fns";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";

export default function SessionDetailPage() {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 border-green-200";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ABANDONED":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ERROR":
        return "bg-red-100 text-red-800 border-red-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
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
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
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
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
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

  const totalCost = session.logs.reduce((sum, log) => sum + log.cost, 0);
  const totalTokens = session.logs.reduce(
    (sum, log) => sum + log.tokensUsed,
    0,
  );
  const averageConfidence =
    session.logs.reduce((sum, log) => sum + log.confidence, 0) /
    session.logs.length;
  const commandLogs = session.logs.filter((log) => log.isCommandExecution);
  const autonomousLogs = session.logs.filter((log) => log.isAutonomous);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/copilot/sessions">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Sessions
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {session.title || `Session ${session.sessionId.slice(-8)}`}
                </h1>
                <Badge className={getStatusColor(session.status)}>
                  {session.status.toLowerCase()}
                </Badge>
              </div>
              <p className="text-gray-600">
                Started {format(new Date(session.startedAt), "PPpp")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/copilot/sessions/${session.sessionId}/analytics`}>
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href={`/copilot/sessions/${session.sessionId}/replay`}>
              <Button variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Replay
              </Button>
            </Link>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages Column */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Conversation ({session.logs.length} messages)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto p-6 space-y-4">
                  {session.logs.map((log, index) => (
                    <div key={log.id} className="space-y-2">
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
                          </div>

                          <p className="whitespace-pre-wrap">{log.content}</p>

                          {log.suggestedActions &&
                            Array.isArray(log.suggestedActions) &&
                            log.suggestedActions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm font-medium mb-2">
                                  Suggested Actions:
                                </p>
                                <div className="space-y-1">
                                  {log.suggestedActions.map(
                                    (action: any, i: number) => (
                                      <div
                                        key={i}
                                        className="text-sm p-2 bg-gray-50 rounded"
                                      >
                                        {action.label || action}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 text-xs opacity-75">
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
                              {log.isCommandExecution && (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Column */}
          <div className="space-y-4">
            {/* Session Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="font-medium">
                    {formatDuration(session.duration)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Messages</span>
                  <span className="font-medium">{session.totalMessages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User Messages</span>
                  <span className="font-medium">{session.userMessages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Agent Messages</span>
                  <span className="font-medium">{session.agentMessages}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Activity</span>
                  <span className="font-medium">
                    {formatDistance(
                      new Date(session.lastActivity),
                      new Date(),
                      { addSuffix: true },
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg. Confidence</span>
                  <span className="font-medium text-green-600">
                    {(averageConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Commands</span>
                  <span className="font-medium">{commandLogs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Autonomous</span>
                  <span className="font-medium">{autonomousLogs.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-medium text-green-600">
                    {(
                      (session.logs.filter((log) => log.wasSuccessful).length /
                        session.logs.length) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Cost Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Cost</span>
                  <span className="font-medium">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Tokens</span>
                  <span className="font-medium">
                    {totalTokens.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Cost per Message
                  </span>
                  <span className="font-medium">
                    {formatCurrency(totalCost / session.totalMessages)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Tokens per Message
                  </span>
                  <span className="font-medium">
                    {Math.round(totalTokens / session.totalMessages)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* User Info */}
            {session.user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    User Info
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Name</span>
                      <span className="font-medium">
                        {session.user.name || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="font-medium text-xs">
                        {session.user.email}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
