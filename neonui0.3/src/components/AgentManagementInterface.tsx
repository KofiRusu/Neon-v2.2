"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CpuChipIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  CommandLineIcon,
  MagnifyingGlassIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  CogIcon,
  BoltIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ChatBubbleLeftIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";

// Types for Agent Management
interface Agent {
  id: string;
  name: string;
  type: string;
  status: "active" | "idle" | "error" | "paused";
  performance: number;
  cpuUsage: number;
  memoryUsage: number;
  uptime: string;
  lastAction: string;
  capabilities: string[];
  description: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
  agentId?: string;
}

interface CommandExecution {
  command: string;
  parameters: Record<string, any>;
  status: "idle" | "running" | "completed" | "error";
}

// Mock agents data - ready for tRPC integration
const mockAgents: Agent[] = [
  {
    id: "content-agent-01",
    name: "ContentAgent",
    type: "content",
    status: "active",
    performance: 94,
    cpuUsage: 23,
    memoryUsage: 45,
    uptime: "2h 34m",
    lastAction: "Generated blog post",
    capabilities: ["Blog Generation", "SEO Optimization", "Content Analysis"],
    description: "AI content generation & optimization",
  },
  {
    id: "ad-agent-01",
    name: "AdAgent",
    type: "ad",
    status: "active",
    performance: 87,
    cpuUsage: 34,
    memoryUsage: 52,
    uptime: "1h 12m",
    lastAction: "Optimized campaign budget",
    capabilities: ["Campaign Optimization", "A/B Testing", "Budget Allocation"],
    description: "Ad optimization & budget management",
  },
  {
    id: "email-agent-01",
    name: "EmailAgent",
    type: "email",
    status: "idle",
    performance: 91,
    cpuUsage: 8,
    memoryUsage: 23,
    uptime: "5h 47m",
    lastAction: "Email sequence sent",
    capabilities: ["Email Automation", "Personalization", "Analytics"],
    description: "Email marketing automation",
  },
  {
    id: "social-agent-01",
    name: "SocialAgent",
    type: "social",
    status: "active",
    performance: 89,
    cpuUsage: 28,
    memoryUsage: 41,
    uptime: "3h 22m",
    lastAction: "Posted to Instagram",
    capabilities: [
      "Multi-platform Posting",
      "Engagement Tracking",
      "Hashtag Optimization",
    ],
    description: "Cross-platform social media management",
  },
  {
    id: "insight-agent-01",
    name: "InsightAgent",
    type: "insight",
    status: "active",
    performance: 96,
    cpuUsage: 45,
    memoryUsage: 67,
    uptime: "6h 15m",
    lastAction: "Generated analytics report",
    capabilities: ["Data Analysis", "Trend Detection", "Performance Insights"],
    description: "Advanced analytics & insights generation",
  },
  {
    id: "support-agent-01",
    name: "SupportAgent",
    type: "support",
    status: "error",
    performance: 0,
    cpuUsage: 0,
    memoryUsage: 12,
    uptime: "0m",
    lastAction: "Connection failed",
    capabilities: ["Chat Automation", "Ticket Management", "Knowledge Base"],
    description: "AI-powered customer support",
  },
];

// Mock logs generator
const generateMockLogs = (): LogEntry[] => [
  {
    id: "1",
    timestamp: new Date().toLocaleTimeString(),
    level: "success",
    message: "ContentAgent: Blog post generation completed successfully",
    agentId: "content-agent-01",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
    level: "info",
    message: "AdAgent: Starting budget optimization analysis...",
    agentId: "ad-agent-01",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
    level: "warning",
    message: "SupportAgent: Connection timeout - attempting reconnection",
    agentId: "support-agent-01",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 90000).toLocaleTimeString(),
    level: "success",
    message: "SocialAgent: Successfully posted to 3 platforms",
    agentId: "social-agent-01",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
    level: "error",
    message: "SupportAgent: Failed to establish database connection",
    agentId: "support-agent-01",
  },
];

