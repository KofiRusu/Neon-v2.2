'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/utils/trpc';
import {
  X,
  Bot,
  Brain,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  Activity,
  Settings,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Target,
  MessageSquare,
  TrendingUp,
  Users,
  Mail,
  Palette,
  Search,
  Share2,
  Mic,
  BarChart3,
  Headphones,
  Brush,
  HeadphonesIcon,
} from 'lucide-react';

interface AgentTask {
  id: string;
  agentType: string;
  stage: string;
  taskDescription: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  resultScore: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  actualDuration: number | null;
  estimatedDuration: number;
  llmPrompt: string;
  llmResponse: string | null;
}

interface AgentOrchestrationMatrixProps {
  campaignId: string;
  onClose: () => void;
}

export function AgentOrchestrationMatrix({ campaignId, onClose }: AgentOrchestrationMatrixProps) {
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch agent assignments
  const {
    data: assignmentsData,
    isLoading,
    refetch,
  } = trpc.campaign.getAgentAssignments.useQuery({
    id: campaignId,
  });

  // Fetch agent logs
  const { data: logsData } = trpc.campaign.getAgentStageLogs.useQuery({
    id: campaignId,
  });

  // Auto-refresh data
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'ContentAgent':
        return <MessageSquare className="w-4 h-4" />;
      case 'AdAgent':
        return <Target className="w-4 h-4" />;
      case 'TrendAgent':
        return <TrendingUp className="w-4 h-4" />;
      case 'SupportAgent':
        return <Headphones className="w-4 h-4" />;
      case 'DesignAgent':
        return <Palette className="w-4 h-4" />;
      case 'SEOAgent':
        return <Search className="w-4 h-4" />;
      case 'SocialAgent':
        return <Share2 className="w-4 h-4" />;
      case 'EmailAgent':
        return <Mail className="w-4 h-4" />;
      case 'BrandVoiceAgent':
        return <Mic className="w-4 h-4" />;
      case 'InsightAgent':
        return <BarChart3 className="w-4 h-4" />;
      case 'WhatsAppAgent':
        return <MessageSquare className="w-4 h-4" />;
      case 'OutreachAgent':
        return <Users className="w-4 h-4" />;
      case 'MetricAgent':
        return <Activity className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500/20 border-green-500/50 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
      case 'failed':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'retrying':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'pending':
        return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="w-3 h-3 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3" />;
      case 'retrying':
        return <RefreshCw className="w-3 h-3 animate-spin" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const agentTypes = assignmentsData?.data?.agentTypes || [];
  const stages = assignmentsData?.data?.stages || [];
  const matrix = assignmentsData?.data?.matrix || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-800/50 border-b border-gray-700/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Agent Orchestration Matrix</h2>
                <p className="text-gray-400 text-sm">
                  Real-time multi-agent coordination and LLM execution tracking
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  autoRefresh
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                }`}
              >
                <Activity className="w-4 h-4 mr-2 inline" />
                {autoRefresh ? 'Live' : 'Manual'}
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Matrix Grid */}
          <div className="flex-1 overflow-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading orchestration matrix...</p>
                </div>
              </div>
            ) : (
              <div className="min-w-fit">
                {/* Header Row */}
                <div className="grid grid-cols-[200px_repeat(5,_1fr)] gap-4 mb-4">
                  <div className="font-semibold text-gray-400 text-sm uppercase tracking-wider">
                    Agent / Stage
                  </div>
                  {stages.map(stage => (
                    <div
                      key={stage}
                      className="text-center font-semibold text-gray-400 text-sm uppercase tracking-wider"
                    >
                      {stage}
                    </div>
                  ))}
                </div>

                {/* Agent Rows */}
                <div className="space-y-3">
                  {agentTypes.map(agentType => (
                    <div key={agentType} className="grid grid-cols-[200px_repeat(5,_1fr)] gap-4">
                      {/* Agent Name */}
                      <div className="flex items-center space-x-3 py-3 px-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                        <div className="text-purple-400">{getAgentIcon(agentType)}</div>
                        <span className="font-medium text-white text-sm">{agentType}</span>
                      </div>

                      {/* Stage Cells */}
                      {stages.map(stage => {
                        const task = matrix[stage]?.find(
                          (t: AgentTask) => t.agentType === agentType
                        );

                        return (
                          <div
                            key={`${agentType}-${stage}`}
                            className={`relative p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-105 ${
                              task
                                ? getStatusColor(task.status)
                                : 'bg-gray-800/20 border-gray-700/30 text-gray-500'
                            } ${task?.status === 'running' ? 'animate-pulse' : ''}`}
                            onClick={() => task && setSelectedTask(task)}
                          >
                            {task ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(task.status)}
                                    <span
                                      className={`text-xs font-medium ${getPriorityColor(task.priority)}`}
                                    >
                                      {task.priority}
                                    </span>
                                  </div>
                                  {task.resultScore && (
                                    <span
                                      className={`text-xs font-medium ${getScoreColor(task.resultScore)}`}
                                    >
                                      {Math.round(task.resultScore * 100)}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-300 line-clamp-2">
                                  {task.taskDescription}
                                </p>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400">
                                    {task.actualDuration
                                      ? `${task.actualDuration}min`
                                      : `~${task.estimatedDuration}min`}
                                  </span>
                                  {task.status === 'running' && (
                                    <div className="flex space-x-1">
                                      <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
                                      <div
                                        className="w-1 h-1 bg-current rounded-full animate-pulse"
                                        style={{ animationDelay: '0.1s' }}
                                      ></div>
                                      <div
                                        className="w-1 h-1 bg-current rounded-full animate-pulse"
                                        style={{ animationDelay: '0.2s' }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center text-xs text-gray-500">No task</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Task Details Panel */}
          <div className="w-96 bg-gray-800/30 border-l border-gray-700/50 overflow-y-auto">
            <div className="p-4 border-b border-gray-700/30">
              <h3 className="font-semibold text-white">Task Details</h3>
            </div>

            {selectedTask ? (
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-purple-400">{getAgentIcon(selectedTask.agentType)}</div>
                    <div>
                      <h4 className="font-medium text-white">{selectedTask.agentType}</h4>
                      <p className="text-gray-400 text-sm capitalize">{selectedTask.stage} Stage</p>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTask.status)}`}
                  >
                    {selectedTask.status}
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Task Description</p>
                  <p className="text-white text-sm">{selectedTask.taskDescription}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs">Priority</p>
                    <p className={`font-medium ${getPriorityColor(selectedTask.priority)}`}>
                      {selectedTask.priority}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Duration</p>
                    <p className="text-white font-medium">
                      {selectedTask.actualDuration
                        ? `${selectedTask.actualDuration} min`
                        : `~${selectedTask.estimatedDuration} min`}
                    </p>
                  </div>
                </div>

                {selectedTask.resultScore && (
                  <div>
                    <p className="text-gray-400 text-xs">Result Score</p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-700/50 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            selectedTask.resultScore >= 0.8
                              ? 'bg-green-500'
                              : selectedTask.resultScore >= 0.6
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${selectedTask.resultScore * 100}%` }}
                        />
                      </div>
                      <span
                        className={`text-sm font-medium ${getScoreColor(selectedTask.resultScore)}`}
                      >
                        {Math.round(selectedTask.resultScore * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-gray-400 text-sm mb-2">LLM Prompt</p>
                  <div className="bg-gray-700/30 rounded-lg p-3 text-xs text-gray-300 font-mono">
                    {selectedTask.llmPrompt}
                  </div>
                </div>

                {selectedTask.llmResponse && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">LLM Response</p>
                    <div className="bg-gray-700/30 rounded-lg p-3 text-xs text-gray-300">
                      {selectedTask.llmResponse}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>
                    {selectedTask.startedAt
                      ? `Started: ${new Date(selectedTask.startedAt).toLocaleTimeString()}`
                      : 'Not started'}
                  </span>
                  {selectedTask.completedAt && (
                    <span>
                      Completed: {new Date(selectedTask.completedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {/* Task Controls */}
                <div className="pt-4 border-t border-gray-700/30 flex space-x-2">
                  <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                    View Logs
                  </button>
                  <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                    Retry Task
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bot className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select a task to view details</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
