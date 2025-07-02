"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Bot, DollarSign, Target, TrendingUp, Brain, Activity, Zap, Cpu, RefreshCw } from "lucide-react"
import PageLayout from "@/components/page-layout"

// Mock tRPC data - replace with actual tRPC calls
const mockMetrics = {
  totalRevenue: 47230,
  revenueChange: 18.2,
  activeAgents: 12,
  agentsChange: 25.0,
  conversionRate: 8.4,
  conversionChange: 12.5,
  aiEfficiency: 94.2,
  efficiencyChange: 5.8,
}

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
    cpuUsage: 67,
    memoryUsage: 45,
    reasoning: {
      currentTask: "Generating blog post about sustainable marketing",
      confidence: 92,
      nextAction: "Optimize for target keywords",
    },
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
    cpuUsage: 45,
    memoryUsage: 78,
    reasoning: {
      currentTask: "Analyzing competitor keywords",
      confidence: 88,
      nextAction: "Update meta descriptions",
    },
  },
  {
    id: "brand-voice-003",
    name: "Brand Voice Agent",
    type: "Brand Compliance",
    status: "training" as const,
    performance: 92,
    tasksCompleted: 634,
    tasksActive: 1,
    lastActive: "1 hour ago",
    cpuUsage: 78,
    memoryUsage: 23,
    reasoning: {
      currentTask: "Learning new brand guidelines",
      confidence: 76,
      nextAction: "Apply voice patterns to content",
    },
  },
  {
    id: "social-agent-004",
    name: "Social Media Bot",
    type: "Social Management",
    status: "idle" as const,
    performance: 78,
    tasksCompleted: 456,
    tasksActive: 0,
    lastActive: "2 hours ago",
    cpuUsage: 23,
    memoryUsage: 12,
  },
]

const mockTrendData = [
  { metric: "Revenue Growth", value: "+18.2%", trend: "up", color: "neon-green" },
  { metric: "Agent Efficiency", value: "+5.8%", trend: "up", color: "neon-blue" },
  { metric: "Task Completion", value: "+12.4%", trend: "up", color: "neon-purple" },
  { metric: "Error Rate", value: "-2.1%", trend: "down", color: "neon-pink" },
]

interface KPIMetricCardProps {
  title: string
  value: number
  change: number
  format?: "currency" | "number" | "percentage"
  icon: React.ReactNode
  color: "blue" | "purple" | "pink" | "green"
  isTopPerformer?: boolean
}

function KPIMetricCard({
  title,
  value,
  change,
  format = "number",
  icon,
  color,
  isTopPerformer = false,
}: KPIMetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value)
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [value])

  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return `$${val.toLocaleString()}`
      case "percentage":
        return `${val}%`
      default:
        return val.toLocaleString()
    }
  }

  const colorClasses = {
    blue: "text-neon-blue border-neon-blue/30",
    purple: "text-neon-purple border-neon-purple/30",
    pink: "text-neon-pink border-neon-pink/30",
    green: "text-neon-green border-neon-green/30",
  }

  const glowClasses = {
    blue: "shadow-neon-blue/20",
    purple: "shadow-neon-purple/20",
    pink: "shadow-neon-pink/20",
    green: "shadow-neon-green/20",
  }

  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`glass-strong p-6 rounded-lg border transition-all duration-300 ${
        colorClasses[color]
      } ${glowClasses[color]} ${isTopPerformer ? "glow-border animate-pulse" : ""} hover:border-opacity-50`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white/5 ${colorClasses[color].split(" ")[0]}`}>
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <RefreshCw className="w-6 h-6" />
            </motion.div>
          ) : (
            icon
          )}
        </div>
        <div className={`flex items-center space-x-1 text-sm ${isPositive ? "text-neon-green" : "text-neon-pink"}`}>
          <TrendingUp className={`w-4 h-4 ${!isPositive ? "rotate-180" : ""}`} />
          <span>
            {isPositive ? "+" : ""}
            {change}%
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-gray-400">{title}</p>
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-3xl font-bold ${colorClasses[color].split(" ")[0]} counter-animate`}
        >
          {isLoading ? "..." : formatValue(displayValue)}
        </motion.p>
      </div>

      {isTopPerformer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 px-2 py-1 bg-neon-green/20 text-neon-green text-xs font-medium rounded-full border border-neon-green/30 w-fit"
        >
          Top Performer
        </motion.div>
      )}
    </motion.div>
  )
}

interface AgentStatusCardProps {
  agent: (typeof mockAgents)[0]
  index: number
}