export default function AgentManagementInterface() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agents[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [logs, setLogs] = useState<LogEntry[]>(generateMockLogs());
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [commandExecution, setCommandExecution] = useState<CommandExecution>({
    command: "",
    parameters: {},
    status: "idle",
  });

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Simulate real-time log updates
  useEffect(() => {
    const interval = setInterval(
      () => {
        const newLog: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          level: ["info", "success", "warning"][
            Math.floor(Math.random() * 3)
          ] as LogEntry["level"],
          message: `${selectedAgent?.name || "System"}: ${
            [
              "Processing new task...",
              "Task completed successfully",
              "Performance metrics updated",
              "Monitoring system health",
              "Optimizing performance parameters",
            ][Math.floor(Math.random() * 5)]
          }`,
          agentId: selectedAgent?.id,
        };

        setLogs((prev) => [newLog, ...prev.slice(0, 19)]); // Keep last 20 logs
      },
      3000 + Math.random() * 2000,
    ); // Random interval 3-5 seconds

    return () => clearInterval(interval);
  }, [selectedAgent]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  // Agent icon mapping
  const getAgentIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      content: DocumentTextIcon,
      ad: BoltIcon,
      email: EnvelopeIcon,
      social: GlobeAltIcon,
      insight: ChartBarIcon,
      support: ChatBubbleLeftIcon,
      design: PaintBrushIcon,
    };
    return iconMap[type] || CpuChipIcon;
  };

  // Filter agents based on search and status
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || agent.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agents, searchQuery, statusFilter]);

  // Execute agent command - ready for tRPC integration
  const executeCommand = async (
    command: string,
    parameters: Record<string, any>,
  ) => {
    setCommandExecution({ command, parameters, status: "running" });

    // TODO: Replace with actual tRPC call
    // const result = await trpc.agent.execute.mutate({
    //   agentId: selectedAgent.id,
    //   command,
    //   parameters
    // });

    // Mock execution
    setTimeout(() => {
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: "success",
        message: `Command executed: ${command} with parameters ${JSON.stringify(parameters)}`,
        agentId: selectedAgent?.id,
      };
      setLogs((prev) => [newLog, ...prev]);
      setCommandExecution((prev) => ({ ...prev, status: "completed" }));
    }, 2000);
  };

  // Agent control functions
  const pauseAgent = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, status: "paused" as const } : agent,
      ),
    );
  };

  const resumeAgent = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, status: "active" as const } : agent,
      ),
    );
  };

  const stopAgent = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, status: "idle" as const } : agent,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-dark-space text-white">
      {/* Header */}
      <div className="nav-glass sticky top-0 z-40 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <CpuChipIcon className="h-8 w-8 text-neon-blue" />
              <div>
                <h1 className="text-2xl font-bold text-gradient">
                  Agent Management
                </h1>
                <p className="text-sm text-secondary">
                  Monitor and control AI agents
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary" />
              <input
                type="text"
                placeholder="Search agents..."
                className="input-neon pl-10 pr-4 py-2 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <select
              className="input-neon px-4 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="paused">Paused</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-88px)]">
        {/* Left Panel - Agent Grid */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredAgents.map((agent) => {
              const Icon = getAgentIcon(agent.type);
              const isSelected = selectedAgent?.id === agent.id;

              return (
                <motion.div
                  key={agent.id}
                  layout
                  className={`card-neon cursor-pointer transition-all duration-300 ${
                    isSelected ? "ring-2 ring-neon-blue glow-border" : ""
                  }`}
                  onClick={() => setSelectedAgent(agent)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Agent Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-12 h-12 bg-${agent.status === "active" ? "neon-blue" : agent.status === "error" ? "neon-pink" : "neon-purple"} rounded-xl flex items-center justify-center`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary">{agent.name}</h3>
                        <p className="text-sm text-secondary">
                          {agent.description}
                        </p>
                      </div>
                    </div>
                    <div className={`agent-status-${agent.status}`}></div>
                  </div>

                  {/* Performance Ring */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative w-16 h-16">
                        <svg
                          className="w-16 h-16 transform -rotate-90"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            stroke="rgba(139, 92, 246, 0.2)"
                            strokeWidth="2"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            stroke="url(#performanceGradient)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 10}`}
                            strokeDashoffset={`${2 * Math.PI * 10 * (1 - agent.performance / 100)}`}
                            className="transition-all duration-1000"
                          />
                          <defs>
                            <linearGradient
                              id="performanceGradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%"
                            >
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="50%" stopColor="#8b5cf6" />
                              <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-neon-blue">
                            {agent.performance}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-secondary">Uptime</div>
                        <div className="text-sm font-semibold text-primary">
                          {agent.uptime}
                        </div>
                        <div className="text-xs text-muted">
                          {agent.lastAction}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resource Usage */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary">CPU Usage</span>
                        <span className="text-neon-green">
                          {agent.cpuUsage}%
                        </span>
                      </div>
                      <div className="progress-neon">
                        <div
                          className="progress-fill bg-gradient-to-r from-neon-blue to-neon-green"
                          style={{ width: `${agent.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-secondary">Memory</span>
                        <span className="text-neon-purple">
                          {agent.memoryUsage}%
                        </span>
                      </div>
                      <div className="progress-neon">
                        <div
                          className="progress-fill bg-gradient-to-r from-neon-purple to-neon-pink"
                          style={{ width: `${agent.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Controls */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
                    <div className="flex space-x-2">
                      {agent.status === "paused" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resumeAgent(agent.id);
                          }}
                          className="p-2 bg-neon-green rounded-lg hover:bg-opacity-80 transition-all"
                        >
                          <PlayIcon className="h-4 w-4 text-white" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            pauseAgent(agent.id);
                          }}
                          className="p-2 bg-neon-orange rounded-lg hover:bg-opacity-80 transition-all"
                        >
                          <PauseIcon className="h-4 w-4 text-white" />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          stopAgent(agent.id);
                        }}
                        className="p-2 bg-neon-pink rounded-lg hover:bg-opacity-80 transition-all"
                      >
                        <StopIcon className="h-4 w-4 text-white" />
                      </button>

                      <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all">
                        <CogIcon className="h-4 w-4 text-white" />
                      </button>
                    </div>

                    <div className="text-xs text-muted">
                      {agent.capabilities.length} capabilities
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Agent Terminal */}
        <div className="w-1/2 p-6">
          <div className="h-full flex flex-col">
            {/* Terminal Header */}
            <div className="glass-strong p-4 rounded-t-2xl border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CommandLineIcon className="h-6 w-6 text-neon-green" />
                  <div>
                    <h3 className="font-bold text-primary">Agent Terminal</h3>
                    <p className="text-sm text-secondary">
                      {selectedAgent
                        ? `Connected to ${selectedAgent.name}`
                        : "No agent selected"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-neon-pink rounded-full"></div>
                    <div className="w-3 h-3 bg-neon-orange rounded-full"></div>
                    <div className="w-3 h-3 bg-neon-green rounded-full"></div>
                  </div>

                  <button
                    onClick={() => setIsTerminalExpanded(true)}
                    className="p-2 glass rounded-lg hover:bg-gray-700 transition-all"
                  >
                    <ArrowsPointingOutIcon className="h-4 w-4 text-secondary" />
                  </button>
                </div>
              </div>
            </div>

            {/* Command Input */}
            <div className="glass-strong p-4 border-b border-gray-800">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Command (e.g., generateContent)"
                    className="input-neon"
                    value={commandExecution.command}
                    onChange={(e) =>
                      setCommandExecution((prev) => ({
                        ...prev,
                        command: e.target.value,
                      }))
                    }
                  />
                  <select className="input-neon">
                    <option>generateContent</option>
                    <option>optimizeCampaign</option>
                    <option>analyzeMetrics</option>
                    <option>processEmail</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Audience"
                    className="input-neon text-sm"
                    onChange={(e) =>
                      setCommandExecution((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          audience: e.target.value,
                        },
                      }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Tone"
                    className="input-neon text-sm"
                    onChange={(e) =>
                      setCommandExecution((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          tone: e.target.value,
                        },
                      }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Topic"
                    className="input-neon text-sm"
                    onChange={(e) =>
                      setCommandExecution((prev) => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          topic: e.target.value,
                        },
                      }))
                    }
                  />
                </div>

                <button
                  onClick={() =>
                    executeCommand(
                      commandExecution.command,
                      commandExecution.parameters,
                    )
                  }
                  disabled={
                    !selectedAgent ||
                    !commandExecution.command ||
                    commandExecution.status === "running"
                  }
                  className="btn-neon w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {commandExecution.status === "running" ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Executing...</span>
                    </div>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4 mr-2" />
                      Execute Command
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="flex-1 glass-strong p-4 rounded-b-2xl overflow-hidden">
              <div
                ref={logContainerRef}
                className="h-full overflow-y-auto font-mono text-sm space-y-2"
                style={{ fontFamily: "Monaco, Consolas, monospace" }}
              >
                <AnimatePresence>
                  {logs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-2 rounded border-l-4 ${
                        log.level === "success"
                          ? "border-neon-green bg-green-900/20 text-green-300"
                          : log.level === "error"
                            ? "border-neon-pink bg-red-900/20 text-red-300"
                            : log.level === "warning"
                              ? "border-neon-orange bg-yellow-900/20 text-yellow-300"
                              : "border-neon-blue bg-blue-900/20 text-blue-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs text-gray-400">
                          [{log.timestamp}]
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            log.level === "success"
                              ? "bg-neon-green text-black"
                              : log.level === "error"
                                ? "bg-neon-pink text-white"
                                : log.level === "warning"
                                  ? "bg-neon-orange text-black"
                                  : "bg-neon-blue text-white"
                          }`}
                        >
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm">{log.message}</div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Terminal Modal */}
      <AnimatePresence>
        {isTerminalExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-6xl h-5/6 glass-strong rounded-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div className="flex items-center space-x-3">
                  <CommandLineIcon className="h-8 w-8 text-neon-green" />
                  <div>
                    <h3 className="text-2xl font-bold text-primary">
                      Expanded Terminal
                    </h3>
                    <p className="text-secondary">
                      Full-screen agent monitoring and control
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsTerminalExpanded(false)}
                  className="p-3 glass rounded-xl hover:bg-gray-700 transition-all"
                >
                  <XMarkIcon className="h-6 w-6 text-secondary" />
                </button>
              </div>

              {/* Expanded Terminal Content */}
              <div className="flex-1 p-6 overflow-hidden">
                <div
                  className="h-full overflow-y-auto font-mono text-lg space-y-3 p-4 bg-black/50 rounded-xl"
                  style={{ fontFamily: "Monaco, Consolas, monospace" }}
                >
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        log.level === "success"
                          ? "border-neon-green bg-green-900/30 text-green-300"
                          : log.level === "error"
                            ? "border-neon-pink bg-red-900/30 text-red-300"
                            : log.level === "warning"
                              ? "border-neon-orange bg-yellow-900/30 text-yellow-300"
                              : "border-neon-blue bg-blue-900/30 text-blue-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm text-gray-400">
                          [{log.timestamp}]
                        </span>
                        <span
                          className={`text-sm px-3 py-1 rounded-full ${
                            log.level === "success"
                              ? "bg-neon-green text-black"
                              : log.level === "error"
                                ? "bg-neon-pink text-white"
                                : log.level === "warning"
                                  ? "bg-neon-orange text-black"
                                  : "bg-neon-blue text-white"
                          }`}
                        >
                          {log.level.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-base leading-relaxed">
                        {log.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
