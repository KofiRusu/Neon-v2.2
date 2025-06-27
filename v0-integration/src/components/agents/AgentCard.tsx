'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Agent {
  id: string;
  name: string;
  category: 'content' | 'marketing' | 'analytics' | 'automation' | 'support';
  description: string;
  capabilities: string[];
  version: string;
  status: 'active' | 'inactive' | 'maintenance';
}

interface AgentHealth {
  id: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  responseTime: number;
  lastHealthCheck: Date;
  lastRun: Date | null;
  uptime: number;
  errorRate: number;
  performance: {
    avgResponseTime: number;
    successRate: number;
    totalExecutions: number;
    lastExecutionDuration: number | null;
  };
}

interface AgentCardProps {
  agent: Agent;
  health?: AgentHealth;
  darkMode: boolean;
  onClick: () => void;
}

const categoryColors = {
  content: {
    gradient: 'from-purple-500/20 via-pink-500/20 to-purple-500/20',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/20',
    icon: '✨',
  },
  marketing: {
    gradient: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20',
    icon: '📈',
  },
  analytics: {
    gradient: 'from-green-500/20 via-emerald-500/20 to-green-500/20',
    border: 'border-green-500/30',
    glow: 'shadow-green-500/20',
    icon: '📊',
  },
  automation: {
    gradient: 'from-orange-500/20 via-red-500/20 to-orange-500/20',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20',
    icon: '⚙️',
  },
  support: {
    gradient: 'from-indigo-500/20 via-violet-500/20 to-indigo-500/20',
    border: 'border-indigo-500/30',
    glow: 'shadow-indigo-500/20',
    icon: '🎧',
  },
};

const statusConfig = {
  healthy: {
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    icon: '🟢',
    pulse: 'animate-pulse',
  },
  degraded: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: '🟡',
    pulse: 'animate-pulse',
  },
  unhealthy: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: '🔴',
    pulse: 'animate-bounce',
  },
  offline: {
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    icon: '⚫',
    pulse: '',
  },
};

export function AgentCard({ agent, health, darkMode, onClick }: AgentCardProps) {
  const categoryStyle = categoryColors[agent.category];
  const statusStyle = health ? statusConfig[health.status] : statusConfig.offline;

  const getPerformanceColor = (value: number, isResponseTime = false) => {
    if (isResponseTime) {
      if (value < 200) return 'text-green-400';
      if (value < 500) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      if (value > 90) return 'text-green-400';
      if (value > 70) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-2xl border backdrop-blur-xl overflow-hidden
        transition-all duration-300 hover:shadow-2xl
        ${
          darkMode
            ? `bg-gradient-to-br ${categoryStyle.gradient} ${categoryStyle.border} hover:${categoryStyle.glow}`
            : `bg-white/80 ${categoryStyle.border} hover:${categoryStyle.glow}`
        }
      `}
    >
      {/* Animated background glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${categoryStyle.gradient} opacity-50 animate-pulse`}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{categoryStyle.icon}</div>
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {agent.name}
              </h3>
              <span
                className={`text-sm capitalize ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                {agent.category}
              </span>
            </div>
          </div>

          {/* Status indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
              statusStyle.bg
            } ${statusStyle.border}`}
          >
            <span className={statusStyle.pulse}>{statusStyle.icon}</span>
            <span className={`text-xs font-medium ${statusStyle.color}`}>
              {health?.status.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {agent.description}
        </p>

        {/* Performance Metrics */}
        {health && (
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div
                  className={`text-xs font-medium mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Response Time
                </div>
                <div
                  className={`text-sm font-semibold ${getPerformanceColor(
                    health.responseTime,
                    true
                  )}`}
                >
                  {health.responseTime}ms
                </div>
              </div>

              <div>
                <div
                  className={`text-xs font-medium mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Uptime
                </div>
                <div className={`text-sm font-semibold ${getPerformanceColor(health.uptime)}`}>
                  {health.uptime}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div
                  className={`text-xs font-medium mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Success Rate
                </div>
                <div
                  className={`text-sm font-semibold ${getPerformanceColor(
                    health.performance.successRate
                  )}`}
                >
                  {health.performance.successRate.toFixed(1)}%
                </div>
              </div>

              <div>
                <div
                  className={`text-xs font-medium mb-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Executions
                </div>
                <div
                  className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {health.performance.totalExecutions}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Capabilities Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {agent.capabilities.slice(0, 3).map((capability, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs rounded-lg border ${
                darkMode
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              {capability.replace(/_/g, ' ')}
            </span>
          ))}
          {agent.capabilities.length > 3 && (
            <span
              className={`px-2 py-1 text-xs rounded-lg border ${
                darkMode
                  ? 'bg-white/10 border-white/20 text-gray-300'
                  : 'bg-gray-100 border-gray-200 text-gray-500'
              }`}
            >
              +{agent.capabilities.length - 3} more
            </span>
          )}
        </div>

        {/* Last Run */}
        {health?.lastRun && (
          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Last run: {formatDistanceToNow(new Date(health.lastRun), { addSuffix: true })}
          </div>
        )}

        {/* Version */}
        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          v{agent.version}
        </div>
      </div>

      {/* Hover glow effect */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${categoryStyle.gradient}`}
      />
    </motion.div>
  );
}
