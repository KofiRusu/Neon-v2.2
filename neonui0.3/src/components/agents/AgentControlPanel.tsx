"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Play,
  Pause,
  Square,
  Terminal,
  RefreshCw,
  Zap,
  Activity,
  AlertCircle,
  Clock,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  Eye,
  Bug,
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Cpu,
  MemoryStick,
  Timer,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription } from "../ui/alert";
import { ScrollArea } from "../ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { useToast } from "../ui/use-toast";
import { trpc } from "../../utils/trpc";
import {
  Agent,
  LogEntry,
  AgentStatus,
  AgentCommand,
  AgentControlPanelProps,
  AgentCardProps,
  AgentMetrics,
  StatusConfig,
  LogConfig,
  TabFilter,
  MockAgentData,
} from "./types";

// Mock real-time agent data
const mockAgents: MockAgentData = [
  {
    id: "content-agent-001",
    name: "Content Generator",
    type: "Content Creation",
    status: "running",
    lastRun: "2024-01-01T12:30:00Z",
    tasksCompleted: 1247,
    tasksActive: 3,
    successRate: 94.2,
    performance: 94,
    cpuUsage: 67,
    memoryUsage: 45,
    uptime: "99.8%",
    version: "v2.1.0",
    description: "AI-powered content creation and optimization",
    capabilities: ["Blog Writing", "SEO Content", "Social Posts", "Email Copy"],
    icon: "📝",
    schedule: {
      pattern: "Every 2 hours",
      nextRun: "2024-01-01T14:00:00Z",
      interval: "PT2H",
    },
    logs: [
      {
        id: "log-001",
        timestamp: "2024-01-01T12:30:00Z",
        level: "success",
        message: "Generated 3 blog posts with 95% quality score",
        details: { posts: 3, topics: ["AI", "Marketing", "Tech"] },
      },
      {
        id: "log-002",
        timestamp: "2024-01-01T12:25:00Z",
        level: "info",
        message: "Starting content generation task",
      },
      {
        id: "log-003",
        timestamp: "2024-01-01T12:20:00Z",
        level: "warning",
        message: "Memory usage approaching 70% threshold",
      },
    ],
  },
  {
    id: "seo-agent-002",
    name: "SEO Optimizer",
    type: "Search Optimization",
    status: "active",
    lastRun: "2024-01-01T12:00:00Z",
    tasksCompleted: 892,
    tasksActive: 1,
    successRate: 87.5,
    performance: 87,
    cpuUsage: 45,
    memoryUsage: 78,
    uptime: "99.2%",
    version: "v1.8.3",
    description: "Advanced search engine optimization",
    capabilities: ["Keyword Research", "Meta Optimization", "Content Analysis"],
    icon: "🔍",
    schedule: {
      pattern: "Daily at 6 AM",
      nextRun: "2024-01-02T06:00:00Z",
      interval: "P1D",
    },
    logs: [
      {
        id: "log-004",
        timestamp: "2024-01-01T12:00:00Z",
        level: "success",
        message: "Optimized 15 pages for target keywords",
      },
      {
        id: "log-005",
        timestamp: "2024-01-01T11:55:00Z",
        level: "info",
        message: "Starting SEO analysis",
      },
    ],
  },
  {
    id: "social-agent-003",
    name: "Social Media Bot",
    type: "Social Management",
    status: "error",
    lastRun: "2024-01-01T10:00:00Z",
    tasksCompleted: 456,
    tasksActive: 0,
    successRate: 78.3,
    performance: 78,
    cpuUsage: 0,
    memoryUsage: 5,
    uptime: "95.1%",
    version: "v2.0.1",
    description: "Social media automation and engagement",
    capabilities: ["Post Scheduling", "Engagement", "Analytics"],
    icon: "📱",
    logs: [
      {
        id: "log-006",
        timestamp: "2024-01-01T10:00:00Z",
        level: "error",
        message: "Failed to connect to Twitter API - Rate limit exceeded",
        details: { error: "Rate limit", retryAfter: 900 },
      },
    ],
  },
  {
    id: "analytics-agent-004",
    name: "Analytics Agent",
    type: "Data Analysis",
    status: "scheduled",
    lastRun: "2024-01-01T11:00:00Z",
    nextScheduled: "2024-01-01T15:00:00Z",
    tasksCompleted: 2134,
    tasksActive: 0,
    successRate: 96.1,
    performance: 96,
    cpuUsage: 0,
    memoryUsage: 12,
    uptime: "99.9%",
    version: "v3.0.0",
    description: "Real-time analytics and insights",
    capabilities: ["Data Analysis", "Report Generation", "Forecasting"],
    icon: "📊",
    schedule: {
      pattern: "Every 4 hours",
      nextRun: "2024-01-01T15:00:00Z",
      interval: "PT4H",
    },
    logs: [
      {
        id: "log-007",
        timestamp: "2024-01-01T11:00:00Z",
        level: "success",
        message: "Generated quarterly performance report",
      },
    ],
  },
  {
    id: "email-agent-005",
    name: "Email Marketing Agent",
    type: "Email Automation",
    status: "idle",
    lastRun: "2024-01-01T09:00:00Z",
    tasksCompleted: 1876,
    tasksActive: 0,
    successRate: 91.3,
    performance: 91,
    cpuUsage: 8,
    memoryUsage: 15,
    uptime: "99.5%",
    version: "v2.3.1",
    description: "Email campaign automation",
    capabilities: ["Campaign Creation", "Automation", "Segmentation"],
    icon: "📧",
    logs: [
      {
        id: "log-008",
        timestamp: "2024-01-01T09:00:00Z",
        level: "success",
        message: "Sent 2,500 personalized emails with 24% open rate",
      },
    ],
  },
];

