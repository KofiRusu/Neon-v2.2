'use client';

import { useState, useEffect } from 'react';
import { api } from '../../utils/trpc';
import {
  ChartBarIcon,
  CpuChipIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlayIcon,
  PauseIcon,
  AcademicCapIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FireIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrainingLog {
  id: string;
  agentId: string;
  agentType: string;
  eventType: string;
  scoreBefore: number | null;
  scoreAfter: number | null;
  scoreDelta: number | null;
  modelVersion: string | null;
  retryCount: number;
  createdAt: Date;
}

interface ChartDataPoint {
  timestamp: Date;
  score?: number | null;
  scoreDelta?: number | null;
  eventType: string;
  agentType: string;
  agentId: string;
  modelVersion?: string | null;
  retryCount: number;
}

interface TrainingStats {
  totalEvents: number;
  avgScoreDelta: number;
  maxScore: number;
  minScore: number;
  totalRetries: number;
  eventTypeDistribution: Record<string, number>;
}

export default function TrainingPage(): JSX.Element {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | '90d'>(
    '7d'
  );
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [selectedAgentType, setSelectedAgentType] = useState<string>('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch performance chart data
  const { data: chartData, isLoading: chartLoading } = api.training.getPerformanceChart.useQuery({
    timeRange: selectedTimeRange,
    eventType: selectedEventType || undefined,
    agentType: selectedAgentType || undefined,
  });

  // Fetch training logs
  const { data: logsData, isLoading: logsLoading } = api.training.getTrainingLogs.useQuery({
    eventType: selectedEventType || undefined,
    agentType: selectedAgentType || undefined,
    limit: 50,
  });

  // Fetch training statistics
  const { data: statsData, isLoading: statsLoading } = api.training.getTrainingStats.useQuery({
    timeRange: selectedTimeRange,
    agentType: selectedAgentType || undefined,
  });

  // Fetch agent trends
  const { data: trendsData, isLoading: trendsLoading } = api.training.getAgentTrends.useQuery({
    timeRange: selectedTimeRange,
  });

  const eventTypeOptions = [
    { value: '', label: 'All Event Types' },
    { value: 'FINE_TUNING', label: 'Fine Tuning' },
    { value: 'RETRY', label: 'Retry' },
    { value: 'OPTIMIZATION', label: 'Optimization' },
    { value: 'PERFORMANCE_UPDATE', label: 'Performance Update' },
    { value: 'MODEL_SWITCH', label: 'Model Switch' },
    { value: 'VALIDATION', label: 'Validation' },
  ];

  const agentTypeOptions = [
    { value: '', label: 'All Agent Types' },
    { value: 'CONTENT', label: 'Content Agent' },
    { value: 'SEO', label: 'SEO Agent' },
    { value: 'EMAIL_MARKETING', label: 'Email Agent' },
    { value: 'SOCIAL_POSTING', label: 'Social Agent' },
    { value: 'CUSTOMER_SUPPORT', label: 'Support Agent' },
    { value: 'AD', label: 'Ad Agent' },
    { value: 'DESIGN', label: 'Design Agent' },
    { value: 'BRAND_VOICE', label: 'Brand Voice Agent' },
  ];

  // Prepare chart data for performance visualization
  const performanceChartData = {
    labels:
      chartData?.chartData?.map(point => new Date(point.timestamp).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Performance Score',
        data: chartData?.chartData?.map(point => point.score) || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Score Delta',
        data: chartData?.chartData?.map(point => point.scoreDelta) || [],
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };

  const performanceChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  };

  // Event type distribution chart
  const eventDistributionData = {
    labels: Object.keys(chartData?.stats?.eventTypeDistribution || {}),
    datasets: [
      {
        data: Object.values(chartData?.stats?.eventTypeDistribution || {}),
        backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  const eventDistributionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#e5e7eb',
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#f3f4f6',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
  };

  const getEventTypeIcon = (eventType: string) => {
    const iconMap: Record<string, any> = {
      FINE_TUNING: AcademicCapIcon,
      RETRY: ArrowTrendingUpIcon,
      OPTIMIZATION: BoltIcon,
      PERFORMANCE_UPDATE: ChartBarIcon,
      MODEL_SWITCH: CpuChipIcon,
      VALIDATION: CheckCircleIcon,
    };
    return iconMap[eventType] || FireIcon;
  };

  const getScoreDeltaColor = (delta: number | null) => {
    if (!delta) return 'text-gray-400';
    return delta > 0 ? 'text-neon-green' : delta < 0 ? 'text-neon-pink' : 'text-gray-400';
  };

  const formatEventType = (eventType: string): string => {
    return eventType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              <span className="text-neon-blue">Agent Learning</span> Tracker
            </h1>
            <p className="text-secondary text-lg">
              Monitor AI agent performance evolution and training insights
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Filters Toggle */}
            <button onClick={() => setShowFilters(!showFilters)} className="btn-neon-purple">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
              {showFilters ? (
                <ChevronDownIcon className="h-4 w-4 ml-2" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              )}
            </button>

            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={e => setSelectedTimeRange(e.target.value as any)}
              className="input-neon"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-6 glass p-6 rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Event Type</label>
                <select
                  value={selectedEventType}
                  onChange={e => setSelectedEventType(e.target.value)}
                  className="input-neon w-full"
                >
                  {eventTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Agent Type</label>
                <select
                  value={selectedAgentType}
                  onChange={e => setSelectedAgentType(e.target.value)}
                  className="input-neon w-full"
                >
                  {agentTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-blue rounded-xl flex items-center justify-center">
              <AcademicCapIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Total Events</div>
              <div className="stat-number">{statsData?.totalTrainingEvents || 0}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-green rounded-xl flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Avg Improvement</div>
              <div
                className={`stat-number ${getScoreDeltaColor(statsData?.avgScoreImprovement || 0)}`}
              >
                {statsData?.avgScoreImprovement
                  ? `${statsData.avgScoreImprovement > 0 ? '+' : ''}${statsData.avgScoreImprovement.toFixed(2)}%`
                  : '0%'}
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-purple rounded-xl flex items-center justify-center">
              <CpuChipIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Active Agents</div>
              <div className="stat-number">{statsData?.uniqueAgents || 0}</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-neon-pink rounded-xl flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <div className="text-xs text-secondary">Total Retries</div>
              <div className="stat-number">{statsData?.totalRetries || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 glass-strong p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-primary">Performance Trends</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
              <span className="text-xs text-secondary">Live Data</span>
            </div>
          </div>

          {chartLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
            </div>
          ) : (
            <div className="h-80">
              <Line data={performanceChartData} options={performanceChartOptions} />
            </div>
          )}
        </div>

        {/* Event Distribution */}
        <div className="glass-strong p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-primary mb-6">Event Distribution</h3>

          {chartLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
            </div>
          ) : (
            <div className="h-64">
              <Doughnut data={eventDistributionData} options={eventDistributionOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Training Logs */}
      <div className="glass-strong p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-primary">Recent Training Events</h2>
          <div className="flex items-center space-x-2">
            <EyeIcon className="h-5 w-5 text-secondary" />
            <span className="text-sm text-secondary">Click to expand details</span>
          </div>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {logsData?.logs?.map((log: TrainingLog) => {
              const EventIcon = getEventTypeIcon(log.eventType);
              const isExpanded = expandedLog === log.id;

              return (
                <div
                  key={log.id}
                  className="glass p-4 rounded-xl cursor-pointer hover:scale-[1.02] transition-all duration-300"
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                        <EventIcon className="h-5 w-5 text-white" />
                      </div>

                      <div>
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-primary">{log.agentType} Agent</h4>
                          <span className="px-2 py-1 bg-neon-blue/20 text-neon-blue text-xs rounded-full">
                            {formatEventType(log.eventType)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-secondary mt-1">
                          <span>ID: {log.agentId.substring(0, 8)}...</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                          {log.retryCount > 0 && (
                            <span className="text-neon-pink">Retries: {log.retryCount}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {log.scoreDelta !== null && (
                        <div className={`font-semibold ${getScoreDeltaColor(log.scoreDelta)}`}>
                          {log.scoreDelta > 0 ? '+' : ''}
                          {log.scoreDelta?.toFixed(2)}%
                        </div>
                      )}

                      {log.scoreAfter !== null && (
                        <div className="text-right">
                          <div className="text-xs text-secondary">Score</div>
                          <div className="font-semibold text-primary">
                            {log.scoreAfter?.toFixed(1)}%
                          </div>
                        </div>
                      )}

                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-secondary" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-secondary" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-secondary">Before Score</div>
                          <div className="font-medium text-primary">
                            {log.scoreBefore !== null ? `${log.scoreBefore.toFixed(1)}%` : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-secondary">After Score</div>
                          <div className="font-medium text-primary">
                            {log.scoreAfter !== null ? `${log.scoreAfter.toFixed(1)}%` : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-secondary">Model Version</div>
                          <div className="font-medium text-primary">
                            {log.modelVersion || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-secondary">Event ID</div>
                          <div className="font-mono text-xs text-secondary">{log.id}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {(!logsData?.logs || logsData.logs.length === 0) && (
              <div className="text-center py-12">
                <AcademicCapIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-primary mb-2">No Training Events Found</h3>
                <p className="text-secondary">
                  Training events will appear here as agents learn and improve.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
