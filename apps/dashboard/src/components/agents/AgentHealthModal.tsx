'use client';

import { motion } from 'framer-motion';
import { trpc } from '@/utils/trpc';
import { formatDistanceToNow, format } from 'date-fns';

interface AgentHealthModalProps {
  agentId: string;
  darkMode: boolean;
  onClose: () => void;
}

export function AgentHealthModal({ agentId, darkMode, onClose }: AgentHealthModalProps) {
  const { data: agentData } = trpc.agent.getAllAgents.useQuery();
  const { data: healthData } = trpc.agent.getAgentHealth.useQuery({ id: agentId });
  const { data: logsData } = trpc.agent.getAgentLogs.useQuery({ id: agentId, limit: 10 });
  const performHealthCheck = trpc.agent.performHealthCheck.useMutation();

  const agent = agentData?.data?.find(a => a.id === agentId);
  const health = healthData?.data;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'degraded':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'unhealthy':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'offline':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'running':
        return 'text-blue-400';
      case 'failed':
        return 'text-red-400';
      case 'cancelled':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const handleHealthCheck = async () => {
    try {
      await performHealthCheck.mutateAsync({ id: agentId });
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border backdrop-blur-xl ${
          darkMode ? 'bg-gray-900/90 border-white/10' : 'bg-white/90 border-gray-200/50'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b ${darkMode ? 'border-white/10' : 'border-gray-200/50'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🤖</div>
              <div>
                <h2
                  className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                >
                  {agent?.name || agentId}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Agent Health Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleHealthCheck}
                disabled={performHealthCheck.isLoading}
                className={`px-4 py-2 rounded-lg border transition-all duration-300 ${
                  darkMode
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30'
                    : 'bg-blue-500/20 border-blue-500/30 text-blue-600 hover:bg-blue-500/30'
                }`}
              >
                {performHealthCheck.isLoading ? '🔄' : '🩺'} Health Check
              </motion.button>

              <button
                onClick={onClose}
                className={`p-2 rounded-lg hover:bg-gray-500/20 transition-colors ${
                  darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Health Status */}
            {health && (
              <div
                className={`rounded-xl border p-4 ${
                  darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200/50'
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Current Health Status
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(
                        health.status
                      )}`}
                    >
                      <span className="text-sm font-medium">{health.status.toUpperCase()}</span>
                    </div>
                    <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Status
                    </div>
                  </div>

                  <div className="text-center">
                    <div
                      className={`text-lg font-bold ${
                        health.responseTime < 200
                          ? 'text-green-400'
                          : health.responseTime < 500
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {health.responseTime}ms
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Response Time
                    </div>
                  </div>

                  <div className="text-center">
                    <div
                      className={`text-lg font-bold ${
                        health.uptime > 90
                          ? 'text-green-400'
                          : health.uptime > 70
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {health.uptime}%
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Uptime
                    </div>
                  </div>

                  <div className="text-center">
                    <div
                      className={`text-lg font-bold ${
                        health.errorRate < 5
                          ? 'text-green-400'
                          : health.errorRate < 15
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {health.errorRate.toFixed(1)}%
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Error Rate
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {health?.performance && (
              <div
                className={`rounded-xl border p-4 ${
                  darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200/50'
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Performance Metrics
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div
                      className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {health.performance.avgResponseTime}ms
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Avg Response Time
                    </div>
                  </div>

                  <div>
                    <div
                      className={`text-2xl font-bold ${
                        health.performance.successRate > 90
                          ? 'text-green-400'
                          : health.performance.successRate > 70
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}
                    >
                      {health.performance.successRate.toFixed(1)}%
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Success Rate
                    </div>
                  </div>

                  <div>
                    <div
                      className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {health.performance.totalExecutions}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total Executions
                    </div>
                  </div>

                  <div>
                    <div
                      className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      {health.performance.lastExecutionDuration || 'N/A'}
                      {health.performance.lastExecutionDuration && 'ms'}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Last Execution
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Agent Information */}
            {agent && (
              <div
                className={`rounded-xl border p-4 ${
                  darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200/50'
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Agent Information
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>ID:</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>{agent.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Category:</span>
                    <span className={`capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {agent.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Version:</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                      {agent.version}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Status:</span>
                    <span className={`capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {agent.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    Capabilities:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {agent.capabilities.map((capability, index) => (
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
                  </div>
                </div>
              </div>
            )}

            {/* Execution Logs */}
            {logsData && (
              <div
                className={`rounded-xl border p-4 ${
                  darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200/50'
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  Recent Execution Logs
                </h3>

                <div className="space-y-3">
                  {logsData.data.map(log => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-lg border ${
                        darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {log.action}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${getLogStatusColor(
                              log.status
                            )} bg-current/10`}
                          >
                            {log.status.toUpperCase()}
                          </span>
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatDistanceToNow(new Date(log.startTime), { addSuffix: true })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                            Started:
                          </span>
                          <span className={`ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {format(new Date(log.startTime), 'HH:mm:ss')}
                          </span>
                        </div>
                        {log.duration && (
                          <div>
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                              Duration:
                            </span>
                            <span className={`ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {log.duration}ms
                            </span>
                          </div>
                        )}
                      </div>

                      {log.error && (
                        <div className="mt-2 text-sm text-red-400">Error: {log.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