// Agent Status Configuration
const statusConfig: Record<AgentStatus, StatusConfig> = {
  active: {
    color: "text-green-400",
    bg: "bg-green-400/20",
    border: "border-green-400/30",
    icon: Activity,
    pulse: "animate-pulse",
  },
  running: {
    color: "text-blue-400",
    bg: "bg-blue-400/20",
    border: "border-blue-400/30",
    icon: Zap,
    pulse: "animate-pulse",
  },
  idle: {
    color: "text-gray-400",
    bg: "bg-gray-400/20",
    border: "border-gray-400/30",
    icon: Clock,
    pulse: "",
  },
  error: {
    color: "text-red-400",
    bg: "bg-red-400/20",
    border: "border-red-400/30",
    icon: AlertCircle,
    pulse: "animate-pulse",
  },
  scheduled: {
    color: "text-purple-400",
    bg: "bg-purple-400/20",
    border: "border-purple-400/30",
    icon: Calendar,
    pulse: "",
  },
  stopped: {
    color: "text-gray-600",
    bg: "bg-gray-600/20",
    border: "border-gray-600/30",
    icon: Square,
    pulse: "",
  },
};

// Log Level Configuration
const logConfig: Record<LogEntry["level"], LogConfig> = {
  info: { color: "text-blue-400", icon: Info, bg: "bg-blue-400/10" },
  success: {
    color: "text-green-400",
    icon: CheckCircle,
    bg: "bg-green-400/10",
  },
  warning: {
    color: "text-yellow-400",
    icon: AlertTriangle,
    bg: "bg-yellow-400/10",
  },
  error: { color: "text-red-400", icon: XCircle, bg: "bg-red-400/10" },
};

