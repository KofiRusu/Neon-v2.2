"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Play,
  Pause,
  Square,
  Terminal,
  Send,
  Download,
  RefreshCw,
  Zap,
  Activity,
  AlertCircle,
  Clock,
  X,
  Maximize2,
  Minimize2,
  Settings,
  Cpu,
  BarChart3,
} from "lucide-react";

// Mock data for V0 - no external dependencies
const mockAgents = [
  {
    id: "content-agent-001",
    name: "Content Generator",
    type: "Content Creation",
    status: "active" as const,
    performance: 94,
    tasksCompleted: 1247,
    tasksActive: 3,
    lastActive: "2 min ago",
    description: "AI-powered content creation and optimization",
    capabilities: ["Blog Writing", "SEO Content", "Social Posts", "Email Copy"],
    icon: "📝",
    cpuUsage: 67,
    memoryUsage: 45,
    uptime: "99.8%",
    version: "v2.1.0",
  },
  {
    id: "seo-agent-002",
    name: "SEO Optimizer",
    type: "Search Optimization",
    status: "active" as const,
    performance: 87,
    tasksCompleted: 892,
    tasksActive: 2,
    lastActive: "5 min ago",
    description: "Advanced search engine optimization",
    capabilities: ["Keyword Research", "Meta Optimization", "Content Analysis"],
    icon: "🔍",
    cpuUsage: 45,
    memoryUsage: 78,
    uptime: "99.2%",
    version: "v1.8.3",
  },
  {
    id: "brand-voice-003",
    name: "Brand Voice Agent",
    type: "Brand Compliance",
    status: "idle" as const,
    performance: 92,
    tasksCompleted: 634,
    tasksActive: 0,
    lastActive: "1 hour ago",
    description: "Maintains brand voice consistency",
    capabilities: ["Voice Analysis", "Tone Adjustment", "Brand Guidelines"],
    icon: "🎯",
    cpuUsage: 12,
    memoryUsage: 23,
    uptime: "98.7%",
    version: "v1.5.2",
  },
  {
    id: "social-agent-004",
    name: "Social Media Bot",
    type: "Social Management",
    status: "error" as const,
    performance: 78,
    tasksCompleted: 456,
    tasksActive: 0,
    lastActive: "2 hours ago",
    description: "Social media automation and engagement",
    capabilities: ["Post Scheduling", "Engagement", "Analytics"],
    icon: "📱",
    cpuUsage: 0,
    memoryUsage: 5,
    uptime: "95.1%",
    version: "v2.0.1",
  },
  {
    id: "analytics-agent-005",
    name: "Analytics Agent",
    type: "Data Analysis",
    status: "active" as const,
    performance: 96,
    tasksCompleted: 2134,
    tasksActive: 5,
    lastActive: "30 seconds ago",
    description: "Real-time analytics and insights",
    capabilities: ["Data Analysis", "Report Generation", "Forecasting"],
    icon: "📊",
    cpuUsage: 89,
    memoryUsage: 67,
    uptime: "99.9%",
    version: "v3.0.0",
  },
];

const mockLogs = [
  {
    id: "log-001",
    timestamp: new Date(Date.now() - 30000).toISOString(),
    level: "info" as const,
    message: "Agent initialized successfully",
    agentId: "content-agent-001",
  },
  {
    id: "log-002",
    timestamp: new Date(Date.now() - 25000).toISOString(),
    level: "info" as const,
    message: "Starting content generation task for blog post",
    agentId: "content-agent-001",
  },
  {
    id: "log-003",
    timestamp: new Date(Date.now() - 20000).toISOString(),
    level: "success" as const,
    message: "Generated 1,200 word blog post with 95% quality score",
    agentId: "content-agent-001",
  },
  {
    id: "log-004",
    timestamp: new Date(Date.now() - 15000).toISOString(),
    level: "warning" as const,
    message: "Memory usage approaching 70% threshold",
    agentId: "content-agent-001",
  },
  {
    id: "log-005",
    timestamp: new Date(Date.now() - 5000).toISOString(),
    level: "success" as const,
    message: "Task completed successfully - content ready for review",
    agentId: "content-agent-001",
  },
];

