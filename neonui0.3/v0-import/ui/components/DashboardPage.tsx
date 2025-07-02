"use client";

import React from "react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Bot,
  DollarSign,
  Target,
  TrendingUp,
  Brain,
  Activity,
  Zap,
  Cpu,
  RefreshCw,
  Calendar,
  BarChart3,
  Settings,
  Bell,
} from "lucide-react";

// Mock data for V0 - no tRPC or external API calls
const mockMetrics = {
  totalRevenue: 47230,
  revenueChange: 18.2,
  activeAgents: 12,
  agentsChange: 25.0,
  conversionRate: 8.4,
  conversionChange: 12.5,
  aiEfficiency: 94.2,
  efficiencyChange: 5.8,
};

const mockAgents = [
  { id: 1, name: "Content Generator", status: "active", performance: 94 },
  { id: 2, name: "SEO Optimizer", status: "active", performance: 87 },
  { id: 3, name: "Social Media Manager", status: "idle", performance: 92 },
  { id: 4, name: "Email Campaign Bot", status: "active", performance: 89 },
];

const mockTrendData = [
  { metric: "Revenue Growth", value: "+18.2%", trend: "up", color: "green" },
  { metric: "Agent Efficiency", value: "+5.8%", trend: "up", color: "blue" },
  { metric: "Task Completion", value: "+12.4%", trend: "up", color: "purple" },
  { metric: "Error Rate", value: "-2.1%", trend: "down", color: "pink" },
];

interface KPIMetricCardProps {
  title: string;
  value: number;
  change: number;
  format?: "currency" | "number" | "percentage";
  icon: React.ReactNode;
  color: "blue" | "purple" | "pink" | "green";
  isTopPerformer?: boolean;
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
  const [displayValue, setDisplayValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [value]);

  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return `$${val.toLocaleString()}`;
      case "percentage":
        return `${val}%`;
      default:
        return val.toLocaleString();
    }
  };

  const colorClasses = {
    blue: "text-blue-400 border-blue-400/30",
    purple: "text-purple-400 border-purple-400/30",
    pink: "text-pink-400 border-pink-400/30",
    green: "text-green-400 border-green-400/30",
  };

  const glowClasses = {
    blue: "shadow-blue-400/20",
    purple: "shadow-purple-400/20",
    pink: "shadow-pink-400/20",
    green: "shadow-green-400/20",
  };

  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg border transition-all duration-300 ${
        colorClasses[color]
      } ${glowClasses[color]} ${isTopPerformer ? "ring-2 ring-green-400/50 animate-pulse" : ""} hover:border-opacity-50`}
    >
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-lg bg-white/5 ${colorClasses[color].split(" ")[0]}`}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <RefreshCw className="w-6 h-6" />
            </motion.div>
          ) : (
            icon
          )}
        </div>
        <div
          className={`flex items-center space-x-1 text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}
        >
          <TrendingUp
            className={`w-4 h-4 ${!isPositive ? "rotate-180" : ""}`}
          />
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
          className={`text-3xl font-bold ${colorClasses[color].split(" ")[0]}`}
        >
          {isLoading ? "..." : formatValue(displayValue)}
        </motion.p>
      </div>

      {isTopPerformer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 px-2 py-1 bg-green-400/20 text-green-400 text-xs font-medium rounded-full border border-green-400/30 w-fit"
        >
          Top Performer
        </motion.div>
      )}
    </motion.div>
  );
}

function AgentStatusCard({ agent }: { agent: any }) {
  const statusColors = {
    active: "text-green-400 bg-green-400/20 border-green-400/30",
    idle: "text-yellow-400 bg-yellow-400/20 border-yellow-400/30",
    error: "text-red-400 bg-red-400/20 border-red-400/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-gray-900/30 backdrop-blur-lg p-4 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium">{agent.name}</h4>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[agent.status as keyof typeof statusColors]}`}
        >
          {agent.status}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Performance</span>
          <span className="text-blue-400 font-semibold">
            {agent.performance}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.performance}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                AI Command Center
              </h1>
              <p className="text-sm text-gray-400">
                Real-time agent orchestration and performance analytics
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400 hidden md:block">
                {currentTime.toLocaleTimeString()}
              </div>
              <button className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <motion.div
                  animate={isRefreshing ? { rotate: 360 } : {}}
                  transition={{
                    duration: 1,
                    repeat: isRefreshing ? Infinity : 0,
                    ease: "linear",
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                <span className="text-sm">Refresh</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* KPI Metrics */}
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
            {/* Agent Control Panel */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">
                    Active Agents
                  </h3>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-gray-400">
                      Live Performance
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockAgents.map((agent, index) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <AgentStatusCard agent={agent} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Performance & Health */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* System Health */}
              <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg border border-gray-700/50">
                <h3 className="text-xl font-bold text-white mb-4">
                  System Health
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-400">CPU Usage</span>
                    </div>
                    <span className="text-blue-400 font-semibold">67%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "67%" }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                      className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-green-400" />
                      <span className="text-gray-400">Memory</span>
                    </div>
                    <span className="text-green-400 font-semibold">45%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "45%" }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                      className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-400">Network</span>
                    </div>
                    <span className="text-purple-400 font-semibold">89%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "89%" }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.9 }}
                      className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Performance Trends */}
              <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg border border-gray-700/50">
                <h3 className="text-xl font-bold text-white mb-4">
                  Performance Trends
                </h3>
                <div className="space-y-3">
                  {mockTrendData.map((trend, index) => (
                    <motion.div
                      key={trend.metric}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
                    >
                      <span className="text-gray-300 text-sm">
                        {trend.metric}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-semibold text-sm ${
                            trend.color === "green"
                              ? "text-green-400"
                              : trend.color === "blue"
                                ? "text-blue-400"
                                : trend.color === "purple"
                                  ? "text-purple-400"
                                  : "text-pink-400"
                          }`}
                        >
                          {trend.value}
                        </span>
                        <TrendingUp
                          className={`w-4 h-4 ${
                            trend.color === "green"
                              ? "text-green-400"
                              : trend.color === "blue"
                                ? "text-blue-400"
                                : trend.color === "purple"
                                  ? "text-purple-400"
                                  : "text-pink-400"
                          } ${trend.trend === "down" ? "rotate-180" : ""}`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gray-900/50 backdrop-blur-lg p-6 rounded-lg border border-gray-700/50">
                <h3 className="text-xl font-bold text-white mb-4">
                  Quick Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-400">2.4M</p>
                    <p className="text-xs text-gray-400">API Requests</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">156K</p>
                    <p className="text-xs text-gray-400">Tasks Processed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-400">$12.4K</p>
                    <p className="text-xs text-gray-400">Revenue Today</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-pink-400">99.8%</p>
                    <p className="text-xs text-gray-400">Uptime</p>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
