"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef } from "react"
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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  PlayIcon, 
  StopIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { trpc } from '../../utils/trpc';
import PageLayout from '../../components/page-layout';
import { useRouter } from 'next/navigation';

const statusColors = {
  active: 'bg-green-500',
  running: 'bg-blue-500',
  inactive: 'bg-gray-500',
  error: 'bg-red-500'
};

const statusIcons = {
  active: CheckCircleIcon,
  running: ArrowPathIcon,
  inactive: StopIcon,
  error: ExclamationTriangleIcon
};

const logLevelIcons = {
  success: CheckCircleIcon,
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
  error: ExclamationTriangleIcon
};

const logLevelColors = {
  success: 'text-green-600',
  info: 'text-blue-600',
  warning: 'text-yellow-600',
  error: 'text-red-600'
};

// Mock tRPC data - replace with actual tRPC calls
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
  {
    id: "email-agent-006",
    name: "Email Marketing Agent",
    type: "Email Automation",
    status: "active" as const,
    performance: 91,
    tasksCompleted: 1876,
    tasksActive: 4,
    lastActive: "1 min ago",
    description: "Email campaign automation",
    capabilities: ["Campaign Creation", "Automation", "Segmentation"],
    icon: "📧",
    cpuUsage: 54,
    memoryUsage: 41,
    uptime: "99.5%",
    version: "v2.3.1",
  },
]

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
    level: "info" as const,
    message: "Applying SEO optimization recommendations",
    agentId: "content-agent-001",
  },
  {
    id: "log-005",
    timestamp: new Date(Date.now() - 10000).toISOString(),
    level: "warning" as const,
    message: "Memory usage approaching 70% threshold",
    agentId: "content-agent-001",
  },
  {
    id: "log-006",
    timestamp: new Date(Date.now() - 5000).toISOString(),
    level: "success" as const,
    message: "Task completed successfully - content ready for review",
    agentId: "content-agent-001",
  },
]

interface AgentCardProps {
  agent: (typeof mockAgents)[0]
  isSelected: boolean
  onClick: () => void
}

