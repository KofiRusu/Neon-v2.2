'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/utils/trpc';
import {
  X,
  Calendar,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Bot,
  Brain,
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
  Play,
  Pause,
  ArrowRight,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TimelineTask {
  id: string;
  agentType: string;
  stage: string;
  taskDescription: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: Date;
  endDate: Date;
  progress: number;
  dependencies: string[];
  estimatedDuration: number;
  actualDuration: number | null;
  resultScore: number | null;
}

interface CampaignTimelineProps {
  campaignId: string;
  onClose: () => void;
}

export function CampaignTimeline({ campaignId, onClose }: CampaignTimelineProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<TimelineTask | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch agent assignments for timeline
  const {
    data: assignmentsData,
    isLoading,
    refetch,
  } = trpc.campaign.getAgentAssignments.useQuery({
    id: campaignId,
  });

  // Auto-refresh data
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 10000); // Refresh every 10 seconds
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
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      case 'retrying':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
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
        return 'border-red-500 bg-red-500/10';
      case 'high':
        return 'border-orange-500 bg-orange-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  // Generate timeline data
  const timeline = assignmentsData?.data?.timeline || [];
  const stages = ['creative', 'launch', 'feedback', 'optimize', 'analyze'];

  // Calculate timeline dimensions
  const getTimelineWidth = () => {
    switch (selectedTimeframe) {
      case 'day':
        return 24 * 60; // 24 hours in minutes
      case 'week':
        return 7 * 24 * 60; // 7 days in minutes
      case 'month':
        return 30 * 24 * 60; // 30 days in minutes
      default:
        return 7 * 24 * 60;
    }
  };

  const getTimeSlots = () => {
    const slots = [];
    const totalMinutes = getTimelineWidth();
    const slotSize =
      selectedTimeframe === 'day' ? 60 : selectedTimeframe === 'week' ? 24 * 60 : 24 * 60;

    for (let i = 0; i < totalMinutes; i += slotSize) {
      const date = new Date(currentDate.getTime() + i * 60000);
      slots.push({
        date,
        label:
          selectedTimeframe === 'day'
            ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      });
    }
    return slots;
  };

  const getTaskPosition = (task: TimelineTask) => {
    const totalMinutes = getTimelineWidth();
    const timelineStart = currentDate.getTime();
    const taskStart = new Date(task.startDate).getTime();
    const taskEnd = new Date(task.endDate).getTime();

    const startPercent = ((taskStart - timelineStart) / (totalMinutes * 60000)) * 100;
    const width = ((taskEnd - taskStart) / (totalMinutes * 60000)) * 100;

    return {
      left: Math.max(0, startPercent),
      width: Math.max(2, width),
    };
  };

  const timeSlots = getTimeSlots();

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
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Campaign Timeline</h2>
                <p className="text-gray-400 text-sm">
                  Gantt-style agent task visualization with dependency tracking
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Timeframe Selector */}
              <div className="flex bg-gray-700/50 rounded-lg">
                {(['day', 'week', 'month'] as const).map(timeframe => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      selectedTimeframe === timeframe
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white'
                    } ${timeframe === 'day' ? 'rounded-l-lg' : timeframe === 'month' ? 'rounded-r-lg' : ''}`}
                  >
                    {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                  </button>
                ))}
              </div>

              {/* Date Navigation */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(
                        currentDate.getTime() -
                          (selectedTimeframe === 'day'
                            ? 24 * 60 * 60 * 1000
                            : selectedTimeframe === 'week'
                              ? 7 * 24 * 60 * 60 * 1000
                              : 30 * 24 * 60 * 60 * 1000)
                      )
                    )
                  }
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                </button>
                <span className="text-sm text-gray-300 min-w-24 text-center">
                  {currentDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
                <button
                  onClick={() =>
                    setCurrentDate(
                      new Date(
                        currentDate.getTime() +
                          (selectedTimeframe === 'day'
                            ? 24 * 60 * 60 * 1000
                            : selectedTimeframe === 'week'
                              ? 7 * 24 * 60 * 60 * 1000
                              : 30 * 24 * 60 * 60 * 1000)
                      )
                    )
                  }
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>

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
          {/* Timeline Grid */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading campaign timeline...</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Time Scale Header */}
                <div className="flex items-center mb-6">
                  <div className="w-48 flex-shrink-0"></div>
                  <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-2">
                    {timeSlots.map((slot, idx) => (
                      <div key={idx} className="text-xs text-gray-400 text-center">
                        {slot.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline Rows */}
                <div className="space-y-4">
                  {stages.map(stage => {
                    const stageTasks = timeline.filter(
                      (task: TimelineTask) => task.stage === stage
                    );

                    return (
                      <div key={stage} className="space-y-2">
                        {/* Stage Header */}
                        <div className="flex items-center space-x-3 py-2">
                          <div className="w-48 flex-shrink-0">
                            <h3 className="font-medium text-white capitalize">{stage} Stage</h3>
                            <p className="text-xs text-gray-400">{stageTasks.length} tasks</p>
                          </div>
                        </div>

                        {/* Tasks in Stage */}
                        {stageTasks.map((task: TimelineTask) => {
                          const position = getTaskPosition(task);

                          return (
                            <div
                              key={task.id}
                              className="flex items-center space-x-3 py-2 hover:bg-gray-800/20 rounded-lg transition-colors"
                            >
                              {/* Agent Info */}
                              <div className="w-48 flex-shrink-0 flex items-center space-x-3">
                                <div className="text-purple-400">
                                  {getAgentIcon(task.agentType)}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">{task.agentType}</p>
                                  <p className="text-xs text-gray-400 truncate">
                                    {task.taskDescription}
                                  </p>
                                </div>
                              </div>

                              {/* Timeline Bar */}
                              <div className="flex-1 relative h-8 bg-gray-800/30 rounded-lg overflow-hidden">
                                <div
                                  className={`absolute top-0 h-full rounded-lg transition-all duration-300 cursor-pointer ${getStatusColor(task.status)} ${getPriorityColor(task.priority)}`}
                                  style={{
                                    left: `${position.left}%`,
                                    width: `${position.width}%`,
                                  }}
                                  onClick={() => setSelectedTask(task)}
                                >
                                  <div className="h-full flex items-center justify-between px-2">
                                    <div className="flex items-center space-x-1">
                                      {getStatusIcon(task.status)}
                                      <span className="text-xs font-medium text-white">
                                        {Math.round(task.progress)}%
                                      </span>
                                    </div>
                                    {task.status === 'running' && (
                                      <div className="flex space-x-1">
                                        <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                        <div
                                          className="w-1 h-1 bg-white rounded-full animate-pulse"
                                          style={{ animationDelay: '0.1s' }}
                                        ></div>
                                        <div
                                          className="w-1 h-1 bg-white rounded-full animate-pulse"
                                          style={{ animationDelay: '0.2s' }}
                                        ></div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Progress Bar */}
                                  <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-full">
                                    <div
                                      className="h-full bg-white rounded-full transition-all duration-500"
                                      style={{ width: `${task.progress}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Dependencies */}
                                {task.dependencies.length > 0 && (
                                  <div className="absolute -top-1 -left-1">
                                    <ArrowRight className="w-3 h-3 text-yellow-400" />
                                  </div>
                                )}
                              </div>

                              {/* Task Status */}
                              <div className="w-20 flex-shrink-0 text-right">
                                <div
                                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                    task.status === 'running'
                                      ? 'bg-green-500/20 text-green-400'
                                      : task.status === 'completed'
                                        ? 'bg-blue-500/20 text-blue-400'
                                        : task.status === 'failed'
                                          ? 'bg-red-500/20 text-red-400'
                                          : 'bg-gray-500/20 text-gray-400'
                                  }`}
                                >
                                  {getStatusIcon(task.status)}
                                  <span>{task.status}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Task Details Panel */}
          <div className="w-80 bg-gray-800/30 border-l border-gray-700/50 overflow-y-auto">
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
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedTask.status === 'running'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                        : selectedTask.status === 'completed'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          : selectedTask.status === 'failed'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                    }`}
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
                    <p
                      className={`font-medium ${
                        selectedTask.priority === 'urgent'
                          ? 'text-red-400'
                          : selectedTask.priority === 'high'
                            ? 'text-orange-400'
                            : selectedTask.priority === 'medium'
                              ? 'text-yellow-400'
                              : 'text-green-400'
                      }`}
                    >
                      {selectedTask.priority}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Progress</p>
                    <p className="text-white font-medium">{Math.round(selectedTask.progress)}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-2">Timeline</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Start:</span>
                      <span className="text-white">
                        {new Date(selectedTask.startDate).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">End:</span>
                      <span className="text-white">
                        {new Date(selectedTask.endDate).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">
                        {selectedTask.actualDuration || selectedTask.estimatedDuration} minutes
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTask.dependencies.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs mb-2">Dependencies</p>
                    <div className="space-y-1">
                      {selectedTask.dependencies.map((depId, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm">
                          <ArrowRight className="w-3 h-3 text-yellow-400" />
                          <span className="text-gray-300">Task {depId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.resultScore && (
                  <div>
                    <p className="text-gray-400 text-xs mb-2">Result Score</p>
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
                        className={`text-sm font-medium ${
                          selectedTask.resultScore >= 0.8
                            ? 'text-green-400'
                            : selectedTask.resultScore >= 0.6
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }`}
                      >
                        {Math.round(selectedTask.resultScore * 100)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select a task to view timeline details</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