function AgentStatusCard({ agent, index }: AgentStatusCardProps) {
  const statusConfig = {
    active: {
      color: "text-neon-green",
      bg: "bg-neon-green/20",
      border: "border-neon-green/30",
      pulse: "agent-status-active",
    },
    idle: {
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
      pulse: "agent-status-idle",
    },
    training: {
      color: "text-neon-blue",
      bg: "bg-neon-blue/20",
      border: "border-neon-blue/30",
      pulse: "agent-status-training",
    },
    error: {
      color: "text-neon-pink",
      bg: "bg-neon-pink/20",
      border: "border-neon-pink/30",
      pulse: "agent-status-error",
    },
  }

  const config = statusConfig[agent.status]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="glass p-4 rounded-lg border border-white/10 hover:border-neon-blue/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-2 rounded-lg bg-white/5 text-neon-blue">
              <Bot className="w-5 h-5" />
            </div>
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${config.bg} ${config.border} border ${config.pulse}`}
            ></div>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{agent.name}</h3>
            <p className="text-xs text-gray-400">{agent.type}</p>
          </div>
        </div>

        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.color}`}
        >
          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Performance</span>
          <span className="text-neon-green font-semibold">{agent.performance}%</span>
        </div>

        <div className="neon-progress h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.performance}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
            className="neon-progress-bar"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-400">Tasks</p>
            <p className="font-semibold text-white">{agent.tasksCompleted}</p>
          </div>
          <div>
            <p className="text-gray-400">Active</p>
            <p className="font-semibold text-neon-blue">{agent.tasksActive}</p>
          </div>
        </div>

        {agent.reasoning && (
          <div className="glass p-2 rounded text-xs">
            <p className="text-neon-purple font-medium mb-1">Current Task:</p>
            <p className="text-gray-300">{agent.reasoning.currentTask}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-400">Confidence:</span>
              <span className="text-neon-green">{agent.reasoning.confidence}%</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API refresh
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const actions = (
    <div className="flex items-center space-x-3">
      <div className="text-sm text-gray-400 hidden md:block">{currentTime.toLocaleTimeString()}</div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="btn-neon text-sm flex items-center space-x-2 disabled:opacity-50"
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: isRefreshing ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
        >
          <RefreshCw className="w-4 h-4" />
        </motion.div>
        <span>Refresh</span>
      </motion.button>
    </div>
  )

  return (
    <PageLayout
      title="AI Command Center"
      subtitle="Real-time agent orchestration and performance analytics"
      actions={actions}
    >
      <div className="space-y-8">
        {/* KPI Metrics Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <KPIMetricCard
            title="Total Revenue"
            value={mockMetrics.totalRevenue}
            change={mockMetrics.revenueChange}
            format="currency"
            icon={<DollarSign className="w-6 h-6" />}
            color="green"
            isTopPerformer={true}
          />
          <KPIMetricCard
            title="Active Agents"
            value={mockMetrics.activeAgents}
            change={mockMetrics.agentsChange}
            format="number"
            icon={<Bot className="w-6 h-6" />}
            color="blue"
          />
          <KPIMetricCard
            title="Conversion Rate"
            value={mockMetrics.conversionRate}
            change={mockMetrics.conversionChange}
            format="percentage"
            icon={<Target className="w-6 h-6" />}
            color="purple"
          />
          <KPIMetricCard
            title="AI Efficiency"
            value={mockMetrics.aiEfficiency}
            change={mockMetrics.efficiencyChange}
            format="percentage"
            icon={<Brain className="w-6 h-6" />}
            color="pink"
          />
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Agent Status Panel */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="glass-strong p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gradient">Live Agent Fleet</h2>
                  <p className="text-gray-400 text-sm">Real-time agent monitoring and control</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-neon-green rounded-full status-pulse"></div>
                  <span className="text-xs text-neon-green">All Systems Online</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockAgents.map((agent, index) => (
                  <AgentStatusCard key={agent.id} agent={agent} index={index} />
                ))}
              </div>
            </div>
          </motion.section>

          {/* Performance Summary & Trends */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* System Health */}
            <div className="glass-strong p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-neon-blue" />
                    <span className="text-gray-400">CPU Usage</span>
                  </div>
                  <span className="text-neon-blue font-semibold">67%</span>
                </div>
                <div className="neon-progress h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "67%" }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                    className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-neon-green" />
                    <span className="text-gray-400">Memory</span>
                  </div>
                  <span className="text-neon-green font-semibold">45%</span>
                </div>
                <div className="neon-progress h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "45%" }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                    className="bg-gradient-to-r from-neon-green to-neon-blue h-2 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-neon-purple" />
                    <span className="text-gray-400">Network</span>
                  </div>
                  <span className="text-neon-purple font-semibold">89%</span>
                </div>
                <div className="neon-progress h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "89%" }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.9 }}
                    className="bg-gradient-to-r from-neon-purple to-neon-pink h-2 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Trend Analyzer */}
            <div className="glass-strong p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Performance Trends</h3>
              <div className="space-y-3">
                {mockTrendData.map((trend, index) => (
                  <motion.div
                    key={trend.metric}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 + index * 0.1 }}
                    className="flex items-center justify-between p-3 glass rounded-lg"
                  >
                    <span className="text-gray-300 text-sm">{trend.metric}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-${trend.color} font-semibold text-sm`}>{trend.value}</span>
                      <TrendingUp
                        className={`w-4 h-4 text-${trend.color} ${trend.trend === "down" ? "rotate-180" : ""}`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-strong p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-neon-blue">2.4M</p>
                  <p className="text-xs text-gray-400">API Requests</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-neon-purple">156K</p>
                  <p className="text-xs text-gray-400">Tasks Processed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-neon-green">$12.4K</p>
                  <p className="text-xs text-gray-400">Revenue Today</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-neon-pink">99.8%</p>
                  <p className="text-xs text-gray-400">Uptime</p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </PageLayout>
  )
}