function AgentCard({ agent, onCommand }: AgentCardProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const config = statusConfig[agent.status];
  const StatusIcon = config.icon;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glassmorphism-effect p-6 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300"
    >
      {/* Agent Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-2xl">
              {agent.icon}
            </div>
            <div
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${config.bg} ${config.border} border ${config.pulse}`}
            >
              <StatusIcon className="w-2.5 h-2.5 m-0.5" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{agent.name}</h3>
            <p className="text-sm text-gray-400">{agent.type}</p>
            <p className="text-xs text-gray-500">{agent.version}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className={`${config.color} ${config.bg} ${config.border} border`}
          >
            {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <p className="text-lg font-bold text-green-400">
            {agent.tasksCompleted}
          </p>
          <p className="text-xs text-gray-400">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-blue-400">{agent.tasksActive}</p>
          <p className="text-xs text-gray-400">Active</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-purple-400">
            {agent.successRate}%
          </p>
          <p className="text-xs text-gray-400">Success</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-yellow-400">{agent.uptime}</p>
          <p className="text-xs text-gray-400">Uptime</p>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400 flex items-center">
              <Cpu className="w-3 h-3 mr-1" />
              CPU
            </span>
            <span className="text-blue-400">{agent.cpuUsage}%</span>
          </div>
          <Progress value={agent.cpuUsage} className="h-1" />
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400 flex items-center">
              <MemoryStick className="w-3 h-3 mr-1" />
              Memory
            </span>
            <span className="text-purple-400">{agent.memoryUsage}%</span>
          </div>
          <Progress value={agent.memoryUsage} className="h-1" />
        </div>
      </div>

      {/* Schedule Info */}
      {agent.schedule && (
        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 flex items-center">
              <Timer className="w-3 h-3 mr-1" />
              Schedule
            </span>
            <span className="text-green-400">{agent.schedule.pattern}</span>
          </div>
          {agent.schedule.nextRun && (
            <p className="text-xs text-gray-400 mt-1">
              Next run: {formatTimestamp(agent.schedule.nextRun)}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          {agent.status !== "running" && (
            <Button
              size="sm"
              variant="outline"
              className="bg-green-400/10 border-green-400/30 text-green-400 hover:bg-green-400/20"
              onClick={() => setShowConfirm("start")}
            >
              <Play className="w-3 h-3 mr-1" />
              Start
            </Button>
          )}
          {(agent.status === "running" || agent.status === "active") && (
            <Button
              size="sm"
              variant="outline"
              className="bg-red-400/10 border-red-400/30 text-red-400 hover:bg-red-400/20"
              onClick={() => setShowConfirm("stop")}
            >
              <Square className="w-3 h-3 mr-1" />
              Stop
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="bg-blue-400/10 border-blue-400/30 text-blue-400 hover:bg-blue-400/20"
            onClick={() => onCommand(agent.id, "debug")}
          >
            <Bug className="w-3 h-3 mr-1" />
            Debug
          </Button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowLogs(!showLogs)}
          className="text-gray-400 hover:text-white"
        >
          <Terminal className="w-3 h-3 mr-1" />
          Logs
          {showLogs ? (
            <ChevronUp className="w-3 h-3 ml-1" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-1" />
          )}
        </Button>
      </div>

      {/* Logs Section */}
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 pt-4"
          >
            <ScrollArea className="h-32">
              <div className="space-y-2">
                {agent.logs.map((log) => {
                  const logConf = logConfig[log.level];
                  const LogIcon = logConf.icon;

                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-2 rounded text-xs ${logConf.bg} border border-white/10`}
                    >
                      <div className="flex items-start space-x-2">
                        <LogIcon
                          className={`w-3 h-3 mt-0.5 ${logConf.color}`}
                        />
                        <div className="flex-1">
                          <p className="text-white">{log.message}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {formatTimestamp(log.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <Dialog open={!!showConfirm} onOpenChange={() => setShowConfirm(null)}>
        <DialogContent className="glassmorphism-effect border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              Confirm Action:{" "}
              {showConfirm?.charAt(0).toUpperCase() + showConfirm?.slice(1)}{" "}
              Agent
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to {showConfirm} the {agent.name}?
              {showConfirm === "stop" &&
                " This will interrupt any running tasks."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(null)}
              className="border-white/20 text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (showConfirm) {
                  onCommand(
                    agent.id,
                    showConfirm as "start" | "stop" | "debug",
                  );
                  setShowConfirm(null);
                }
              }}
              className={
                showConfirm === "stop"
                  ? "bg-red-400/20 border-red-400 text-red-400 hover:bg-red-400/30"
                  : "bg-green-400/20 border-green-400 text-green-400 hover:bg-green-400/30"
              }
            >
              {showConfirm?.charAt(0).toUpperCase() + showConfirm?.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

interface AgentControlPanelProps {
  className?: string;
  showHeader?: boolean;
  showMetrics?: boolean;
  compact?: boolean;
}

export default function AgentControlPanel({
  className = "",
  showHeader = true,
  showMetrics = true,
  compact = false,
}: AgentControlPanelProps) {
  const [agents, setAgents] = useState<MockAgentData>(mockAgents);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const { toast } = useToast();

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => ({
          ...agent,
          cpuUsage: Math.max(
            0,
            Math.min(100, agent.cpuUsage + (Math.random() - 0.5) * 10),
          ),
          memoryUsage: Math.max(
            0,
            Math.min(100, agent.memoryUsage + (Math.random() - 0.5) * 5),
          ),
          tasksCompleted:
            agent.status === "running"
              ? agent.tasksCompleted + Math.floor(Math.random() * 2)
              : agent.tasksCompleted,
        })),
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter agents by tab
  const filteredAgents = agents.filter((agent) => {
    switch (activeTab) {
      case "running":
        return agent.status === "running" || agent.status === "active";
      case "failed":
        return agent.status === "error";
      case "scheduled":
        return agent.status === "scheduled";
      default:
        return true;
    }
  });

  // Agent command handler
  const handleAgentCommand = async (agentId: string, command: AgentCommand) => {
    try {
      if (command === "start") {
        // Use tRPC mutation
        // await runAgent.mutateAsync({ agentId });
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === agentId
              ? {
                  ...agent,
                  status: "running" as const,
                  tasksActive: agent.tasksActive + 1,
                }
              : agent,
          ),
        );
        toast({
          title: "Agent Started",
          description: `${agents.find((a) => a.id === agentId)?.name} has been started successfully.`,
        });
      } else if (command === "stop") {
        // await stopAgent.mutateAsync({ agentId });
        setAgents((prev) =>
          prev.map((agent) =>
            agent.id === agentId
              ? { ...agent, status: "stopped" as const, tasksActive: 0 }
              : agent,
          ),
        );
        toast({
          title: "Agent Stopped",
          description: `${agents.find((a) => a.id === agentId)?.name} has been stopped.`,
        });
      } else if (command === "debug") {
        toast({
          title: "Debug Mode",
          description: `Debugging ${agents.find((a) => a.id === agentId)?.name}...`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${command} agent. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Calculate metrics
  const metrics = {
    total: agents.length,
    active: agents.filter(
      (a) => a.status === "active" || a.status === "running",
    ).length,
    failed: agents.filter((a) => a.status === "error").length,
    scheduled: agents.filter((a) => a.status === "scheduled").length,
    avgPerformance: Math.round(
      agents.reduce((sum, a) => sum + a.performance, 0) / agents.length,
    ),
    totalTasks: agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
    avgSuccessRate: Math.round(
      agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length,
    ),
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Agent Control Center
            </h1>
            <p className="text-gray-400">
              Real-time monitoring and command interface for all AI agents
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              className="border-white/20 text-gray-400 hover:text-white"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-gray-400 hover:text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>
        </div>
      )}

      {/* Metrics Overview */}
      {showMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="glassmorphism-effect border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Agents</p>
                  <p className="text-2xl font-bold text-white">
                    {metrics.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism-effect border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Active</p>
                  <p className="text-2xl font-bold text-green-400">
                    {metrics.active}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism-effect border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-red-400">
                    {metrics.failed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism-effect border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Scheduled</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {metrics.scheduled}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism-effect border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Avg Performance</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {metrics.avgPerformance}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism-effect border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {metrics.totalTasks.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glassmorphism-effect border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Success Rate</p>
                  <p className="text-2xl font-bold text-green-400">
                    {metrics.avgSuccessRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Tabs and Grid */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glassmorphism-effect border border-white/10">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/10">
            All Agents ({agents.length})
          </TabsTrigger>
          <TabsTrigger
            value="running"
            className="data-[state=active]:bg-white/10"
          >
            Running ({metrics.active})
          </TabsTrigger>
          <TabsTrigger
            value="failed"
            className="data-[state=active]:bg-white/10"
          >
            Failed ({metrics.failed})
          </TabsTrigger>
          <TabsTrigger
            value="scheduled"
            className="data-[state=active]:bg-white/10"
          >
            Scheduled ({metrics.scheduled})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`grid gap-6 ${
              compact
                ? "grid-cols-1 lg:grid-cols-2"
                : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            }`}
          >
            {filteredAgents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AgentCard agent={agent} onCommand={handleAgentCommand} />
              </motion.div>
            ))}
          </motion.div>

          {filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No agents found
              </h3>
              <p className="text-gray-500">
                No agents match the current filter criteria.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
