'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/utils/trpc';
import { AgentCard } from '@/components/agents/AgentCard';
import { AgentHealthModal } from '@/components/agents/AgentHealthModal';

// Health status type definitions
type AgentStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline';

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
  status: AgentStatus;
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

const categoryColors = {
  content: 'from-purple-500/20 via-pink-500/20 to-purple-500/20',
  marketing: 'from-blue-500/20 via-cyan-500/20 to-blue-500/20',
  analytics: 'from-green-500/20 via-emerald-500/20 to-green-500/20',
  automation: 'from-orange-500/20 via-red-500/20 to-orange-500/20',
  support: 'from-indigo-500/20 via-violet-500/20 to-indigo-500/20',
};

const statusColors = {
  healthy: 'text-green-400 bg-green-500/10 border-green-500/30',
  degraded: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  unhealthy: 'text-red-400 bg-red-500/10 border-red-500/30',
  offline: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

const statusIcons = {
  healthy: '🟢',
  degraded: '🟡',
  unhealthy: '🔴',
  offline: '⚫',
};

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Fetch agents and health data
  const { data: agentsData, isLoading: agentsLoading } = trpc.agent.getAllAgents.useQuery();
  const {
    data: healthData,
    isLoading: healthLoading,
    refetch: refetchHealth,
  } = trpc.agent.getAllAgentHealth.useQuery();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetchHealth]);

  // Merge agent data with health data
  const agentsWithHealth =
    agentsData?.data?.map(agent => {
      const health = healthData?.data?.find(h => h.id === agent.id);
      return { ...agent, health };
    }) || [];

  // Filter and categorize agents
  const agentsByCategory = agentsWithHealth.reduce(
    (acc, agent) => {
      if (!acc[agent.category]) acc[agent.category] = [];
      acc[agent.category].push(agent);
      return acc;
    },
    {} as Record<string, typeof agentsWithHealth>
  );

  // Loading states
  if (agentsLoading || healthLoading) {
    return (
      <div
        className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-white'} transition-colors duration-300`}
      >
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}
    >
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}
              >
                Agent Performance Dashboard
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Real-time monitoring of all {agentsWithHealth.length} AI agents
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDarkMode(!darkMode)}
                className={`px-4 py-2 rounded-xl border transition-all duration-300 ${
                  darkMode
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                    : 'bg-gray-900/10 border-gray-300/30 text-gray-900 hover:bg-gray-900/20'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </motion.button>

              {/* Auto-refresh Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-xl border transition-all duration-300 ${
                  autoRefresh
                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                    : darkMode
                      ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                      : 'bg-gray-900/10 border-gray-300/30 text-gray-900 hover:bg-gray-900/20'
                }`}
              >
                {autoRefresh ? '🔄 Auto-refresh' : '⏸️ Paused'}
              </motion.button>

              {/* Manual Refresh */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => refetchHealth()}
                className={`px-4 py-2 rounded-xl border transition-all duration-300 ${
                  darkMode
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
                    : 'bg-blue-500/20 border-blue-500/30 text-blue-600 hover:bg-blue-500/30'
                }`}
              >
                🔄 Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Health Summary */}
        {healthData?.summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div
              className={`backdrop-blur-xl rounded-2xl border p-6 ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200/50'
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                System Health Overview
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {healthData.summary.total}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Total Agents
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {healthData.summary.healthy}
                  </div>
                  <div className="text-sm text-green-400">Healthy</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {healthData.summary.degraded}
                  </div>
                  <div className="text-sm text-yellow-400">Degraded</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {healthData.summary.unhealthy}
                  </div>
                  <div className="text-sm text-red-400">Unhealthy</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-400">
                    {healthData.summary.offline}
                  </div>
                  <div className="text-sm text-gray-400">Offline</div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {healthData.summary.avgResponseTime}ms
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Avg Response
                  </div>
                </div>

                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    {healthData.summary.avgUptime}%
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Avg Uptime
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Agent Categories */}
        <div className="space-y-8">
          {Object.entries(agentsByCategory).map(([category, agents], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <h2
                className={`text-2xl font-semibold mb-4 capitalize ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {category} Agents ({agents.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {agents.map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: categoryIndex * 0.1 + index * 0.05 }}
                  >
                    <AgentCard
                      agent={agent}
                      health={agent.health}
                      darkMode={darkMode}
                      onClick={() => setSelectedAgent(agent.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Agent Detail Modal */}
      <AnimatePresence>
        {selectedAgent && (
          <AgentHealthModal
            agentId={selectedAgent}
            darkMode={darkMode}
            onClose={() => setSelectedAgent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