interface AgentCardProps {
  agent: (typeof mockAgents)[0];
  isSelected: boolean;
  onClick: () => void;
}

function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  const statusConfig = {
    active: {
      color: "text-green-400",
      bg: "bg-green-400/20",
      border: "border-green-400/30",
      icon: Activity,
    },
    idle: {
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
      icon: Clock,
    },
    error: {
      color: "text-red-400",
      bg: "bg-red-400/20",
      border: "border-red-400/30",
      icon: AlertCircle,
    },
  };

  const config = statusConfig[agent.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg cursor-pointer transition-all duration-300 border ${
        isSelected
          ? "border-blue-400/50 shadow-blue-400/20"
          : "border-gray-700/50 hover:border-blue-400/30"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-2xl">
              {agent.icon}
            </div>
            <div
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${config.bg} ${config.border} border`}
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

        <span
          className={`px-3 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.color}`}
        >
          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
        </span>
      </div>

      <p className="text-sm text-gray-300 mb-4">{agent.description}</p>

      {/* Performance Ring */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="2"
              />
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="2"
                strokeDasharray={`${agent.performance}, 100`}
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${agent.performance}, 100` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-400">
                {agent.performance}%
              </span>
            </div>
          </div>
          <div className="text-sm">
            <p className="text-gray-400">Performance</p>
            <p className="text-white font-semibold">{agent.uptime} uptime</p>
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">CPU</span>
          <span className="text-blue-400">{agent.cpuUsage}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.cpuUsage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-blue-400 to-purple-500 h-1 rounded-full"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Memory</span>
          <span className="text-purple-400">{agent.memoryUsage}%</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.memoryUsage}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="bg-gradient-to-r from-purple-400 to-pink-400 h-1 rounded-full"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
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
      </div>

      {/* Capabilities */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">Capabilities</p>
        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <span
              key={capability}
              className="px-2 py-1 text-xs bg-blue-400/10 text-blue-300 rounded border border-blue-400/20"
            >
              {capability}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-500/10 text-gray-400 rounded border border-gray-500/20">
              +{agent.capabilities.length - 3} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface AgentTerminalProps {
  agent: (typeof mockAgents)[0] | null;
  logs: typeof mockLogs;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
}

function AgentTerminal({
  agent,
  logs,
  isExpanded,
  onToggleExpand,
  onClose,
}: AgentTerminalProps) {
  const [command, setCommand] = useState("");
  const [parameters, setParameters] = useState({
    audience: "",
    tone: "professional",
    topic: "",
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const handleExecute = async () => {
    if (!agent || !command.trim()) return;
    setIsExecuting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsExecuting(false);
    setCommand("");
  };

  const levelConfig = {
    info: { color: "text-blue-400", icon: "ℹ" },
    success: { color: "text-green-400", icon: "✓" },
    warning: { color: "text-yellow-400", icon: "⚠" },
    error: { color: "text-red-400", icon: "✗" },
  };

  if (!agent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`bg-gray-900/50 backdrop-blur-lg rounded-lg overflow-hidden border border-gray-700/50 ${
        isExpanded ? "fixed inset-4 z-50" : "h-[600px]"
      }`}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-black/20">
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-green-400" />
          <div>
            <h3 className="font-semibold text-white">{agent.name} Terminal</h3>
            <p className="text-xs text-gray-400">Agent ID: {agent.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleExpand}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col h-full">
        {/* Agent Controls */}
        <div className="p-4 border-b border-gray-700/50 bg-black/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Audience
              </label>
              <input
                type="text"
                value={parameters.audience}
                onChange={(e) =>
                  setParameters((prev) => ({
                    ...prev,
                    audience: e.target.value,
                  }))
                }
                placeholder="Target audience..."
                className="w-full border border-gray-600 rounded px-3 py-2 text-sm text-white bg-gray-800/50 focus:border-blue-400/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Tone
              </label>
              <select
                value={parameters.tone}
                onChange={(e) =>
                  setParameters((prev) => ({ ...prev, tone: e.target.value }))
                }
                className="w-full border border-gray-600 rounded px-3 py-2 text-sm text-white bg-gray-800/50 focus:border-blue-400/50 focus:outline-none"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="authoritative">Authoritative</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Topic
              </label>
              <input
                type="text"
                value={parameters.topic}
                onChange={(e) =>
                  setParameters((prev) => ({ ...prev, topic: e.target.value }))
                }
                placeholder="Content topic..."
                className="w-full border border-gray-600 rounded px-3 py-2 text-sm text-white bg-gray-800/50 focus:border-blue-400/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Terminal Output */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-black/20 space-y-2"
        >
          {logs
            .filter((log) => log.agentId === agent.id)
            .map((log) => {
              const config = levelConfig[log.level];
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start space-x-3"
                >
                  <span className="text-gray-500 text-xs mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`${config.color} text-xs mt-0.5`}>
                    {config.icon}
                  </span>
                  <span className="text-gray-300 flex-1">{log.message}</span>
                </motion.div>
              );
            })}
        </div>

        {/* Command Input */}
        <div className="p-4 border-t border-gray-700/50 bg-black/10">
          <div className="flex items-center space-x-2">
            <span className="text-green-400 font-mono">$</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleExecute()}
              placeholder="Enter command..."
              className="flex-1 bg-transparent border-none outline-none text-white font-mono"
              disabled={isExecuting}
            />
            <button
              onClick={handleExecute}
              disabled={isExecuting || !command.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isExecuting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isExecuting ? "Executing..." : "Run"}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<
    (typeof mockAgents)[0] | null
  >(null);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "idle" | "error">(
    "all",
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredAgents = mockAgents.filter(
    (agent) => filter === "all" || agent.status === filter,
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const getStatusCounts = () => {
    return {
      total: mockAgents.length,
      active: mockAgents.filter((a) => a.status === "active").length,
      idle: mockAgents.filter((a) => a.status === "idle").length,
      error: mockAgents.filter((a) => a.status === "error").length,
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                AI Agent Management
              </h1>
              <p className="text-sm text-gray-400">
                Monitor and control your AI workforce
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-400">
                  {statusCounts.active} active
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="text-sm">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-lg p-4 rounded-lg border border-gray-700/50">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {statusCounts.total}
                </p>
                <p className="text-sm text-gray-400">Total Agents</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-lg p-4 rounded-lg border border-gray-700/50">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">
                  {statusCounts.active}
                </p>
                <p className="text-sm text-gray-400">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-lg p-4 rounded-lg border border-gray-700/50">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-yellow-400">
                  {statusCounts.idle}
                </p>
                <p className="text-sm text-gray-400">Idle</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-lg p-4 rounded-lg border border-gray-700/50">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-400">
                  {statusCounts.error}
                </p>
                <p className="text-sm text-gray-400">Errors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-4 mb-6">
          {["all", "active", "idle", "error"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== "all" && (
                <span className="ml-2 text-xs bg-gray-600 px-1.5 py-0.5 rounded">
                  {status === "active" && statusCounts.active}
                  {status === "idle" && statusCounts.idle}
                  {status === "error" && statusCounts.error}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Agents Grid */}
          <div
            className={`${selectedAgent ? "xl:col-span-2" : "xl:col-span-3"}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AgentCard
                    agent={agent}
                    isSelected={selectedAgent?.id === agent.id}
                    onClick={() => setSelectedAgent(agent)}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Agent Terminal */}
          <AnimatePresence>
            {selectedAgent && (
              <div className="xl:col-span-1">
                <AgentTerminal
                  agent={selectedAgent}
                  logs={mockLogs}
                  isExpanded={terminalExpanded}
                  onToggleExpand={() => setTerminalExpanded(!terminalExpanded)}
                  onClose={() => setSelectedAgent(null)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