function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  const statusConfig = {
    active: {
      color: "text-neon-green",
      bg: "bg-neon-green/20",
      border: "border-neon-green/30",
      pulse: "agent-status-active",
      icon: Activity,
    },
    idle: {
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
      pulse: "agent-status-idle",
      icon: Clock,
    },
    error: {
      color: "text-neon-pink",
      bg: "bg-neon-pink/20",
      border: "border-neon-pink/30",
      pulse: "agent-status-error",
      icon: AlertCircle,
    },
  }

  const config = statusConfig[agent.status]
  const StatusIcon = config.icon

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glassmorphism-effect p-6 rounded-lg cursor-pointer transition-all duration-300 ${
        isSelected ? "border-neon-blue/50 glow-border shadow-neon-blue/20" : "border-white/10 hover:border-neon-blue/30"
      }`}
    >
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
                  <stop offset="0%" stopColor="var(--neon-blue)" />
                  <stop offset="100%" stopColor="var(--neon-purple)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-neon-blue">{agent.performance}%</span>
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
          <span className="text-neon-blue">{agent.cpuUsage}%</span>
        </div>
        <div className="neon-progress h-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.cpuUsage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-neon-blue to-neon-purple h-1 rounded-full"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Memory</span>
          <span className="text-neon-purple">{agent.memoryUsage}%</span>
        </div>
        <div className="neon-progress h-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.memoryUsage}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="bg-gradient-to-r from-neon-purple to-neon-pink h-1 rounded-full"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-lg font-bold text-neon-green">{agent.tasksCompleted}</p>
          <p className="text-xs text-gray-400">Completed</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-neon-blue">{agent.tasksActive}</p>
          <p className="text-xs text-gray-400">Active</p>
        </div>
      </div>
    </motion.div>
  )
}

interface AgentTerminalProps {
  agent: (typeof mockAgents)[0] | null
  logs: typeof mockLogs
  isExpanded: boolean
  onToggleExpand: () => void
  onClose: () => void
}

function AgentTerminal({ agent, logs, isExpanded, onToggleExpand, onClose }: AgentTerminalProps) {
  const [command, setCommand] = useState("")
  const [parameters, setParameters] = useState({
    audience: "",
    tone: "professional",
    topic: "",
  })
  const [isExecuting, setIsExecuting] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  const handleExecute = async () => {
    if (!agent || !command.trim()) return

    setIsExecuting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsExecuting(false)
    setCommand("")
  }

  const levelConfig = {
    info: { color: "text-neon-blue", icon: "ℹ" },
    success: { color: "text-neon-green", icon: "✓" },
    warning: { color: "text-yellow-400", icon: "⚠" },
    error: { color: "text-neon-pink", icon: "✗" },
  }

  if (!agent) return null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`glassmorphism-effect rounded-lg overflow-hidden ${isExpanded ? "fixed inset-4 z-50" : "h-[600px]"}`}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center space-x-3">
          <Terminal className="w-5 h-5 text-neon-green" />
          <div>
            <h3 className="font-semibold text-white">{agent.name} Terminal</h3>
            <p className="text-xs text-gray-400">Agent ID: {agent.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleExpand}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="flex flex-col h-full">
        {/* Agent Controls */}
        <div className="p-4 border-b border-white/10 bg-black/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Audience</label>
              <input
                type="text"
                value={parameters.audience}
                onChange={(e) => setParameters((prev) => ({ ...prev, audience: e.target.value }))}
                placeholder="Target audience..."
                className="w-full glass border border-white/10 rounded px-3 py-2 text-sm text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Tone</label>
              <select
                value={parameters.tone}
                onChange={(e) => setParameters((prev) => ({ ...prev, tone: e.target.value }))}
                className="w-full glass border border-white/10 rounded px-3 py-2 text-sm text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
              >
                <option value="professional" className="bg-gray-800">
                  Professional
                </option>
                <option value="casual" className="bg-gray-800">
                  Casual
                </option>
                <option value="friendly" className="bg-gray-800">
                  Friendly
                </option>
                <option value="authoritative" className="bg-gray-800">
                  Authoritative
                </option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Topic</label>
              <input
                type="text"
                value={parameters.topic}
                onChange={(e) => setParameters((prev) => ({ ...prev, topic: e.target.value }))}
                placeholder="Content topic..."
                className="w-full glass border border-white/10 rounded px-3 py-2 text-sm text-white bg-transparent focus:border-neon-blue/50 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={agent.status !== "active"}
              className="btn-neon text-sm flex items-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>Run Agent</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass border border-white/10 px-4 py-2 rounded text-sm text-gray-400 hover:text-white"
            >
              <Pause className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="glass border border-white/10 px-4 py-2 rounded text-sm text-gray-400 hover:text-white"
            >
              <Square className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Terminal Output */}
        <div
          ref={terminalRef}
          className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-black/30"
          style={{ minHeight: isExpanded ? "400px" : "300px" }}
        >
          <div className="space-y-1">
            {logs
              .filter((log) => log.agentId === agent.id)
              .map((log, index) => {
                const config = levelConfig[log.level]
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start space-x-2 hover:bg-white/5 p-1 rounded pulse-neon"
                  >
                    <span className="text-gray-500 text-xs w-20 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`${config.color} w-4 flex-shrink-0`}>{config.icon}</span>
                    <span className="text-gray-300 flex-1">{log.message}</span>
                  </motion.div>
                )
              })}

            {isExecuting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-2 text-neon-blue"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                <span>Executing command...</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Command Input */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center space-x-2">
            <span className="text-neon-green font-mono">$</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleExecute()}
              placeholder="Enter command..."
              className="flex-1 bg-transparent text-white font-mono focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExecute}
              disabled={!command.trim() || isExecuting}
              className="p-2 rounded-lg bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const { data: agentsData, isLoading: agentsLoading, refetch } = trpc.agent.getAllAgents.useQuery();
  const { data: logsData, isLoading: logsLoading } = trpc.agent.getAgentLogs.useQuery(
    { agentId: selectedAgent || '', limit: 50 },
    { enabled: !!selectedAgent }
  );
  
  const runAgentMutation = trpc.agent.runAgent.useMutation({
    onSuccess: () => {
      refetch();
    }
  });
  
  const stopAgentMutation = trpc.agent.stopAgent.useMutation({
    onSuccess: () => {
      refetch();
    }
  });

  const agents = agentsData?.data || [];
  const logs = logsData?.data || [];

  const handleRunAgent = (agentId: string) => {
    runAgentMutation.mutate({ agentId });
  };

  const handleStopAgent = (agentId: string) => {
    stopAgentMutation.mutate({ agentId });
  };

  const filteredAgents = mockAgents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const selectedAgentData = mockAgents.find((agent) => agent.id === selectedAgent)

  const actions = (
    <div className="flex items-center space-x-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="btn-neon text-sm flex items-center space-x-2"
      >
        <Zap className="w-4 h-4" />
        <span>Deploy Agent</span>
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="glass border border-white/10 p-2 rounded-lg text-gray-400 hover:text-white"
      >
        <Download className="w-5 h-5" />
      </motion.button>
    </div>
  )

  const router = useRouter();

  return (
    <PageLayout
      title="AI Agents"
      subtitle="Manage and monitor your AI agent workforce"
      actions={actions}
      headerActions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/agents/logs')}
          >
            <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-2" />
            View Logs
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={agentsLoading}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents by name or type..."
              className="w-full glass border border-white/10 rounded-lg bg-transparent py-3 px-4 text-white placeholder-gray-400 focus:border-neon-blue/50 focus:outline-none"
            />
          </div>

          <div className="flex space-x-1 glass p-1 rounded-lg">
            {["all", "active", "idle", "error"].map((status) => (
              <motion.button
                key={status}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  statusFilter === status
                    ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Agent Grid */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            {agentsLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              filteredAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedAgent === agent.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                          {agent.status}
                        </Badge>
                      </div>
                      <CardDescription className="capitalize">{agent.type.replace('-', ' ')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Success Rate</span>
                          <span className="font-medium">{agent.performance}%</span>
                        </div>
                        <Progress value={agent.performance} className="h-2" />
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500">Tasks</div>
                            <div className="font-medium">{agent.tasksCompleted}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">Last Run</div>
                            <div className="font-medium text-xs">
                              {new Date(agent.lastActive).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {agent.status === 'active' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStopAgent(agent.id);
                              }}
                              disabled={stopAgentMutation.isLoading}
                            >
                              <StopIcon className="h-4 w-4 mr-1" />
                              Stop
                            </Button>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRunAgent(agent.id);
                              }}
                              disabled={runAgentMutation.isLoading || agent.status === 'error'}
                            >
                              <PlayIcon className="h-4 w-4 mr-1" />
                              Run
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Agent Terminal Panel */}
          <AnimatePresence>
            {selectedAgent && (
              <AgentTerminal
                agent={selectedAgentData}
                logs={mockLogs}
                isExpanded={isTerminalExpanded}
                onToggleExpand={() => setIsTerminalExpanded(!isTerminalExpanded)}
                onClose={() => setSelectedAgent(null)}
              />
            )}
          </AnimatePresence>

          {/* Default Panel */}
          {!selectedAgent && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glassmorphism-effect p-8 rounded-lg text-center"
            >
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Select an Agent</h3>
              <p className="text-gray-400 mb-6">
                Choose an agent from the grid to view its terminal and execute commands
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Monitor real-time logs</p>
                <p>• Execute custom commands</p>
                <p>• Control agent lifecycle</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Agent Details */}
        {selectedAgent && (
          <Card>
            <CardHeader>
              <CardTitle>Agent Details & Logs</CardTitle>
              <CardDescription>
                Real-time logs and performance metrics for {agents.find(a => a.id === selectedAgent)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="logs" className="w-full">
                <TabsList>
                  <TabsTrigger value="logs">Recent Logs</TabsTrigger>
                  <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                </TabsList>
                
                <TabsContent value="logs" className="space-y-4">
                  <ScrollArea className="h-96 w-full rounded-md border p-4">
                    {logsLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="animate-pulse flex space-x-4">
                            <div className="rounded-full bg-gray-200 h-6 w-6"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : logs.length > 0 ? (
                      <div className="space-y-3">
                        {logs.map((log) => {
                          const LogIcon = logLevelIcons[log.level];
                          return (
                            <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                              <LogIcon className={`h-5 w-5 mt-0.5 ${logLevelColors[log.level]}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{log.message}</p>
                                  <span className="text-xs text-gray-500">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                {log.details && (
                                  <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <Alert>
                        <InformationCircleIcon className="h-4 w-4" />
                        <AlertDescription>
                          No logs available for this agent yet.
                        </AlertDescription>
                      </Alert>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="metrics" className="space-y-4">
                  {(() => {
                    const agent = agents.find(a => a.id === selectedAgent);
                    return agent ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Success Rate</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">{agent.performance}%</div>
                            <Progress value={agent.performance} className="mt-2" />
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Tasks Completed</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{agent.tasksCompleted}</div>
                            <p className="text-sm text-gray-500 mt-1">Total tasks executed</p>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge variant="outline" className="flex items-center gap-2 w-fit">
                              <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                              <span className="capitalize">{agent.status}</span>
                            </Badge>
                            <p className="text-sm text-gray-500 mt-2">
                              Last run: {new Date(agent.lastActive).toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    ) : null;
                  })()}
                </TabsContent>

                <TabsContent value="config" className="space-y-4">
                  <Alert>
                    <InformationCircleIcon className="h-4 w-4" />
                    <AlertDescription>
                      Agent configuration management will be available in a future update.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
