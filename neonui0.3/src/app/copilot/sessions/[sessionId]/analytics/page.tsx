"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, BarChart3, TrendingUp, TrendingDown, Clock, 
  MessageCircle, User, Bot, DollarSign, Zap, Target, 
  Activity, CheckCircle, XCircle, AlertTriangle,
  PieChart, LineChart, Download, Calendar
} from "lucide-react";
import { formatDistance, format } from "date-fns";
import Link from "next/link";
import { trpc } from "@/utils/trpc";
import { useParams } from "next/navigation";

export default function SessionAnalyticsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const { data: session, isLoading, error } = trpc.copilot.getSessionDetail.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const [timeframe, setTimeframe] = useState("session");

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

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ))}
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

  // Calculate analytics metrics
  const totalCost = session.logs.reduce((sum, log) => sum + log.cost, 0);
  const totalTokens = session.logs.reduce((sum, log) => sum + log.tokensUsed, 0);
  const averageConfidence = session.logs.reduce((sum, log) => sum + log.confidence, 0) / session.logs.length;
  const averageResponseTime = session.logs
    .filter(log => log.processingTime > 0)
    .reduce((sum, log) => sum + log.processingTime, 0) / 
    session.logs.filter(log => log.processingTime > 0).length;
  
  const commandLogs = session.logs.filter(log => log.isCommandExecution);
  const autonomousLogs = session.logs.filter(log => log.isAutonomous);
  const successfulLogs = session.logs.filter(log => log.wasSuccessful);
  const failedLogs = session.logs.filter(log => !log.wasSuccessful);

  // Message type distribution
  const messageTypes = session.logs.reduce((acc, log) => {
    acc[log.messageType] = (acc[log.messageType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Hourly distribution
  const hourlyDistribution = session.logs.reduce((acc, log) => {
    const hour = new Date(log.createdAt).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Cost per message type
  const costByType = session.logs.reduce((acc, log) => {
    if (!acc[log.messageType]) {
      acc[log.messageType] = { cost: 0, count: 0 };
    }
    acc[log.messageType].cost += log.cost;
    acc[log.messageType].count += 1;
    return acc;
  }, {} as Record<string, { cost: number; count: number }>);

  // Performance trends (confidence over time)
  const confidenceTrend = session.logs.map((log, index) => ({
    step: index + 1,
    confidence: log.confidence * 100,
    responseTime: log.processingTime,
  }));

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
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  Analytics: {session.title || `Session ${session.sessionId.slice(-8)}`}
                </h1>
                <Badge className={getStatusColor(session.status)}>
                  {session.status.toLowerCase()}
                </Badge>
              </div>
              <p className="text-gray-600">
                Detailed performance metrics and insights
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="session">Full Session</SelectItem>
                <SelectItem value="recent">Recent Activity</SelectItem>
                <SelectItem value="commands">Commands Only</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{session.totalMessages}</div>
              <div className="flex items-center mt-2 text-sm">
                <User className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-gray-600">{session.userMessages} user</span>
                <Bot className="h-4 w-4 text-purple-500 ml-3 mr-1" />
                <span className="text-gray-600">{session.agentMessages} agent</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {((successfulLogs.length / session.logs.length) * 100).toFixed(1)}%
              </div>
              <div className="flex items-center mt-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-gray-600">{successfulLogs.length} successful</span>
                {failedLogs.length > 0 && (
                  <>
                    <XCircle className="h-4 w-4 text-red-500 ml-3 mr-1" />
                    <span className="text-gray-600">{failedLogs.length} failed</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg. Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {(averageConfidence * 100).toFixed(1)}%
              </div>
              <div className="flex items-center mt-2 text-sm">
                <Target className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-gray-600">
                  Range: {Math.min(...session.logs.map(l => l.confidence * 100)).toFixed(0)}% - {Math.max(...session.logs.map(l => l.confidence * 100)).toFixed(0)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(totalCost)}
              </div>
              <div className="flex items-center mt-2 text-sm">
                <Zap className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-gray-600">{totalTokens.toLocaleString()} tokens</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Average Response Time</span>
                <span className="text-lg font-bold text-gray-900">
                  {averageResponseTime ? `${Math.round(averageResponseTime)}ms` : "—"}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Commands Executed</span>
                <span className="text-lg font-bold text-purple-600">{commandLogs.length}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Autonomous Actions</span>
                <span className="text-lg font-bold text-blue-600">{autonomousLogs.length}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Session Duration</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatDuration(session.duration)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Message Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Message Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(messageTypes).map(([type, count]) => {
                  const percentage = (count / session.logs.length) * 100;
                  const color = {
                    QUERY: "bg-blue-500",
                    COMMAND: "bg-purple-500",
                    CLARIFICATION: "bg-orange-500",
                    CONFIRMATION: "bg-green-500",
                    FEEDBACK: "bg-gray-500",
                  }[type] || "bg-gray-500";
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{type.toLowerCase()}</span>
                        <span>{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cost Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 font-medium">Cost per Message</div>
                    <div className="text-lg font-bold text-blue-900">
                      {formatCurrency(totalCost / session.totalMessages)}
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-purple-600 font-medium">Cost per Token</div>
                    <div className="text-lg font-bold text-purple-900">
                      {formatCurrency(totalCost / totalTokens)}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Cost by Message Type</h4>
                  {Object.entries(costByType).map(([type, data]) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{type.toLowerCase()}</span>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(data.cost)}</div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(data.cost / data.count)} avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-6 gap-2 text-xs text-gray-500">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="text-center">
                      {i.toString().padStart(2, '0')}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const count = hourlyDistribution[hour] || 0;
                    const maxCount = Math.max(...Object.values(hourlyDistribution));
                    const intensity = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
                    return (
                      <div
                        key={hour}
                        className="h-8 rounded bg-blue-100 flex items-center justify-center text-xs"
                        style={{
                          backgroundColor: intensity > 0 
                            ? `rgba(59, 130, 246, ${0.2 + (intensity / 100) * 0.8})` 
                            : '#f3f4f6'
                        }}
                        title={`${hour}:00 - ${count} messages`}
                      >
                        {count > 0 && count}
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-xs text-gray-500 text-center">
                  Messages by hour of day
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance Insight */}
              <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Performance</h4>
                </div>
                <p className="text-sm text-green-700">
                  Average confidence of {(averageConfidence * 100).toFixed(1)}% is {averageConfidence > 0.8 ? 'excellent' : averageConfidence > 0.6 ? 'good' : 'needs improvement'}. 
                  {averageConfidence > 0.8 && " The AI assistant is performing very well."}
                </p>
              </div>

              {/* Cost Efficiency */}
              <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800">Cost Efficiency</h4>
                </div>
                <p className="text-sm text-blue-700">
                  Cost per message: {formatCurrency(totalCost / session.totalMessages)}. 
                  {totalCost / session.totalMessages < 0.01 ? " Very cost effective." : " Monitor for optimization opportunities."}
                </p>
              </div>

              {/* Usage Patterns */}
              <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-purple-800">Usage Patterns</h4>
                </div>
                <p className="text-sm text-purple-700">
                  {commandLogs.length > 0 
                    ? `${commandLogs.length} commands executed, showing active task completion.`
                    : "No commands executed - mostly conversational interaction."
                  }
                  {autonomousLogs.length > 0 && ` ${autonomousLogs.length} autonomous actions taken.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 